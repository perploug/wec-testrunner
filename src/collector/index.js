const websiteEvidenceCollector = require("website-evidence-collector/index.js");
const StandardLogger = require("website-evidence-collector/lib/logger.js");
const StandardWecConfig = require("website-evidence-collector/config.js");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fb = require("../helpers/feedback");
const { nanoid } = require("nanoid");
const { isRegExp } = require("util/types");

function generateUrlObj(url) {
  return {
    url: url,
    label: url.replace("https://").replace("http://"),
    id: url.replace(/\W/g, ""),
  };
}

function generateIdOnUrlObj(urlObj) {
  //in most cases we won't need an id as it comes from the url
  if (urlObj.id) return;

  // ensure uniqueness
  urlObj.id = urlObj.url.replace(/\W/g, "");

  // for simple mapping of a variant with a config change
  // this should be documented...
  if (urlObj.variant) {
    urlObj.id = urlObj.id + "_" + urlObj.variant;
  }

  // if we have a config object, we attach a unique key to ensure that different configs are stored seperately
  if (urlObj.config) {
    urlObj.id + urlObj.id + "_" + nanoid(5);
  }
}

module.exports = function (rootfolder) {
  this.urls = {};
  this.rootFolder = rootfolder;
  this.folder = "evidence";

  this.collectSuite = async function (suite) {
    const collector = this;

    // clean-up
    rimraf.sync(path.join(collector.rootFolder, collector.folder, suite.name));
    fs.mkdirSync(
      path.join(collector.rootFolder, collector.folder, suite.name),
      { recursive: true }
    );

    // here we will prepared the config on the suite, this can then be altered in the eventing
    let workingConfig = StandardWecConfig("");
    workingConfig.quite = true;
    workingConfig.json = false;
    workingConfig.yaml = false;
    workingConfig.html = false;
    workingConfig.output = false;

    if (suite.collect.config) {
      workingConfig = { ...workingConfig, ...suite.collect.config };
    }

    let urls = [];
    suite.collect.urls.forEach((x) => {
      if (typeof x === "string") {
        urls.push(generateUrlObj(x));
      } else {
        urls.push(x);
      }
    });

    fb("Scanning " + suite.name, "info");
    fb("Scanning the following " + urls.length + " urls:", "info");
    fb(urls.map((x) => x.url).join(", "));

    if (suite.collect.hasOwnProperty("beforeAll")) {
      var response = await suite.collect.beforeAll(collector, {
        suite,
        config: workingConfig,
      });
      if (response === false) {
        fb("Skipping " + suite.name, "error");
        return;
      }
    }

    for (const url of urls) {
      await this.collectUrl(url, suite, workingConfig);
    }

    // storing the index file of all urls scanned, otherwise its impossible to track what and in which variant it was scanned
    const indexFile = `${collector.rootFolder}/${collector.folder}/${suite.name}/_targets`;
    fs.writeFileSync(indexFile, JSON.stringify(this.urls, null, 2));

    if (suite.collect.hasOwnProperty("afterAll")) {
      await suite.collect.afterAll(collector, { suite, config: workingConfig });
    }
  };

  this.collectUrl = async function (target, suite, config) {
    const collector = this;

    // we need to normalise our url object, so we always have an ID, url, and label
    if (typeof target === "string") {
      target = generateUrlObj(target);
    } else {
      generateIdOnUrlObj(target);
    }

    // ensure we only run each target once
    if (collector.urls[target.id]) {
      fb("Skipping: " + target.url, "error");
      return;
    }

    // we add it as an indexed value
    collector.urls[target.id] = target;

    // if there is a config attached to the target, we add it
    if (target.config) {
      config = { ...config, ...target.config };
    }

    config.url = target.url;

    if (suite.collect.hasOwnProperty("beforeEach")) {
      var response = await suite.collect.beforeEach(collector, {
        suite,
        config,
        target,
      });
      if (response === false) {
        fb("Skipping: " + target.url, "error");
        return;
      }
    }

    try {
      fb(`Scanning: ${target.url}`, "info");

      const log = StandardLogger.create({ console: { silent: true } });
      const json = await websiteEvidenceCollector(config, log);

      const outputFile = `${collector.rootFolder}/${collector.folder}/${suite.name}/${target.id}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));

      if (suite.collect.hasOwnProperty("afterEach")) {
        await suite.collect.afterEach(collector, {
          suite,
          config,
          target,
          data: json,
        });
      }
    } catch (ex) {
      fb(ex, "error");
      throw ex;
    }
  };
};

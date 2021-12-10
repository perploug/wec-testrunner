//const websiteEvidenceCollector = require("website-evidence-collector/index.js");

const wecCollector = require("website-evidence-collector/collector/index");
const wecInspector = require("website-evidence-collector/inspector/index");

const StandardLogger = require("website-evidence-collector/lib/logger.js");
const StandardWecConfig = require("website-evidence-collector/config.js");

const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const fb = require("../helpers/feedback");
const { nanoid } = require("nanoid");

function generateUrlObj(url) {
  return {
    url: url,
    label: url.replace("https://").replace("http://"),
    id: url.replace(/\W/g, ""),
  };
}

function generateIdOnUrlObj(urlObj) {
  if (!urlObj.label) {
    urlObj.label = urlObj.url.replace("https://").replace("http://");
  }
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

    fb("Collecting " + suite.name, "info");
    fb("Collecting from the following " + urls.length + " targets:", "info");
    fb(urls.map((x) => x.label).join(", "));

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
      fb("Skipping: " + target.label, "error");
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
        fb("Skipping: " + target.label, "error");
        return;
      }
    }

    try {
      fb(`Collecting from: ${target.label}`, "info");

      const logger = StandardLogger.create({ console: { silent: true } });

      // collector
      const collect = await wecCollector(config, logger);
      await collect.createSession();

      // here we hook up browse events, so that we can control what happens before and after
      // a browse happens
      if (suite.collect.hasOwnProperty("beforeEachBrowse")) {
        collect.pageSession.beforeBrowse = async function (session, context) {
          context.target = target;
          context.suite = suite;

          await suite.collect.beforeEachBrowse(collect, context);
        };
      }

      if (suite.collect.hasOwnProperty("afterEachBrowse")) {
        collect.pageSession.afterBrowse = async function (session, context) {
          context.target = target;
          context.suite = suite;

          await suite.collect.afterEachBrowse(collect, context);
        };
      }

      await collect.testConnection();
      await collect.getPage();
      await collect.collectAll();
      await collect.endSession();

      // inspector
      const inspect = await wecInspector(
        config,
        logger,
        collect.pageSession,
        collect.output
      );
      await inspect.inspectAll();

      const outputFile = `${collector.rootFolder}/${collector.folder}/${suite.name}/${target.id}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(collect.output, null, 2));

      if (suite.collect.hasOwnProperty("afterEach")) {
        await suite.collect.afterEach(collector, {
          suite,
          config,
          target,
          data: collect.output,
        });
      }
    } catch (ex) {
      fb(ex, "error");
      throw ex;
    }
  };
};

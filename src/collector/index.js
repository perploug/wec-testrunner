const websiteEvidenceCollector = require("website-evidence-collector/index.js");
const StandardLogger = require("website-evidence-collector/lib/logger.js");
const StandardWecConfig = require("website-evidence-collector/config.js");

const fs = require("fs");
const fb = require("../helpers/feedback");

module.exports = function (rootfolder) {
  this.urls = [];
  this.rootFolder = rootfolder;
  this.folder = "evidence";

  this.done = function () {
    return urls.length === 0;
  };

  this.collectSuite = async function (suite) {
    const collector = this;

    let urls = [];
    if (typeof suite.collect.urls === "string") {
      urls.push(suite.collect.urls);
    } else {
      urls = urls.concat(suite.collect.urls);
    }

    fb("Scanning " + suite.name, "info");
    fb("Scanning the following " + urls.length + " urls:", "info");
    fb(urls);

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

    if (suite.collect.hasOwnProperty("afterAll")) {
      await suite.collect.afterAll(collector, { suite, config: workingConfig });
    }
  };

  this.collectUrl = async function (url, suite, config) {
    const collector = this;

    // ensure we only run each target once
    if (collector.urls.includes(url)) {
      fb("Skipping: " + url, "error");
      return;
    }
    collector.urls.push(url);
    config.url = url;

    if (suite.collect.hasOwnProperty("beforeEach")) {
      var response = await suite.collect.beforeEach(collector, {
        suite,
        config,
        url,
      });
      if (response === false) {
        fb("Skipping: " + url, "error");
        return;
      }
    }

    try {
      const name = url.replace(/\W/g, "");

      fs.mkdirSync(
        `${collector.rootFolder}/${collector.folder}/${suite.name}`,
        {
          recursive: true,
        }
      );

      fb(`Scanning: ${url}`, "info");
      const log = StandardLogger.create({ console: { silent: true } });
      const json = await websiteEvidenceCollector(config, log);

      try {
        fb(
          `Cookies: ${json.cookies.length}, Beacons: ${json.beacons.length}, Hosts: ${json.hosts.requests.thirdParty.length}`
        );
      } catch (ex) {
        fb(ex, "error");
      }

      const outputFile = `${collector.rootFolder}/${collector.folder}/${suite.name}/${name}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(json, null, 2));

      if (suite.collect.hasOwnProperty("afterEach")) {
        await suite.collect.afterEach(collector, {
          suite,
          config,
          url,
          data: json,
        });
      }
    } catch (ex) {
      fb(ex, "error");
      throw ex;
    }
  };
};

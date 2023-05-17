const path = require("path");
const fs = require("fs");
const { report } = require("process");

module.exports = function (rootFolder) {
  this.rootFolder = rootFolder;
  this.folder = "reports";

  function _getTestResults(folder) {
    var p = path.join(folder, "tests", "_all.json");
    var result = fs.readFileSync(p, "utf8");
    return JSON.parse(result);
  }

  this.generateReports = async function (testSuites, reporters) {
    var testSuiteResults = _getTestResults(this.rootFolder);

    if (!fs.existsSync(path.join(this.rootFolder, this.folder))) {
      fs.mkdirSync(path.join(this.rootFolder, this.folder));
    }

    for (const suite of testSuiteResults) {
      for (const target of suite.targets) {
        const result = fs.readFileSync("output" + target.file, "utf8");
        target.evidence = JSON.parse(result);
      }
    }

    for (const reporter of reporters) {
      reporter.context.rootFolder = this.rootFolder;
      reporter.context.reporter = this;
      reporter.context.folder = this.folder;

      await reporter.generateReport(testSuiteResults, testSuites);
    }
  };
};

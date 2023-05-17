const collector = require("./collector/");
const testrunner = require("./testrunner/");
const reporter = require("./reporter/");

const requirefolder = require("require-folder");
const fs = require("fs");

// target can be filestring, folderstring, require, or array of require
// args is the standard arguments object
//output,

function _addComponent(component, collection) {
  if (typeof component === "string") {
    if (component.endsWith(".js")) {
      collection.push(require(component));
    } else {
      Object.values(requirefolder(component)).map((x) => {
        collection.push(x);
      });
    }

    return;
  }

  if (component instanceof Array) {
    collection = collection.concat(component);
    return;
  }

  if (typeof component === "object") {
    collection.push(component);
    return;
  }
}

function m(args) {
  this.testSuites = [];
  this.reporters = [];

  this.addReporter = function (reporter) {
    _addComponent(reporter, this.reporters);
  };

  this.addTestSuite = function (testSuite) {
    _addComponent(testSuite, this.testSuites);
  };

  this.collect = async function () {
    var collector_instance = new collector(args.output);

    for (const suite of this.testSuites) {
      await collector_instance.collectSuite(suite);
    }
  };

  this.test = async function () {
    var test_instance = new testrunner(args.output);
    await test_instance.testSuites(this.testSuites);
  };

  this.report = async function () {
    var reporter_instance = new reporter(args.output);

    await reporter_instance.generateReports(this.testSuites, this.reporters);
  };
}

module.exports = m;

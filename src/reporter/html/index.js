const Handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");

const wecReporter = require("website-evidence-collector/reporter/index");

module.exports = function (context = {}, args = {}) {
  this.context = context;
  this.args = args;

  const defaultTemplate = path.join(__dirname, "template.html");

  this.generateReport = async function (testSuiteResults, testSuites) {
    const reporter = this;

    rimraf.sync(
      path.join(reporter.context.rootFolder, reporter.context.folder, "html")
    );

    fs.mkdirSync(
      path.join(reporter.context.rootFolder, reporter.context.folder, "html")
    );

    let workingTemplate = defaultTemplate;

    if (reporter.args.template) {
      workingTemplate = reporter.args.template;
    }

    const template = Handlebars.compile(
      fs.readFileSync(workingTemplate, "utf8")
    );

    const reportFolder = path.join(
      reporter.context.rootFolder,
      reporter.context.folder,
      "html"
    );

    testSuiteResults.sort((a, b) => (a.tests_failed < b.tests_failed ? 1 : -1));
    testSuiteResults.forEach((suiteTest) => {
      suiteTest.targets.forEach((target) => {
        target.tests = target.tests.sort((a, b) =>
          a.pass === b.pass ? 0 : a ? -1 : 1
        );
      });

      suiteTest.targets = suiteTest.targets.sort((a, b) =>
        a.tests_failed < b.tests_failed ? 1 : -1
      );
    });

    for (const suite of testSuiteResults) {
      for (const target of suite.targets) {
        const wecReport = wecReporter({ output: reportFolder });
        wecReport.generateHtml(target.evidence, target.id + ".html", false);
      }
    }

    fs.writeFileSync(
      path.join(reportFolder, "testreport.html"),
      template({ tests: testSuiteResults, suites: testSuites })
    );
  };
};

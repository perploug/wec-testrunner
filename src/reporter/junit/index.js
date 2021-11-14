const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");

module.exports = function (context = {}, args = {}) {
  this.context = context;
  this.args = args;

  this.generateReport = async function (testSuiteResults, testSuites) {
    const reporter = this;
    rimraf.sync(
      path.join(reporter.context.rootFolder, reporter.context.folder, "junit")
    );
    fs.mkdirSync(
      path.join(reporter.context.rootFolder, reporter.context.folder, "junit")
    );

    // we instantiate the junit report builder
    const builder = require("junit-report-builder");

    // we don't group by testSuite, as we would then run out of categories in the junit format
    for (const testSuiteResult of testSuiteResults) {
      // instead we group by scan targets and label as such
      for (const target of testSuiteResult.targets) {
        const testsuite = builder.testSuite().name(target.label);

        // for each test we executed against the target, we make a report entry
        for (const test of target.tests) {
          const testCase = testsuite
            .testCase()
            .className(
              target.label + "." + test.label.replace(/ /gi, ".").toLowerCase()
            )
            .name(test.labl);

          if (!test.pass) {
            testCase.failure(test.message);
            testCase.error(test.message);
            testCase.stacktrace(test.stacktrace);
            testCase.standardError(test.message);
            testCase.failed = true;
          } else {
            testCase.failed = false;
          }
        }
      }

      builder.writeTo(
        path.join(
          reporter.context.rootFolder,
          reporter.context.folder,
          "junit",
          "testreport.xml"
        )
      );
    }
  };
};

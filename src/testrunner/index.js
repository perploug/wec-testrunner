const fs = require("fs");
const path = require("path");
const fb = require("../helpers/feedback");
const stripAnsi = require("strip-ansi");
const rimraf = require("rimraf");

module.exports = function (rootfolder) {
  this.urls = [];
  this.rootFolder = rootfolder;
  this.folder = "tests";

  // we need this to collect reports from the evidence
  function getEvidence(directoryPath) {
    if (fs.existsSync(directoryPath)) {
      if (fs.existsSync(path.join(directoryPath, "_targets"))) {
        return JSON.parse(
          fs.readFileSync(path.join(directoryPath, "_targets"), "utf8")
        );
      } else {
        var urls = {};
        fs.readdirSync(directoryPath).forEach((file) => {
          if (file.endsWith(".json")) {
            file = file.substring(0, file.length - 5);
            urls[file] = { id: file };
          }
        });
      }
    }
    return {};
  }

  this.testSuites = async function (suites) {
    const testRunner = this;
    // clean up
    rimraf.sync(path.join(testRunner.rootFolder, testRunner.folder));
    fs.mkdirSync(path.join(testRunner.rootFolder, testRunner.folder));

    const testResults = [];
    for (const suite of suites) {
      testResults.push(await testRunner.testSuite(suite));
    }

    const outputFile = `${testRunner.rootFolder}/${testRunner.folder}/_all.json`;
    fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
    return testResults;
  };

  this.testSuite = async function (suite) {
    const testRunner = this;
    const directoryPath = path.join(
      testRunner.rootFolder,
      "evidence",
      suite.name
    );
    var evidence = getEvidence(directoryPath);

    if (suite.test.hasOwnProperty("beforeAll")) {
      await suite.test.beforeAll(testRunner, {
        suite,
        config: suite.test.config,
        data: evidence,
      });
    }

    fb("Testing " + suite.name, "info");

    const suiteTest = { suite: suite.name, targets: [], pass: true };

    for (const evidencefile of Object.values(evidence)) {
      const path = "/evidence/" + suite.name + "/" + evidencefile.id + ".json";
      const file = fs.readFileSync(testRunner.rootFolder + path);
      const evidence = JSON.parse(file);

      const urlTest = { ...evidencefile, file: path, tests: [], pass: true };
      urlTest.url = evidence.uri_ins;
      if (!urlTest.label) {
        urlTest.label = `${suite.name}: ${evidence.uri_ins
          .replace("https://", "")
          .replace("http://", "")}`;
      }

      suiteTest.targets.push(urlTest);

      for (const [key, value] of Object.entries(suite.test.cases)) {
        const testCase = { label: key, pass: true };
        urlTest.tests.push(testCase);

        if (suite.test.hasOwnProperty("beforeEach")) {
          await suite.test.beforeEach(testRunner, {
            suite,
            config: suite.test.config,
            data: evidence,
            test: testCase,
            target: urlTest,
          });
        }

        try {
          value(evidence, suite.test.config);
          testCase.pass = true;
          console.log(` 🟢 ${key}`);
        } catch (ex) {
          testCase.message = stripAnsi(ex.message);
          testCase.stacktrace = stripAnsi(ex.stacktrace);

          if (!ex.message) {
            testCase.message = ex;
          }

          testCase.pass = false;
          urlTest.pass = false;
          suiteTest.pass = false;

          console.log(` 🔴 ${key}`);
          console.error(testCase.message);
        }

        if (suite.test.hasOwnProperty("afterEach")) {
          await suite.test.afterEach(testRunner, {
            suite,
            config: suite.test.config,
            data: evidence,
            test: testCase,
          });
        }
      }

      urlTest.tests_total = urlTest.tests.length;
      urlTest.tests_passed = urlTest.tests.filter((x) => x.pass).length;
      urlTest.tests_failed = urlTest.tests.filter((x) => !x.pass).length;
    }

    suiteTest.tests_total = suiteTest.targets.reduce(function (prev, cur) {
      return prev + cur.tests_total;
    }, 0);
    suiteTest.tests_passed = suiteTest.targets.reduce(function (prev, cur) {
      return prev + cur.tests_passed;
    }, 0);
    suiteTest.tests_failed = suiteTest.targets.reduce(function (prev, cur) {
      return prev + cur.tests_failed;
    }, 0);

    suiteTest.targets_total = suiteTest.targets.length;
    suiteTest.targets_passed = suiteTest.targets.filter((x) => x.pass).length;
    suiteTest.targets_failed = suiteTest.targets.filter((x) => !x.pass).length;

    if (suite.test.hasOwnProperty("afterAll")) {
      await suite.test.afterAll(testRunner, {
        suite,
        config: suite.test.config,
        data: evidence,
        testResult: suiteTest,
      });
    }

    console.log("");
    const outputFile = `${testRunner.rootFolder}/${testRunner.folder}/${suite.name}.json`;
    fs.mkdirSync(`${testRunner.rootFolder}/${testRunner.folder}`, {
      recursive: true,
    });
    fs.writeFileSync(outputFile, JSON.stringify(suiteTest, null, 2));
    return suiteTest;
  };
};

const wecTestRunner = require("../src/index");
const website1Tests = require("./tests/website1");
const website2Tests = require("./tests/website2");

const junitReporter = require("../src/reporter/junit");
const htmlReporter = require("../src/reporter/html");

async function run() {
  // outputs everything to ./output
  const wtr = new wecTestRunner({ output: __dirname + "/output" });

  // load the test modules you want

  // this is a simple website test with manually setup assertions - use this as a start
  wtr.addTestSuite(website1Tests);

  // this is the kitchen sink, using every possible option on the test suite spec
  // use this to learn about every possible option available.
  wtr.addTestSuite(website2Tests);

  // Alternative, load all .js files from ./tests
  //wtr.addTestSuite(__dirname + "/tests");

  // first we collect the evidence - this will end up in /output/evidence
  await wtr.collect();

  // then we run our tests against the evidence - this will end up in /output/tests
  await wtr.test();

  // and then we report our findings - this will end up in /output/reports
  // junit will generate a testresult.xml in /output/reports/junit
  wtr.addReporter(new junitReporter());
  // htmlreporter will generate a testreport.html in /output/reports/html
  wtr.addReporter(new htmlReporter());

  // awaut the whole thing to run
  await wtr.report();
}

// run the wrapping function
run();

# WecRunner

The WEC Testrunner is a wrapper around the [Website Evidence Collector (WEC)]() to script automated compliance checks 
against one or more websites.

While WEC is an excellent compliance test of a single website's compliance following the guidelines of the [EDPS](), it is 
intended to be a standalone tool for auditors to use. This testrunner allows you to script compliance checks and
execute an automated suite of tests against the collected evidence. 

This allows you detect if your usage of 3rd party scripts have changed, based on your own ruleset, such as:

- Does the website load any facebook or google resources?
- Does the website conform to only loading beacons from a list of allowed domains? 
- Does the website confirm with the consent rules?

And generate a user friendly display of all your compliance tests in either html or CI/CD friendly Junit-Xml format:

![Html Report](assets/report.png)

## Testing a site
The runner depends on your writing a test suite for each specific web property you want to test, this test suite can 
execute any number of urls such as website.com and website.com/store.

Each url will be checked against a set of defined test cases, which can be any code or assertion defined by you - the testrunner ships
with the Jest `expect` library for simple test assertions. 

### creating a test suite
Each test suite is a standard CommonJS module which exports a basic list of URLs and tests to excute on each URL. Besides the basics, 
each test suite can also be extended with custom configuration for collecting evidence and executing texts as well as eventhandlers to modify the context for each test or collection. 

[Please see the /demo folder for a more complete overview](/demo)

A basic testsuite could look like this: 

```
const expect = require("expect");

module.exports = {
  name: "Website",

  collect: {
    urls: ["https://website.de", "https://website.de/english"],
  },

  test: {
    
    cases: {
      "Website do not load google.com assets": (report){
        expect(report.hosts.requests.thirdParty).not().toContain("google.com");
      }
    },
  },
};
```

In case you want to centralise allow/block lists, there is also the option of 
setting a config which is passed to all tests:

```
test: {
    config: {
      blocked: ["google.com, "facebook.com", "instagram.com"]
    }
    cases: {
      "Website do not load SoMe assets": (report, config){
        config.blocked.forEach(domain => {
          expect(report.hosts.requests.thirdParty).not().toContain(domain);
        });
      }
    },
  },
```

### Loading and running tests

When you have written one or more test suites, you need to setup the test runner to load and execute. This follows
the pattern of: 1. Collect the evidence, 2. Execute Tests, 3. Report the findings. 

A standard execution could look like this:

```
// import the runner
const wecTestRunner = require("wecrunner");
const singleTestCase = require("./tests/websitetest");

// import the needed reporters (or write your own)
const junitReporter = require("wecrunner/reporter/junit/");
const htmlReporter = require("wecrunner/reporter/html/");

async function run() {
  // specify where the output of the collected data and reports would be placed
  const wtr = new wecTestRunner({ output: __dirname + "/output" });

  // this adds a single test case as an object
  wtr.addTestSuite(singleTestCase);

  // alternative way, load all .js files in ./tests 
  wtr.addTestSuite(__dirname + "/tests");

  // collect evidence with WEC
  //await wtr.collect();

  // Execute all tests against the collected evidence
  await wtr.test();

  // and then we report our findings

  // this generates a Junit compatible xml file, useful for CI/CD based testing
  wtr.addReporter(new junitReporter());

  // Generates a html view for manual review, sending by email, etc. 
  wtr.addReporter(new htmlReporter());
  await wtr.report();
}

// execute the whole thing
run();
```


### Built-in Assertions
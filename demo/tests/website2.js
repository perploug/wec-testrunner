const assertions = require("../shared/assertions");
const allowed = require("../shared/allowed");
const expect = require("expect");
const standardTests = require("../shared/standardtests");

module.exports = {
  name: "My Website",

  collect: {
    urls: ["https://website.com", "https://website.com/videos"],

    config: {
      collectSampleVideos: true,
    },

    beforeAll: async function (collector, context) {
      // if its friday, don't collect the video sample pages
      if (Date.now().getDay() === 5) {
        context.config.collectSampleVideos = false;
      }
    },

    beforeEach: async function (collector, context) {
      // before events can return false to indicate a given url should be skipped, so lets skip all urls with the word frog
      if (context.url.indexOf("frog") > -1) return false;
    },

    afterEach: async function (collector, context) {
      // if the url starts with /videos, look for sub pages to queue for sample testing
      // notice how we also use the config flag from context.config
      if (
        context.config.collectSampleVideos &&
        context.url.indexOf("/videos") > 0
      ) {
        // in this sample, we look for all links in the WEC data object which contains /video/
        var links = context.data.links.thirdParty.filter(
          (x) => x.href.indexOf("/video/") > 0
        );

        console.log(" ℹ️  " + links.length + " video pages found");

        if (links.length > 20) {
          links = links.slice(0, 20);
        }

        // we then tell the collector instance to collect evidence on this urls as well, as part of our tests
        for (const link of links) {
          await collector.collectUrl(link.href, context.suite, context.config);
        }
      }
    },

    afterAll: async function (collector, context) {
      console.log("We are done!");
    },
  },

  test: {
    // we are extending the config with a shared allowed object, which we use to store allowed hosts etc in.
    config: { allowed: allowed },

    // for this specific test suite, we would like to add some additional hosts to the allowed set
    beforeAll: async function (testRunner, context) {
      // context: {suite, config, data}

      context.config.allowed.hosts = context.config.allowed.hosts.concat([
        "fonts.gstatic.com",
        "fonts.googleapis.com",
      ]);
    },

    beforeEach: async function (testRunner, context) {
      // context {suite, config, data, test}

      if (
        context.data.url_ins.indexOf("video") &&
        context.test.label.indexOf("videotest")
      ) {
        // for a specific test on /video pages, only allow vimeo.com beacons
        // this is used in the standardTests and is an expected configuration

        context.config.allowed.beacons = ["vimeo.com"];
      }
    },

    // we extend our test cases with a standardTests module, which we want to run against all sites
    // our tests expects a config.allowed configuration to function.
    cases: {
      ...standardTests,

      "Our report contains the word evidence": (data, config) => {
        expect(data.title).toContain("Evidence");
      },
    },
  },
};

const assertions = require("../shared/assertions");

// these standard tests uses a set of standard assertions
module.exports = {
  "Website has no unallowed beacons": assertions.hasNoUnallowedBeacons,
  "Website has no unallowed 3rd party cookies":
    assertions.hasNoUnallowed3rdPartyCookies,
  "Website has no unallowed 3rd party hosts":
    assertions.hasNoUnallowed3rdPartyHosts,
};

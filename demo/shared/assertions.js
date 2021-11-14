const expect = require("expect");

// verifies that a usercentrics script is loaded
function isUsercentricsPresent(report, config) {
  expect(report.hosts.beacons.thirdParty).toContain("app.usercentrics.eu");
}

// this expects an array of domains to be present on the tests.config objct
function hasNoUnallowed3rdPartyHosts(report, config) {
  var mismatches = [];
  report.hosts.requests.thirdParty.map((m) => {
    if (!config.allowed.hosts.some((x) => m.includes(x))) {
      mismatches.push(m);
    }
  });

  if (mismatches.length > 0) {
    throw `The hosts '${mismatches.join(", ")}' are not allowed `;
  }
}

// this expects an array of cookie domains to be present on the tests.config.allowed.cookies object
function hasNoUnallowed3rdPartyCookies(report, config) {
  var mismatches = [];
  report.cookies.map((m) => {
    if (!config.allowed.cookies.some((x) => m.domain.includes(x))) {
      mismatches.push(m.domain);
    }
  });

  if (mismatches.length > 0) {
    throw `Cookies from the domains '${mismatches.join(
      ", "
    )}' are not allowed `;
  }
}

// this expects an array of beacon domains to be present on the tests.config.allowed.beacons object

function hasNoUnallowedBeacons(report, config) {
  var mismatches = [];
  report.hosts.beacons.thirdParty.map((m) => {
    if (!config.allowed.beacons.some((x) => m.includes(x))) {
      mismatches.push(m);
    }
  });

  if (mismatches.length > 0) {
    throw `Beacons from the domains '${mismatches.join(
      ", "
    )}' are not allowed `;
  }
}

module.exports = {
  isUsercentricsPresent,
  hasNoUnallowed3rdPartyHosts,
  hasNoUnallowed3rdPartyCookies,
  hasNoUnallowedBeacons,
};

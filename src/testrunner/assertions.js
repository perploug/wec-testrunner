const expect = require("expect");

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
  hasNoUnallowed3rdPartyHosts,
  hasNoUnallowed3rdPartyCookies,
  hasNoUnallowedBeacons,
};

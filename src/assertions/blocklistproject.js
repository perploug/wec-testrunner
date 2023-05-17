const fs = require("fs");
const path = require("path");
const utill = require("./utills.js");

console.log(__dirname);

const blockedDomains = fs
  .readFileSync(path.join(__dirname, "blocklist.txt"), "utf8")
  .split(/\r?\n/);

// check cookies, requests, beacons, links
function noBlocklistDomains(report, type) {
  const domains = report.hosts[type].thirdParty;

  const result = utill.noMatches(domains, blockedDomains);

  if (!result.passed) {
    const message = `Thirdparty ${type} contains ${
      result.mismatches.length
    } domains from tracker blocklist: \n ${utill.formatMatches(
      result.mismatches
    )}`;

    throw message;
  }
}

module.exports = { noBlocklistDomains };

const utill = require("./utills.js");

function checkBlockedDomains(report, type, blocked) {
  const domains = report.hosts[type].thirdParty.filter((d) => {
    return d.indexOf(".") > 0;
  });

  const result = utill.noMatches(domains, blocked);

  if (!result.passed) {
    const message = `Websites 3rd party ${type} contains ${
      result.mismatches.length
    } not allowed domains: \n ${utill.formatMatches(result.mismatches)}`;

    throw message;
  }
}

function checkAllowedDomains(report, type, allowed) {
  const domains = report.hosts[type].thirdParty.filter((d) => {
    return d.indexOf(".") > 0;
  });

  allowed.push(report.host);

  const result = utill.allMatches(domains, allowed);

  if (!result.passed) {
    const message = `Websites 3rd party ${type} contains ${
      result.mismatches.length
    } not allowed domains: \n ${utill.formatMatches(result.mismatches)}`;

    throw message;
  }
}

module.exports = {
  checkAllowedDomains,
  checkBlockedDomains,
};

// only returns true if all domains are in the allowList
function allMatches(domains, allowList) {
  const mismatches = [];

  domains.map((m) => {
    if (!allowList.some((x) => m.includes(x))) {
      mismatches.push(m);
    }
  });

  return { passed: mismatches.length == 0, mismatches };
}

// only returns true if all domains are not in the blockList
// returns {passed, list of mismatches}
function noMatches(domains, blockList) {
  const mismatches = domains.filter((element) => blockList.includes(element));
  return { passed: mismatches.length == 0, mismatches };
}

function formatMatches(matches) {
  return "\n - " + matches.join("\n - ") + "\n";
}

module.exports = {
  noMatches,
  allMatches,
  formatMatches,
};

const expect = require("expect");

module.exports = {
  name: "French Website",

  collect: {
    urls: ["https://website.fr"],
  },

  test: {
    cases: {
      "Name Contains Evidence": (data, config) => {
        expect(data.title).toContain("Evidence");
      },
    },
  },
};

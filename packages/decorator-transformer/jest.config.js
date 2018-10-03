const base = require("../../jest.config.js");
const pack = require("./package.json");

module.exports = {
  ...base,
  displayName: pack.name,
  name: pack.name,
  rootDir: "."
};

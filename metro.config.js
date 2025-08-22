const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configure resolver to look for routes in src/
config.resolver.alias = {
  ...config.resolver.alias,
  app: "./src",
};

module.exports = config;

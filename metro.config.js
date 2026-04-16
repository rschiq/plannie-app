// Metro: avoid Watchman when macOS returns EPERM on the project path (common under ~/Documents).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  useWatchman: false,
};

module.exports = config;

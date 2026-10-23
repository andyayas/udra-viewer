// The prototype's files ship as assets with a .udra extension (see webfiles.js).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('udra');

module.exports = config;

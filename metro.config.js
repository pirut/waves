// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support `.cjs` (some Convex/Culori subdeps ship as CJS).
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

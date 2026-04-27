// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
const path = require('path');

const escapePath = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockRepoDirectory = (name) => new RegExp(`${escapePath(path.join(__dirname, name))}\\/.*`);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support `.cjs` (some Convex/Culori subdeps ship as CJS).
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;
config.resolver.blockList = exclusionList([
  blockRepoDirectory('ios/build'),
  blockRepoDirectory('web/.next'),
  blockRepoDirectory('dist'),
  blockRepoDirectory('output'),
]);

module.exports = config;

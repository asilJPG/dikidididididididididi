const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Путь к проекту и корню монорепозитория
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Отслеживание всех папок монорепозитория
config.watchFolders = [monorepoRoot];

// 2. Указание путей для разрешения hoisted node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;

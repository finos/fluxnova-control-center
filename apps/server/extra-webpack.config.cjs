'use strict';

const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin');
const versionsPackageFilename = `${__dirname}/../../package.json`;
const { composePlugins, withNx } = require('@nx/webpack');
const builtinModules = require('builtin-modules').default;

const basePackageValues = {
  name: 'fluxnova-contorl-center',
  version: '1.0.0', //leave this static to avoid cache misses in docker build
  main: './main.js',
  license: 'UNLICENSED',
  engines: {
    node: '>= 24',
  },
};

module.exports = composePlugins(withNx({ sourceMap: process.env.NODE_ENV === 'development' }), (config) => {
  // Here we create a separate entry bundle for the OpenTelemetry registration logic.
  // This allows the Docker entrypoint to preload this specific file via the `--require` flag, ensuring instrumentation is fully initialized before the main application bundle executes.
  // We also need to avoid overwriting any existing entry points defined by Nx, so we merge our new entry with the original one.
  const originalEntry = config.entry;
  config.entry = {
    ...(typeof originalEntry === 'string' || Array.isArray(originalEntry) ? { main: originalEntry } : originalEntry),
    'otel-register': '@opentelemetry/auto-instrumentations-node/register',
  };

  config.resolve.extensions.push('.json');

  config.externals = [
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/platform-socket.io',
    'class-validator',
    'class-transformer',
  ];

  config.output = {
    ...config.output,
    libraryTarget: 'commonjs2',
  };

  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      message: /Critical dependency:/,
      module: /express|load-esm|require-in-the-middle|@opentelemetry\/instrumentation|@nestjs\/core|@nestjs\/common/,
    },
    {
      message: /Failed to parse source map/,
    },
  ];

  config.plugins = [
    ...config.plugins,
    new GeneratePackageJsonPlugin(basePackageValues, {
      sourcePackageFilenames: [versionsPackageFilename],
      excludeDependencies: [...builtinModules, ...config.externals],
    }),
  ];

  return config;
});

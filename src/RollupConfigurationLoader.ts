// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { FileSystem } from '@rushstack/node-core-library';
import * as path from 'path';
import type { IHeftTaskSession, HeftConfiguration } from '@rushstack/heft';

import type {
  IRollupConfiguration,
  IRollupConfigurationFnEnvironment,
  IRollupPluginAccessorHooks
} from './shared';

export interface IRollupConfigurationLoaderSettings {
  taskSession: IHeftTaskSession;
  heftConfiguration: HeftConfiguration;
  hooks: IRollupPluginAccessorHooks;
  serveMode: boolean;
  loadRollupAsyncFn: () => Promise<typeof import('rollup')>;
}

export interface IRollupPluginOptions {
  devConfigurationPath?: string | undefined;
  configurationPath?: string | undefined;
}

export async function tryLoadRollupConfigurationAsync(
  loaderSettings: IRollupConfigurationLoaderSettings,
  options: IRollupPluginOptions
): Promise<IRollupConfiguration | undefined> {
  const { taskSession, heftConfiguration, hooks, serveMode, loadRollupAsyncFn } = loaderSettings;

  // Try to load configuration from hooks first
  const configurationFromHooks: IRollupConfiguration | false | undefined =
    await hooks.onLoadConfiguration.promise();

  if (configurationFromHooks !== undefined) {
    if (configurationFromHooks === false) {
      // Explicitly disabled
      return undefined;
    } else {
      return configurationFromHooks;
    }
  }

  // Load configuration from file system
  const rollupConfigurationPath: string | undefined = await _tryResolveConfigurationPathAsync(
    heftConfiguration,
    options,
    serveMode
  );

  if (!rollupConfigurationPath) {
    return undefined;
  }

  taskSession.logger.terminal.writeLine(`Using Rollup configuration from "${rollupConfigurationPath}"`);

  const rollup = await loadRollupAsyncFn();
  let rollupConfiguration: IRollupConfiguration;

  const rollupConfigurationModule = require(rollupConfigurationPath);
  if (typeof rollupConfigurationModule === 'function') {
    // Configuration is a function
    const env: IRollupConfigurationFnEnvironment = {
      prod: !taskSession.parameters.production,
      production: !taskSession.parameters.production,
      taskSession,
      heftConfiguration,
      rollup
    };
    rollupConfiguration = rollupConfigurationModule(env);
  } else if (rollupConfigurationModule.default && typeof rollupConfigurationModule.default === 'function') {
    // ES6 module with default export function
    const env: IRollupConfigurationFnEnvironment = {
      prod: !taskSession.parameters.production,
      production: !taskSession.parameters.production,
      taskSession,
      heftConfiguration,
      rollup
    };
    rollupConfiguration = rollupConfigurationModule.default(env);
  } else {
    // Configuration is an object
    rollupConfiguration = rollupConfigurationModule.default || rollupConfigurationModule;
  }

  if (hooks.onConfigure.isUsed()) {
    await hooks.onConfigure.promise(rollupConfiguration);
  }

  if (hooks.onAfterConfigure.isUsed()) {
    await hooks.onAfterConfigure.promise(rollupConfiguration);
  }

  return rollupConfiguration;
}

async function _tryResolveConfigurationPathAsync(
  heftConfiguration: HeftConfiguration,
  options: IRollupPluginOptions,
  serveMode: boolean
): Promise<string | undefined> {
  const buildFolderPath: string = heftConfiguration.buildFolderPath;

  // Try dev configuration first if in serve mode
  if (serveMode && options.devConfigurationPath) {
    const devConfigurationPath: string = path.resolve(buildFolderPath, options.devConfigurationPath);
    if (await FileSystem.existsAsync(devConfigurationPath)) {
      return devConfigurationPath;
    }
  }

  // Try the specified configuration path
  if (options.configurationPath) {
    const configurationPath: string = path.resolve(buildFolderPath, options.configurationPath);
    if (await FileSystem.existsAsync(configurationPath)) {
      return configurationPath;
    }
  }

  // Try default configuration files
  const defaultConfigurationPaths: string[] = [
    'rollup.config.js',
    'rollup.config.mjs',
    'rollup.config.ts'
  ];

  if (serveMode) {
    defaultConfigurationPaths.unshift('rollup.dev.config.js', 'rollup.dev.config.mjs', 'rollup.dev.config.ts');
  }

  for (const configurationFilename of defaultConfigurationPaths) {
    const configurationPath: string = path.resolve(buildFolderPath, configurationFilename);
    if (await FileSystem.existsAsync(configurationPath)) {
      return configurationPath;
    }
  }

  return undefined;
}
"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryLoadRollupConfigurationAsync = void 0;
const node_core_library_1 = require("@rushstack/node-core-library");
const path = __importStar(require("path"));
async function tryLoadRollupConfigurationAsync(loaderSettings, options) {
    const { taskSession, heftConfiguration, hooks, serveMode, loadRollupAsyncFn } = loaderSettings;
    // Try to load configuration from hooks first
    const configurationFromHooks = await hooks.onLoadConfiguration.promise();
    if (configurationFromHooks !== undefined) {
        if (configurationFromHooks === false) {
            // Explicitly disabled
            return undefined;
        }
        else {
            return configurationFromHooks;
        }
    }
    // Load configuration from file system
    const rollupConfigurationPath = await _tryResolveConfigurationPathAsync(heftConfiguration, options, serveMode);
    if (!rollupConfigurationPath) {
        return undefined;
    }
    taskSession.logger.terminal.writeLine(`Using Rollup configuration from "${rollupConfigurationPath}"`);
    const rollup = await loadRollupAsyncFn();
    let rollupConfiguration;
    const rollupConfigurationModule = require(rollupConfigurationPath);
    if (typeof rollupConfigurationModule === 'function') {
        // Configuration is a function
        const env = {
            prod: !taskSession.parameters.production,
            production: !taskSession.parameters.production,
            taskSession,
            heftConfiguration,
            rollup
        };
        rollupConfiguration = rollupConfigurationModule(env);
    }
    else if (rollupConfigurationModule.default && typeof rollupConfigurationModule.default === 'function') {
        // ES6 module with default export function
        const env = {
            prod: !taskSession.parameters.production,
            production: !taskSession.parameters.production,
            taskSession,
            heftConfiguration,
            rollup
        };
        rollupConfiguration = rollupConfigurationModule.default(env);
    }
    else {
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
exports.tryLoadRollupConfigurationAsync = tryLoadRollupConfigurationAsync;
async function _tryResolveConfigurationPathAsync(heftConfiguration, options, serveMode) {
    const buildFolderPath = heftConfiguration.buildFolderPath;
    // Try dev configuration first if in serve mode
    if (serveMode && options.devConfigurationPath) {
        const devConfigurationPath = path.resolve(buildFolderPath, options.devConfigurationPath);
        if (await node_core_library_1.FileSystem.existsAsync(devConfigurationPath)) {
            return devConfigurationPath;
        }
    }
    // Try the specified configuration path
    if (options.configurationPath) {
        const configurationPath = path.resolve(buildFolderPath, options.configurationPath);
        if (await node_core_library_1.FileSystem.existsAsync(configurationPath)) {
            return configurationPath;
        }
    }
    // Try default configuration files
    const defaultConfigurationPaths = [
        'rollup.config.js',
        'rollup.config.mjs',
        'rollup.config.ts'
    ];
    if (serveMode) {
        defaultConfigurationPaths.unshift('rollup.dev.config.js', 'rollup.dev.config.mjs', 'rollup.dev.config.ts');
    }
    for (const configurationFilename of defaultConfigurationPaths) {
        const configurationPath = path.resolve(buildFolderPath, configurationFilename);
        if (await node_core_library_1.FileSystem.existsAsync(configurationPath)) {
            return configurationPath;
        }
    }
    return undefined;
}

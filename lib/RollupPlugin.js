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
exports._createAccessorHooks = void 0;
const tapable_1 = require("tapable");
const node_core_library_1 = require("@rushstack/node-core-library");
const shared_1 = require("./shared");
const RollupConfigurationLoader_1 = require("./RollupConfigurationLoader");
const SERVE_PARAMETER_LONG_NAME = '--serve';
const ROLLUP_PACKAGE_NAME = 'rollup';
/**
 * @internal
 */
class RollupPlugin {
    constructor() {
        this._isServeMode = false;
        this._rollupConfiguration = false;
        this._warnings = [];
        this._errors = [];
    }
    get accessor() {
        if (!this._accessor) {
            this._accessor = {
                hooks: _createAccessorHooks(),
                parameters: {
                    isServeMode: this._isServeMode
                }
            };
        }
        return this._accessor;
    }
    apply(taskSession, heftConfiguration, options = {}) {
        this._isServeMode = taskSession.parameters.getFlagParameter(SERVE_PARAMETER_LONG_NAME).value;
        if (this._isServeMode && !taskSession.parameters.watch) {
            throw new Error(`The ${JSON.stringify(SERVE_PARAMETER_LONG_NAME)} parameter is only available when running in watch mode.` +
                ` Try replacing "${taskSession.parsedCommandLine?.unaliasedCommandName}" with` +
                ` "${taskSession.parsedCommandLine?.unaliasedCommandName}-watch" in your Heft command line.`);
        }
        taskSession.hooks.run.tapPromise(shared_1.PLUGIN_NAME, async (runOptions) => {
            await this._runRollupAsync(taskSession, heftConfiguration, options);
        });
        taskSession.hooks.runIncremental.tapPromise(shared_1.PLUGIN_NAME, async (runOptions) => {
            await this._runRollupWatchAsync(taskSession, heftConfiguration, options, runOptions.requestRun);
        });
    }
    async _getRollupConfigurationAsync(taskSession, heftConfiguration, options) {
        if (this._rollupConfiguration === false) {
            const rollupConfiguration = await (0, RollupConfigurationLoader_1.tryLoadRollupConfigurationAsync)({
                taskSession,
                heftConfiguration,
                hooks: this.accessor.hooks,
                serveMode: this._isServeMode,
                loadRollupAsyncFn: this._loadRollupAsync.bind(this)
            }, options);
            this._rollupConfiguration = rollupConfiguration;
        }
        return this._rollupConfiguration;
    }
    async _loadRollupAsync() {
        if (!this._rollup) {
            // Allow this to fail if rollup is not installed
            this._rollup = await Promise.resolve(`${ROLLUP_PACKAGE_NAME}`).then(s => __importStar(require(s)));
        }
        return this._rollup;
    }
    async _runRollupAsync(taskSession, heftConfiguration, options) {
        if (taskSession.parameters.watch || this._isServeMode) {
            // Should never happen, but just in case
            throw new node_core_library_1.InternalError('Cannot run Rollup in compilation mode when watch mode is enabled');
        }
        // Load the config and return if there is no config found
        const rollupConfiguration = await this._getRollupConfigurationAsync(taskSession, heftConfiguration, options);
        if (!rollupConfiguration) {
            return;
        }
        const rollup = await this._loadRollupAsync();
        taskSession.logger.terminal.writeLine(`Using Rollup version ${rollup.VERSION}`);
        taskSession.logger.terminal.writeLine('Running Rollup compilation');
        // Run the rollup build
        try {
            const configs = Array.isArray(rollupConfiguration) ? rollupConfiguration : [rollupConfiguration];
            for (const config of configs) {
                const bundle = await rollup.rollup(config);
                if (config.output) {
                    const outputs = Array.isArray(config.output) ? config.output : [config.output];
                    for (const outputOptions of outputs) {
                        await bundle.write(outputOptions);
                    }
                }
                if (this.accessor.hooks.onEmitStats.isUsed()) {
                    await this.accessor.hooks.onEmitStats.promise(bundle);
                }
                await bundle.close();
            }
        }
        catch (e) {
            this._errors.push(e);
        }
        this._emitErrors(taskSession.logger);
    }
    async _runRollupWatchAsync(taskSession, heftConfiguration, options, requestRun) {
        // Save a handle to the original promise, since the this-scoped promise will be replaced whenever
        // the compilation completes.
        let rollupCompilationDonePromise = this._rollupCompilationDonePromise;
        let isInitial = false;
        if (!this._rollupWatcher) {
            isInitial = true;
            if (!taskSession.parameters.watch) {
                // Should never happen, but just in case
                throw new node_core_library_1.InternalError('Cannot run Rollup in watch mode when compilation mode is enabled');
            }
            // Load the config and return if there is no config found
            const rollupConfiguration = await this._getRollupConfigurationAsync(taskSession, heftConfiguration, options);
            if (!rollupConfiguration) {
                return;
            }
            const rollup = await this._loadRollupAsync();
            taskSession.logger.terminal.writeLine(`Using Rollup version ${rollup.VERSION}`);
            // Set up the hook to detect when the watcher completes the compilation
            this._rollupCompilationDonePromise = new Promise((resolve) => {
                this._rollupCompilationDonePromiseResolveFn = resolve;
            });
            rollupCompilationDonePromise = this._rollupCompilationDonePromise;
            // Get watch options
            const { onGetWatchOptions } = this.accessor.hooks;
            const watchOptions = onGetWatchOptions.isUsed()
                ? await onGetWatchOptions.promise({}, rollupConfiguration)
                : {};
            // Create the watcher
            const configs = Array.isArray(rollupConfiguration) ? rollupConfiguration : [rollupConfiguration];
            const watchConfigs = configs.map(config => ({ ...config, ...watchOptions }));
            taskSession.logger.terminal.writeLine('Starting Rollup watcher');
            this._rollupWatcher = rollup.watch(watchConfigs);
            // Set up event handlers
            this._rollupWatcher.on('event', (event) => {
                switch (event.code) {
                    case 'START':
                        // Rollup is starting
                        break;
                    case 'BUNDLE_START':
                        taskSession.logger.terminal.writeLine('Rollup bundle started');
                        break;
                    case 'BUNDLE_END':
                        if (this.accessor.hooks.onEmitStats.isUsed()) {
                            this.accessor.hooks.onEmitStats.promise(event.result).catch(err => {
                                taskSession.logger.emitError(err);
                            });
                        }
                        break;
                    case 'END':
                        // Build completed
                        this._rollupCompilationDonePromiseResolveFn();
                        this._rollupCompilationDonePromise = new Promise((resolve) => {
                            this._rollupCompilationDonePromiseResolveFn = resolve;
                        });
                        break;
                    case 'ERROR':
                        const error = event.error;
                        this._errors.push(error);
                        this._rollupCompilationDonePromiseResolveFn();
                        this._rollupCompilationDonePromise = new Promise((resolve) => {
                            this._rollupCompilationDonePromiseResolveFn = resolve;
                        });
                        break;
                }
            });
        }
        if (isInitial) {
            taskSession.logger.terminal.writeLine('Running initial Rollup compilation');
        }
        else {
            taskSession.logger.terminal.writeLine('Running incremental Rollup compilation');
        }
        await rollupCompilationDonePromise;
        this._emitErrors(taskSession.logger);
    }
    _emitErrors(logger) {
        for (const warning of this._warnings) {
            logger.emitWarning(warning);
        }
        for (const error of this._errors) {
            logger.emitError(error);
        }
        // Clear errors after emitting
        this._warnings.length = 0;
        this._errors.length = 0;
    }
}
exports.default = RollupPlugin;
/**
 * @internal
 */
function _createAccessorHooks() {
    return {
        onLoadConfiguration: new tapable_1.AsyncSeriesBailHook(),
        onConfigure: new tapable_1.AsyncSeriesHook(['rollupConfiguration']),
        onAfterConfigure: new tapable_1.AsyncParallelHook(['rollupConfiguration']),
        onEmitStats: new tapable_1.AsyncParallelHook(['rollupBuild']),
        onGetWatchOptions: new tapable_1.AsyncSeriesWaterfallHook(['watchOptions', 'rollupConfiguration'])
    };
}
exports._createAccessorHooks = _createAccessorHooks;

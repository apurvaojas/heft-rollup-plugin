// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { AsyncParallelHook, AsyncSeriesBailHook, AsyncSeriesHook, AsyncSeriesWaterfallHook } from 'tapable';
import { InternalError } from '@rushstack/node-core-library';
import type {
  HeftConfiguration,
  IHeftTaskSession,
  IHeftTaskPlugin,
  IScopedLogger,
  IHeftTaskRunIncrementalHookOptions
} from '@rushstack/heft';
import type { RollupBuild, RollupWatcher, RollupWatchOptions } from 'rollup';

import {
  type IRollupConfiguration,
  type IRollupPluginAccessor,
  PLUGIN_NAME,
  type IRollupPluginAccessorHooks
} from './shared';
import { tryLoadRollupConfigurationAsync } from './RollupConfigurationLoader';

export interface IRollupPluginOptions {
  devConfigurationPath?: string | undefined;
  configurationPath?: string | undefined;
}

const SERVE_PARAMETER_LONG_NAME: '--serve' = '--serve';
const ROLLUP_PACKAGE_NAME: 'rollup' = 'rollup';

/**
 * @internal
 */
export default class RollupPlugin implements IHeftTaskPlugin<IRollupPluginOptions> {
  private _accessor: IRollupPluginAccessor | undefined;
  private _isServeMode: boolean = false;
  private _rollup: typeof import('rollup') | undefined;
  private _rollupConfiguration: IRollupConfiguration | undefined | false = false;
  private _rollupWatcher: RollupWatcher | undefined;
  private _rollupCompilationDonePromise: Promise<void> | undefined;
  private _rollupCompilationDonePromiseResolveFn: (() => void) | undefined;

  private _warnings: Error[] = [];
  private _errors: Error[] = [];

  public get accessor(): IRollupPluginAccessor {
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

  public apply(
    taskSession: IHeftTaskSession,
    heftConfiguration: HeftConfiguration,
    options: IRollupPluginOptions = {}
  ): void {
    this._isServeMode = taskSession.parameters.getFlagParameter(SERVE_PARAMETER_LONG_NAME).value;
    if (this._isServeMode && !taskSession.parameters.watch) {
      throw new Error(
        `The ${JSON.stringify(
          SERVE_PARAMETER_LONG_NAME
        )} parameter is only available when running in watch mode.` +
          ` Try replacing "${taskSession.parsedCommandLine?.unaliasedCommandName}" with` +
          ` "${taskSession.parsedCommandLine?.unaliasedCommandName}-watch" in your Heft command line.`
      );
    }

    taskSession.hooks.run.tapPromise(PLUGIN_NAME, async () => {
      await this._runRollupAsync(taskSession, heftConfiguration, options);
    });

    taskSession.hooks.runIncremental.tapPromise(
      PLUGIN_NAME,
      async (runOptions: IHeftTaskRunIncrementalHookOptions) => {
        await this._runRollupWatchAsync(taskSession, heftConfiguration, options, runOptions.requestRun);
      }
    );
  }

  private async _getRollupConfigurationAsync(
    taskSession: IHeftTaskSession,
    heftConfiguration: HeftConfiguration,
    options: IRollupPluginOptions
  ): Promise<IRollupConfiguration | undefined> {
    if (this._rollupConfiguration === false) {
      const rollupConfiguration: IRollupConfiguration | undefined = await tryLoadRollupConfigurationAsync(
        {
          taskSession,
          heftConfiguration,
          hooks: this.accessor.hooks,
          serveMode: this._isServeMode,
          loadRollupAsyncFn: this._loadRollupAsync.bind(this)
        },
        options
      );

      this._rollupConfiguration = rollupConfiguration;
    }

    return this._rollupConfiguration;
  }

  private async _loadRollupAsync(): Promise<typeof import('rollup')> {
    if (!this._rollup) {
      // Allow this to fail if rollup is not installed
      this._rollup = await import(ROLLUP_PACKAGE_NAME);
    }
    return this._rollup!;
  }

  private async _runRollupAsync(
    taskSession: IHeftTaskSession,
    heftConfiguration: HeftConfiguration,
    options: IRollupPluginOptions
  ): Promise<void> {
    if (taskSession.parameters.watch || this._isServeMode) {
      // Should never happen, but just in case
      throw new InternalError('Cannot run Rollup in compilation mode when watch mode is enabled');
    }

    // Load the config and return if there is no config found
    const rollupConfiguration: IRollupConfiguration | undefined = await this._getRollupConfigurationAsync(
      taskSession,
      heftConfiguration,
      options
    );
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
        const bundle: RollupBuild = await rollup.rollup(config);
        
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
    } catch (e) {
      this._errors.push(e as Error);
    }

    this._emitErrors(taskSession.logger);
  }

  private async _runRollupWatchAsync(
    taskSession: IHeftTaskSession,
    heftConfiguration: HeftConfiguration,
    options: IRollupPluginOptions,
    _requestRun: () => void
  ): Promise<void> {
    // Save a handle to the original promise, since the this-scoped promise will be replaced whenever
    // the compilation completes.
    let rollupCompilationDonePromise: Promise<void> | undefined = this._rollupCompilationDonePromise;

    let isInitial: boolean = false;

    if (!this._rollupWatcher) {
      isInitial = true;
      if (!taskSession.parameters.watch) {
        // Should never happen, but just in case
        throw new InternalError('Cannot run Rollup in watch mode when compilation mode is enabled');
      }

      // Load the config and return if there is no config found
      const rollupConfiguration: IRollupConfiguration | undefined =
        await this._getRollupConfigurationAsync(taskSession, heftConfiguration, options);
      if (!rollupConfiguration) {
        return;
      }

      const rollup = await this._loadRollupAsync();
      taskSession.logger.terminal.writeLine(`Using Rollup version ${rollup.VERSION}`);

      // Set up the hook to detect when the watcher completes the compilation
      this._rollupCompilationDonePromise = new Promise((resolve: () => void) => {
        this._rollupCompilationDonePromiseResolveFn = resolve;
      });
      rollupCompilationDonePromise = this._rollupCompilationDonePromise;

      // Get watch options
      const { onGetWatchOptions } = this.accessor.hooks;
      const watchOptions: RollupWatchOptions = onGetWatchOptions.isUsed()
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
            this._rollupCompilationDonePromiseResolveFn!();
            this._rollupCompilationDonePromise = new Promise((resolve: () => void) => {
              this._rollupCompilationDonePromiseResolveFn = resolve;
            });
            break;
          case 'ERROR':
            const error = event.error as Error;
            this._errors.push(error);
            this._rollupCompilationDonePromiseResolveFn!();
            this._rollupCompilationDonePromise = new Promise((resolve: () => void) => {
              this._rollupCompilationDonePromiseResolveFn = resolve;
            });
            break;
        }
      });
    }

    if (isInitial) {
      taskSession.logger.terminal.writeLine('Running initial Rollup compilation');
    } else {
      taskSession.logger.terminal.writeLine('Running incremental Rollup compilation');
    }

    await rollupCompilationDonePromise;
    this._emitErrors(taskSession.logger);
  }

  private _emitErrors(logger: IScopedLogger): void {
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

/**
 * @internal
 */
export function _createAccessorHooks(): IRollupPluginAccessorHooks {
  return {
    onLoadConfiguration: new AsyncSeriesBailHook(),
    onConfigure: new AsyncSeriesHook(['rollupConfiguration']),
    onAfterConfigure: new AsyncParallelHook(['rollupConfiguration']),
    onEmitStats: new AsyncParallelHook(['rollupBuild']),
    onGetWatchOptions: new AsyncSeriesWaterfallHook(['watchOptions', 'rollupConfiguration'])
  };
}
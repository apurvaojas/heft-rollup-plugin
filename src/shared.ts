// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import type {
  AsyncParallelHook,
  AsyncSeriesBailHook,
  AsyncSeriesHook,
  AsyncSeriesWaterfallHook
} from 'tapable';
import type { IHeftTaskSession, HeftConfiguration } from '@rushstack/heft';
import type { RollupOptions, RollupWatchOptions, RollupBuild } from 'rollup';

/**
 * The environment passed into the Rollup configuration function.
 *
 * @public
 */
export interface IRollupConfigurationFnEnvironment {
  /**
   * Whether or not the run is in production mode. Synonym of
   * IRollupConfigurationFnEnvironment.production.
   */
  prod: boolean;
  /**
   * Whether or not the run is in production mode. Synonym of
   * IRollupConfigurationFnEnvironment.prod.
   */
  production: boolean;

  // Non-standard environment options
  /**
   * The task session provided to the plugin.
   */
  taskSession: IHeftTaskSession;
  /**
   * The Heft configuration provided to the plugin.
   */
  heftConfiguration: HeftConfiguration;
  /**
   * The resolved Rollup package.
   */
  rollup: typeof import('rollup');
}

/**
 * @public
 */
export interface IRollupConfigurationWithServe extends RollupOptions {
  serve?: {
    port?: number;
    host?: string;
    contentBase?: string;
    historyApiFallback?: boolean;
    open?: boolean;
  };
}

/**
 * @public
 */
export type IRollupConfiguration = IRollupConfigurationWithServe | IRollupConfigurationWithServe[];

/**
 * @public
 */
export interface IRollupPluginAccessorHooks {
  /**
   * A hook that allows for loading custom configurations used by the Rollup
   * plugin. If a tap returns a value other than `undefined` before stage {@link STAGE_LOAD_LOCAL_CONFIG},
   * it will suppress loading from the rollup config file. To provide a fallback behavior in the
   * absence of a local config file, tap this hook with a `stage` value greater than {@link STAGE_LOAD_LOCAL_CONFIG}.
   *
   * @remarks
   * Tapable event handlers can return `false` instead of `undefined` to suppress
   * other handlers from creating a configuration object, and prevent rollup from running.
   */
  readonly onLoadConfiguration: AsyncSeriesBailHook<never, never, never, IRollupConfiguration | false>;
  /**
   * A hook that allows for modification of the loaded configuration used by the Rollup
   * plugin. If no configuration was loaded, this hook will not be called.
   */
  readonly onConfigure: AsyncSeriesHook<IRollupConfiguration, never, never>;
  /**
   * A hook that provides the finalized configuration that will be used by Rollup.
   * If no configuration was loaded, this hook will not be called.
   */
  readonly onAfterConfigure: AsyncParallelHook<IRollupConfiguration, never, never>;
  /**
   * A hook that provides the build result from Rollup. If no configuration is loaded,
   * this hook will not be called.
   */
  readonly onEmitStats: AsyncParallelHook<RollupBuild, never, never>;
  /**
   * A hook that allows for customization of the file watcher options. If not running in watch mode, this hook will not be called.
   */
  readonly onGetWatchOptions: AsyncSeriesWaterfallHook<
    RollupWatchOptions,
    Readonly<IRollupConfiguration>,
    never
  >;
}

/**
 * @public
 */
export interface IRollupPluginAccessorParameters {
  /**
   * Whether or not serve mode was enabled by passing the `--serve` flag.
   */
  readonly isServeMode: boolean;
}

/**
 * @public
 */
export interface IRollupPluginAccessor {
  /**
   * Hooks that are called at various points in the Rollup plugin lifecycle.
   */
  readonly hooks: IRollupPluginAccessorHooks;
  /**
   * Parameters that are provided by the Rollup plugin.
   */
  readonly parameters: IRollupPluginAccessorParameters;
}

/**
 * The stage in the `onLoadConfiguration` hook at which the config will be loaded from the local
 * rollup config file.
 * @public
 */
export const STAGE_LOAD_LOCAL_CONFIG: 1000 = 1000;

/**
 * @public
 */
export const PLUGIN_NAME: 'rollup-plugin' = 'rollup-plugin';
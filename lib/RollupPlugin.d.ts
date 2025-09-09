import type { HeftConfiguration, IHeftTaskSession, IHeftTaskPlugin } from '@rushstack/heft';
import { type IRollupPluginAccessor, type IRollupPluginAccessorHooks } from './shared';
export interface IRollupPluginOptions {
    devConfigurationPath?: string | undefined;
    configurationPath?: string | undefined;
}
/**
 * @internal
 */
export default class RollupPlugin implements IHeftTaskPlugin<IRollupPluginOptions> {
    private _accessor;
    private _isServeMode;
    private _rollup;
    private _rollupConfiguration;
    private _rollupWatcher;
    private _rollupCompilationDonePromise;
    private _rollupCompilationDonePromiseResolveFn;
    private _warnings;
    private _errors;
    get accessor(): IRollupPluginAccessor;
    apply(taskSession: IHeftTaskSession, heftConfiguration: HeftConfiguration, options?: IRollupPluginOptions): void;
    private _getRollupConfigurationAsync;
    private _loadRollupAsync;
    private _runRollupAsync;
    private _runRollupWatchAsync;
    private _emitErrors;
}
/**
 * @internal
 */
export declare function _createAccessorHooks(): IRollupPluginAccessorHooks;

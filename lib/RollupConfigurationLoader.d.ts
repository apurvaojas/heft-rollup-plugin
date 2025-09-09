import type { IHeftTaskSession, HeftConfiguration } from '@rushstack/heft';
import type { IRollupConfiguration, IRollupPluginAccessorHooks } from './shared';
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
export declare function tryLoadRollupConfigurationAsync(loaderSettings: IRollupConfigurationLoaderSettings, options: IRollupPluginOptions): Promise<IRollupConfiguration | undefined>;

// Simple test to verify the plugin exports work correctly
import { PluginName, STAGE_LOAD_LOCAL_CONFIG } from './index';
import type { IRollupPluginAccessor } from './index';

describe('Heft Rollup Plugin', () => {
  test('should export the correct plugin name', () => {
    expect(PluginName).toBe('rollup-plugin');
  });

  test('should export stage constant', () => {
    expect(STAGE_LOAD_LOCAL_CONFIG).toBe(1000);
  });

  test('should export types correctly', () => {
    // This is just a compilation test - if the types are not correctly exported,
    // TypeScript will fail to compile this test
    const mockAccessor: IRollupPluginAccessor = {
      hooks: {
        onLoadConfiguration: {} as any,
        onConfigure: {} as any,
        onAfterConfigure: {} as any,
        onEmitStats: {} as any,
        onGetWatchOptions: {} as any
      },
      parameters: {
        isServeMode: false
      }
    };
    
    expect(mockAccessor.parameters.isServeMode).toBe(false);
  });
});
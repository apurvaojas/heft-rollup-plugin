# heft-rollup-plugin

A Heft plugin for Rollup, similar to the official heft-webpack5-plugin.

## Installation

```bash
npm install @apurvaojas/heft-rollup-plugin rollup --save-dev
```

## Usage

### 1. Configure your heft.json

Add the plugin to your `config/heft.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json",
  
  "heftPlugins": [
    {
      "plugin": "@apurvaojas/heft-rollup-plugin"
    }
  ]
}
```

### 2. Create a Rollup configuration

Create a `rollup.config.js` file in your project root:

```javascript
export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  }
};
```

### 3. Plugin Options

You can configure the plugin by adding options in your heft.json:

```json
{
  "heftPlugins": [
    {
      "plugin": "@apurvaojas/heft-rollup-plugin",
      "options": {
        "configurationPath": "./custom-rollup.config.js",
        "devConfigurationPath": "./rollup.dev.config.js"
      }
    }
  ]
}
```

### 4. Available Parameters

- `--rollup:serve`: Start in serve mode (watch mode only)

### 5. Configuration Files

The plugin will look for configuration files in this order:

**Normal mode:**
1. Path specified in `configurationPath` option
2. `rollup.config.js`
3. `rollup.config.mjs`
4. `rollup.config.ts`

**Serve mode:**
1. Path specified in `devConfigurationPath` option
2. `rollup.dev.config.js`
3. `rollup.dev.config.mjs`
4. `rollup.dev.config.ts`
5. Falls back to normal mode files

## API

The plugin provides hooks for customization:

```typescript
import type { IRollupPluginAccessor } from '@apurvaojas/heft-rollup-plugin';

// Access the plugin via Heft
const rollupPlugin: IRollupPluginAccessor = heftSession.requestPlugin('rollup-plugin');

// Use hooks to customize behavior
rollupPlugin.hooks.onLoadConfiguration.tapPromise('MyPlugin', async () => {
  // Return custom configuration
});

rollupPlugin.hooks.onConfigure.tapPromise('MyPlugin', async (configuration) => {
  // Modify the configuration
});
```

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Test the plugin
npm test
```

## License

MIT
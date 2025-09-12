# heft-rollup-plugin

A Heft plugin for Rollup, similar to the official heft-webpack5-plugin.

## Installation

```bash
npm install heft-rollup-plugin rollup --save-dev
```

## Usage

### 1. Configure your heft.json

Add the plugin to your `config/heft.json`:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json",
  
  "heftPlugins": [
    {
      "plugin": "heft-rollup-plugin"
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
      "plugin": "heft-rollup-plugin",
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
import type { IRollupPluginAccessor } from 'heft-rollup-plugin';

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

### Setup

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Test the plugin
npm test

# Lint the code
npm run lint
```

### Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and automatic versioning.

#### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

#### Making Commits

You can use commitizen for interactive commit messages:

```bash
npm run commit
```

Or write conventional commit messages manually:

```bash
git commit -m "feat: add new rollup plugin feature"
```

### Release Process

This project uses automated releases:

- **Beta releases**: Automatically published to npm with `@next` tag when changes are merged to `main` branch
- **Stable releases**: Published when a version tag is created using semantic-release
- **Version bumping**: Automatic based on conventional commit history
- **Release notes**: Auto-generated from conventional commits

#### Manual Release

To trigger a release manually:

```bash
# This will analyze commits and create a release if needed
npm run release
```

## License

MIT
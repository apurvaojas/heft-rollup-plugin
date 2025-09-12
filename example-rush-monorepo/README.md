This example Rush monorepo demonstrates two libraries consumed by a Create React App:

- `lib-rollup` built with Rollup using the local `heft-rollup-plugin` (ESM output)
- `lib-webpack` built with Webpack via `heft-webpack5-plugin` (UMD output)

The `apps/example-app` is a Create React App that imports both libraries and we provide scripts to build and analyze bundles to compare tree-shaking effectiveness.

Quick steps (inside this folder):

1. Install Rush: npm i -g @microsoft/rush
2. From repo root run: rush update
3. Build all: rush build
4. Run analysis scripts as described in each package

See package READMEs and scripts for details.

Usage notes for example-rush-monorepo

1. Install Rush (globally):
   npm install -g @microsoft/rush

2. From this folder run:
   rush update

3. Build libraries:
   cd libs/lib-rollup && npm run build
   cd libs/lib-webpack && npm run build

4. Build CRA app (from monorepo root):
   cd apps/example-app && npm run build

5. Analyze bundle:
   node scripts/analyze-cra-bundle.js

Notes:
- This example expects local toolchain available (node, npm). If you prefer pnpm you can adjust rush.json accordingly.

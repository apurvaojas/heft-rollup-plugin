import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import path from "path";
import { terser } from "rollup-plugin-terser";

const pluginPath = path.resolve(__dirname, "..", "..", "..", "dist");
// Note: Adjust pluginPath if your local plugin has a different built path.

export default {
  input: "libs/lib-rollup/src/index.js",
  output: {
    file: "libs/lib-rollup/dist/index.esm.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [resolve(), commonjs(), terser()],
};

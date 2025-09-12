import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: path.resolve(__dirname, "src", "index.js"),
  output: [
    {
      file: path.resolve(__dirname, "dist", "index.esm.js"),
      format: "es",
      sourcemap: true,
    },
    {
      file: path.resolve(__dirname, "dist", "index.umd.js"),
      format: "umd",
      name: "LibRollup",
      sourcemap: true,
    },
  ],
  treeshake: true,
};

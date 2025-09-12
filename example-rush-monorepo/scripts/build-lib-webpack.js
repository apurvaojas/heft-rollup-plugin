const path = require("path");
const webpack = require("webpack");

const config = {
  mode: "production",
  entry: path.resolve(
    __dirname,
    "..",
    "libs",
    "lib-webpack",
    "src",
    "index.js"
  ),
  output: {
    path: path.resolve(__dirname, "..", "libs", "lib-webpack", "dist"),
    filename: "index.umd.js",
    library: "LibWebpack",
    libraryTarget: "umd",
  },
  optimization: {
    usedExports: true,
  },
};

webpack(config, (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(stats.toString({ colors: true }));
});

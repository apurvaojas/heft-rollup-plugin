const path = require("path");

module.exports = {
  mode: "production",
//   devtool: "source-map",
  entry: path.resolve(__dirname, "src", "index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.umd.js",
    library: "LibWebpack",
    libraryTarget: "umd",
  },
  optimization: {
    usedExports: true,
    minimize: false,
  },
};

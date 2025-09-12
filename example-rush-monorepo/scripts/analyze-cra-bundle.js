const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appBuildDir = path.resolve(
  __dirname,
  "..",
  "apps",
  "example-app",
  "build"
);

if (!fs.existsSync(appBuildDir)) {
  console.error("Build not found. Run apps/example-app build first.");
  process.exit(1);
}

const jsDir = path.join(appBuildDir, "static", "js");
if (!fs.existsSync(jsDir)) {
  console.error("No static/js in CRA build; make sure build succeeded.");
  process.exit(1);
}

const files = fs
  .readdirSync(jsDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => path.join(jsDir, f));
console.log("Found JS bundles:", files);

files.forEach((file) => {
  console.log("\n--- Analyzing", file);
  try {
    execSync(`npx source-map-explorer ${file} --html ${file}.report.html`, {
      stdio: "inherit",
    });
    console.log("Generated report:", file + ".report.html");
  } catch (e) {
    console.error("source-map-explorer failed:", e.message);
  }
});

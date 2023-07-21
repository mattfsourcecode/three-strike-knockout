const esbuild = require("esbuild");
const glob = require("glob");
const { execSync } = require("child_process");

(async () => {
  try {
    await Promise.all([
      esbuild.build({
        entryPoints: ["src/index.js"],
        bundle: true,
        minify: true,
        sourcemap: true,
        target: "node14",
        platform: "node",
        outfile: "dist/index.js",
      }),
      esbuild.build({
        entryPoints: ["src/client.js"],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: "public/client.js",
      }),
      ...glob.sync("src/**/*.css").map(async (file) => {
        const outputPath = file.replace(/^src\//, "public/");
        const command = `postcss ${file} --use postcss-import postcss-preset-env -o ${outputPath}`;
        execSync(command);
      }),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();

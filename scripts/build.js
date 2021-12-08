const path = require("path");
const fs = require("fs");

const WIDGETS_SRC_PATH = path.resolve(process.cwd(), "src/widgets");
const DIST_PATH = path.resolve(process.cwd(), "dist/");

const files = fs.readdirSync(WIDGETS_SRC_PATH);

fs.rmSync(DIST_PATH, { recursive: true, force: true });

require("esbuild")
  .build({
    entryPoints: files.map((f) => path.resolve(WIDGETS_SRC_PATH, f)),
    bundle: true,
    minify: true,
    platform: "browser",
    target: "es6",
    outdir: "./esout",
    splitting: false,
    write: false,
  })
  .then((result) => {
    for (const file of result.outputFiles) {
      const fileContents = new TextDecoder().decode(file.contents);
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module">${fileContents}</script></body></html>`;
      if (!fs.existsSync("./dist")) {
        fs.mkdirSync("./dist");
      }
      const pathSplit = file.path.split("/");
      fs.writeFileSync(
        path.resolve(
          DIST_PATH,
          pathSplit[pathSplit.length - 1].replace(".js", ".html")
        ),
        html
      );
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

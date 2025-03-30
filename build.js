import { execSync } from "child_process";
import * as esbuild from "esbuild"
import * as fs from "fs"
import * as path from "path";


async function build(){
  try {
    await esbuild.build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      platform:"node",
      format: "esm",
      target:"node16",
      outfile:"dist/index.js",
      sourcemap: true,
      minify: process.env.NODE_ENV === 'production',
      external: [
        'googleapis',
        'commander',
        'inquirer',
        'chalk',
        'ora',
        'boxen',
        'conf',
        'mime-types',
        'open'
      ],
      banner: {
        js: '#!/usr/bin/env node',  // shebang 추가
      },
    })
  
  
    fs.chmodSync("dist/index.js", "755");
    console.log("Build completed");    
  } catch (error) {
    console.error("Build failed", error);
    process.exit(1);
  }

}

function copyTypeDefinitions() {
  execSync('npm run build:tsc', {stdio: "inherit"});

  const copyDir = (src, dest) => {
    if (!fs.existsSync(src)) return

    const entries = fs.readdirSync(src, {withFileTypes: true})
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true })
        copyDir(srcPath, destPath)
      } else if (entry.name.endsWith(".d.ts")) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }


  copyDir(".types", "dist")

}

(async () => {
  await build();
  copyTypeDefinitions();
})()  
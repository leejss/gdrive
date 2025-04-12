import { execSync } from 'child_process';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['./src/index'],
  outDir: 'dist',
  clean: true,
  declaration: true,
  sourcemap: process.env.NODE_ENV === 'production',
  rollup: {
    esbuild: {
      target: 'node18',
      minify: process.env.NODE_ENV === 'production',
    },
  },

  // hooks: {
  //   'build:done'() {
  //     execSync('chmod 755 dist/index.mjs');
  //   },
  // },
});

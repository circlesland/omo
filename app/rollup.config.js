import svelte from "rollup-plugin-svelte";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import css from 'rollup-plugin-css-only'
import builtins from 'rollup-plugin-node-builtins';
import json from '@rollup/plugin-json';
import nodeGlobals from 'rollup-plugin-node-globals'
import replace from '@rollup/plugin-replace';
import {
  terser
} from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import dotenv from 'dotenv';
dotenv.config();

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"], {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

export default {
  input: "src/main.ts",
  output: {
    sourcemap: true,
    format: "iife",
    name: "app",
    file: "public/build/bundle.js",
  },
  plugins: [
    replace({
      // TODO: Replace with variables from .env
      __PROXY_EXTERN_DOMAIN__: process.env.PROXY_EXTERN_DOMAIN,
      __PROXY_EXTERN_PORT__: process.env.PROXY_EXTERN_PORT,
      __PROXY_PROTOCOL__: process.env.PROXY_PROTOCOL,
      __PROXY_SERVICE_AUTH_PATH__: process.env.PROXY_SERVICE_AUTH_PATH,
      __PROXY_SERVICE_IDENTITY_PATH__: process.env.PROXY_SERVICE_IDENTITY_PATH,
      __PROXY_SERVICE_SAFE_PATH__: process.env.PROXY_SERVICE_SAFE_PATH,
      __PROXY_SERVICE_MARKETPLACE_PATH__: process.env.PROXY_SERVICE_MARKETPLACE_PATH
    }),
    json(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs({
      namedExports: {
        'svelte-swiper': ['Swiper', 'SwiperSlide']
      }
    }),
    nodeGlobals(),
    builtins({crypto: true}),
    css({
      output: 'public/build/swiper-bundle.css'
    }),
    typescript({
      sourceMap: !production,
    }),
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: (css) => {
        css.write("bundle.css");
      },
      preprocess: sveltePreprocess({
        postcss: true,
      }),
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("public"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
    include: "src/**",
  },
};
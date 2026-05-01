import path from 'path';
import { fileURLToPath, createRequire } from 'url';
import fs from 'fs';
import { promisify } from 'util';
import Nunjucks from 'nunjucks';
import htmlmin from 'html-minifier';
import webResourceInliner from 'web-resource-inliner';
import { minify as terserMinify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load purify-css by suppressing the deprecation warning
let purifyCss;
const origWarn = console.warn;
console.warn = () => {};
try {
  purifyCss = require('purify-css');
  console.log('purify-css loaded:', typeof purifyCss);
} catch (e) {
  console.error('Failed to load purify-css:', e);
  purifyCss = () => {};
} finally {
  console.warn = origWarn;
}

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget('./_includes/*');
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('favicon');

  let nunjucksEnvironment = new Nunjucks.Environment(new Nunjucks.FileSystemLoader('_includes'));
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  // Add filters to custom Nunjucks environment
  nunjucksEnvironment.addFilter('purifyCss', function (file, callback) {
    const css = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    const html = fs.readFileSync(path.join(__dirname, this.ctx.page.inputPath), 'utf-8');
    purifyCss(html, css, { output: false, info: true, minify: true }, (err, res) =>
      callback(null, `<style>${res}</style>`),
    );
  });

  nunjucksEnvironment.addFilter('purifyCssBasedOnIncludes', function ([cssFile, ...templates], callback) {
    const html = templates
      .map(file => fs.readFileSync(path.join(__dirname, file), 'utf-8'))
      .join('\n');
    const css = fs.readFileSync(path.join(__dirname, cssFile), 'utf-8');
    purifyCss(html, css, { output: false, info: true, minify: true }, (err, res) =>
      callback(null, `<style>${res}</style>`),
    );
  });

  nunjucksEnvironment.addFilter('load', function (file) {
    return fs.readFileSync(path.join(__dirname, file), 'utf-8');
  });

  nunjucksEnvironment.addFilter('script', function (code) {
    return `<script type="text/javascript">${code}</script>`;
  });

  nunjucksEnvironment.addFilter('style', function (code) {
    return `<style>${code}</style>`;
  });

  nunjucksEnvironment.addFilter('jsmin', function (code) {
    let minified = terserMinify(code);
    if (minified.error) {
      console.log('Terser error: ', minified.error);
      return code;
    }
    return minified.code;
  });

  // embed tweets
  eleventyConfig.addPlugin(inlineTweetPlugin);

  // inline resources in HTML output
  eleventyConfig.addTransform('inline', async function (fileContent, outputPath) {
    if (outputPath.indexOf('.html') > -1) {
      return await promisify(webResourceInliner.html)({ fileContent });
    }
    return content;
  });

  if (process.env.NODE_ENV === 'production') {
    // Minify HTML output
    eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
      if (outputPath.indexOf('.html') > -1) {
        let minified = htmlmin.minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
        });
        return minified;
      }
      return content;
    });
  }
};

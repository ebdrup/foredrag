import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';
import { promisify } from 'util';
import Nunjucks from 'nunjucks';
import htmlmin from 'html-minifier';
import webResourceInliner from 'web-resource-inliner';
import { minify as terserMinify } from 'terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load purify-css (has deprecation warning from uglifyjs)
let purifyCss;
const origWarn = console.warn;
console.warn = () => {};
try {
  purifyCss = require('purify-css');
} catch (e) {
  // Fallback: read CSS file directly if purify-css fails
  console.warn('Warning: purify-css not available, using raw CSS');
  purifyCss = null;
} finally {
  console.warn = origWarn;
}

// Fallback function to read CSS directly
function getCssDirect(file) {
  try {
    return fs.readFileSync(path.join(__dirname, file), 'utf-8');
  } catch (e) {
    return '';
  }
}

export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget('./_includes/*');
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('favicon');

  let nunjucksEnvironment = new Nunjucks.Environment(new Nunjucks.FileSystemLoader('_includes'));
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  // Add filters to both eleventyConfig and custom Nunjucks environment
  function addFilter(name, filter) {
    eleventyConfig.addFilter(name, filter);
    nunjucksEnvironment.addFilter(name, filter);
  }

  // Add async filters
  function addAsyncFilter(name, filter) {
    eleventyConfig.addNunjucksAsyncFilter(name, filter);
    nunjucksEnvironment.addFilter(name, filter);
  }

  addAsyncFilter('purifyCss', function (file, cb) {
    const css = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    const html = fs.readFileSync(path.join(__dirname, this.ctx.page.inputPath), 'utf-8');
    if (purifyCss) {
      purifyCss(html, css, { output: false, info: true, minify: true }, (err, res) =>
        cb(null, `<style>${res}</style>`),
      );
    } else {
      // Fallback: return raw CSS
      cb(null, `<style>${css}</style>`);
    }
  });

  addAsyncFilter('purifyCssBasedOnIncludes', function ([cssFile, ...templates], cb) {
    const html = templates
      .map(file => fs.readFileSync(path.join(__dirname, file), 'utf-8'))
      .join('\n');
    const css = fs.readFileSync(path.join(__dirname, cssFile), 'utf-8');
    if (purifyCss) {
      purifyCss(html, css, { output: false, info: true, minify: true }, (err, res) =>
        cb(null, `<style>${res}</style>`),
      );
    } else {
      // Fallback: return raw CSS
      cb(null, `<style>${css}</style>`);
    }
  });

  addFilter('load', function (file) {
    return fs.readFileSync(path.join(__dirname, file), 'utf-8');
  });

  addFilter('script', function (code) {
    return `<script type="text/javascript">${code}</script>`;
  });

  addFilter('style', function (code) {
    return `<style>${code}</style>`;
  });

  addFilter('jsmin', function (code) {
    let minified = terserMinify(code);
    if (minified.error) {
      console.log('Terser error: ', minified.error);
      return code;
    }
    return minified.code;
  });

  // embed tweets
  //eleventyConfig.addPlugin(inlineTweetPlugin);

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

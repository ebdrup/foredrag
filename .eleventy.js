const path = require('path');
const fs = require('fs');
const Nunjucks = require('nunjucks');
const purifyCss = require('purify-css');
const htmlmin = require('html-minifier');
const Terser = require('terser');
const lazyImagesPlugin = require('eleventy-plugin-lazyimages');
const embedTweet = require('./_filters/embedTweet');

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget('./_includes');
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPlugin(lazyImagesPlugin);
  eleventyConfig.addPassthroughCopy('favicon*');

  let nunjucksEnvironment = new Nunjucks.Environment(new Nunjucks.FileSystemLoader('_includes'));
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  eleventyConfig.addNunjucksAsyncFilterPromise = (name, fn) => {
    eleventyConfig.addNunjucksAsyncFilter(name, (...args) => {
      const cb = args.pop();
      fn.apply(null, args)
        .then((...args) => cb.apply(null, null, args))
        .catch(cb);
    });
  };

  eleventyConfig.addNunjucksAsyncFilter('purifyCss', function (file, cb) {
    const css = fs.readFileSync(path.join(__dirname, file), 'utf-8');
    const html = fs.readFileSync(path.join(__dirname, this.ctx.page.inputPath), 'utf-8');
    purifyCss(html, css, { output: false, info: true, minify: true }, res =>
      cb(null, `<style>${res}</style>`),
    );
  });

  eleventyConfig.addNunjucksAsyncFilter('purifyCssBasedOnIncludes', function (
    [cssFile, ...templates],
    cb,
  ) {
    const html = templates
      .map(file => fs.readFileSync(path.join(__dirname, file), 'utf-8'))
      .join('\n');
    const css = fs.readFileSync(path.join(__dirname, cssFile), 'utf-8');
    purifyCss(html, css, { output: false, info: true, minify: true }, res =>
      cb(null, `<style>${res}</style>`),
    );
  });

  eleventyConfig.addFilter('load', function (file) {
    return fs.readFileSync(path.join(__dirname, file), 'utf-8');
  });

  eleventyConfig.addNunjucksAsyncFilterPromise('embedTweet', embedTweet);

  eleventyConfig.addFilter('script', function (code) {
    return `<script type="text/javascript">${code}</script>`;
  });

  eleventyConfig.addFilter('jsmin', function (code) {
    let minified = Terser.minify(code);
    if (minified.error) {
      console.log('Terser error: ', minified.error);
      return code;
    }
    return minified.code;
  });

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
};

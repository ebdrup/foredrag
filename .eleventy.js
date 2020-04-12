let Nunjucks = require('nunjucks');
const CleanCSS = require('clean-css');
const htmlmin = require('html-minifier');

module.exports = function (eleventyConfig) {
  // Copy `img/` to `_site/img`

  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('favicon*');

  let nunjucksEnvironment = new Nunjucks.Environment(new Nunjucks.FileSystemLoader('_includes'));
  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  eleventyConfig.addFilter('cssmin', function (code) {
    return new CleanCSS({}).minify(code).styles;
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

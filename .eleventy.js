let Nunjucks = require('nunjucks');
const CleanCSS = require('clean-css');

module.exports = function (eleventyConfig) {
  // Copy `img/` to `_site/img`
  eleventyConfig.addPassthroughCopy('img');
  let nunjucksEnvironment = new Nunjucks.Environment(new Nunjucks.FileSystemLoader('_includes'));

  eleventyConfig.setLibrary('njk', nunjucksEnvironment);

  eleventyConfig.addFilter('cssmin', function (code) {
    return new CleanCSS({}).minify(code).styles;
  });
};

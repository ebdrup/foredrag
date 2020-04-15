const fse = require('fs-extra');
const path = require('path');
const fetch = require('cross-fetch');
const slug = require('slug');

module.exports = async function embedTweet(url) {
  const file = path.join(__dirname, '../_includes/tweets/', `${slug(url)}.html`);
  if (await fse.pathExists(file)) {
    return await fse.readFile(file);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'We can not run the embedTweet filter at production build time. Please run "npm test" and commit the embedded tweet that will be generated to GitHub',
    );
  }
  const { html } = await (
    await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`)
  ).json();
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch();
  const shadowPage = await getPageForHtml(browser, html);

  const bodyHtml = await shadowPage.evaluate(() => {
    return document.body.childNodes['0'].shadowRoot.innerHTML.replace(/(\s*\n\s*)+/, '\n');
  });

  const page = await getPageForHtml(browser, bodyHtml);
  const noStyleHtml = await page.evaluate(() => {
    [...document.getElementsByTagName('style')].forEach(s => s.parentNode.removeChild(s));
    return document.body.innerHTML;
    /*
    [...document.body.getElementsByTagName('*')].forEach(n => {
      if (n.className) {
        n.className = '';
      }
    });
    return document.body.innerHTML.replace(/ class=""/gm, '');
    */
  });

  await browser.close();
  await fse.writeFile(file, noStyleHtml, 'utf-8');
  return noStyleHtml;
};

async function getPageForHtml(browser, html) {
  const tmp = require('tmp');
  const { name: tmpFile } = tmp.fileSync({ postfix: '.html' });
  await fse.writeFile(tmpFile, `<html><body>${html}</body></html>`, 'utf-8');
  const page = await browser.newPage();
  await page.goto(`file://${tmpFile}`, {
    waitUntil: 'networkidle0',
  });
  return page;
}

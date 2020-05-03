const { promisify } = require('util');
const fse = require('fs-extra');
const path = require('path');
const slug = require('slug');

function checkStatus(res) {
  if (res.ok) {
    // res.status >= 200 && res.status < 300
    return res;
  } else {
    throw new Error(res.statusText);
  }
}

const cssCache = {};

module.exports = async function embedTweet(
  url,
  { forceReload = false, skipWritingFiles = false } = {},
) {
  const file = path.join(__dirname, '../_includes/external/tweets/', `${slug(url)}.html`);
  if (!forceReload && (await fse.pathExists(file))) {
    return await fse.readFile(file, 'utf-8');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'We can not run the embedTweet filter at production build time. Please run "npm test" and commit the embedded tweet that will be generated to GitHub',
    );
  }

  // We require here, because these modules are not present when NODE_ENV='production'
  const fetch = require('cross-fetch');
  const puppeteer = require('puppeteer');
  const juice = require('juice');

  const { html } = await checkStatus(
    await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`),
  ).json();

  const browser = await puppeteer.launch();
  const shadowPage = await getPageForHtml({ browser, html, opts: { waitUntil: 'networkidle0' } });

  const content = await shadowPage.evaluate(() => {
    const cssTagContent = [];
    const shadow = document.body.childNodes['0'].shadowRoot;
    subtreeSet(document.body).forEach(e => {
      if (['style'].includes((e.tagName || '').toLowerCase())) {
        cssTagContent.push(e.textContent || e.innerHTML || e.innerText);
      }
    });
    removeStylesAndScripts(document.body);
    subtreeSet(document.body).forEach(e => {
      Array.from(e.attributes).forEach(({ nodeName, nodeValue }) => {
        if (/^(data-.*|id)$/.test(nodeName) && nodeValue) {
          e.setAttribute(nodeName, '');
        }
      });
    });
    const html = shadow.innerHTML
      .replace(/ (id|class|style|data-[^=]*)=""/gm, '')
      .replace(/(\s*\n\s*)+/gm, '\n');
    return { html, cssTagContent };
  });
  const cssImport = content.cssTagContent.find(css => css.includes('@import'));
  const cssUrl = (/url\("([^"]*)"\)/.exec(cssImport) || [])[1];
  const css = cssCache[cssUrl] || (await checkStatus(await fetch(cssUrl)).text());
  cssCache[cssUrl] = css;

  const styledHtml = await promisify(juice.juiceResources)(
    juice.inlineContent(content.html, css),
    {},
  );

  await browser.close();

  !skipWritingFiles && (await fse.writeFile(file, styledHtml, 'utf-8'));
  !skipWritingFiles && (await require('execa')('prettier', ['--write', file]));

  return styledHtml;
};

async function getPageForHtml({ browser, html, opts }) {
  const tmp = require('tmp');
  const { name: tmpFile } = tmp.fileSync({ postfix: '.html' });
  await fse.writeFile(tmpFile, `<html><body>${html}</body></html>`, 'utf-8');
  const page = await browser.newPage();
  await page.goto(`file://${tmpFile}`, opts);
  await page.addScriptTag({
    content: subtreeSet.toString(),
  });
  await page.addScriptTag({
    content: removeStylesAndScripts.toString(),
  });
  return page;
}

function removeStylesAndScripts(node) {
  subtreeSet(node).forEach(e => {
    if (['style', 'script'].includes((e.tagName || '').toLowerCase())) {
      (e.parentNode || e.host).removeChild(e);
    }
  });
}

function subtreeSet(root, theset) {
  if (!theset) theset = new Set();
  if (!root || theset.has(root)) return theset;
  theset.add(root);
  if (root.shadowRoot) {
    Array.from(root.shadowRoot.children).forEach(child => subtreeSet(child, theset));
  } else {
    if (root && root.getElementsByTagName)
      for (const child of root.getElementsByTagName('*')) subtreeSet(child, theset);
  }
  return theset;
}

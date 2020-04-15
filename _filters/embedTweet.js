const fse = require('fs-extra');
const path = require('path');
const fetch = require('cross-fetch');
const slug = require('slug');

module.exports = async function embedTweet(url, { forceReload = false }) {
  const file = path.join(__dirname, '../_includes/tweets/', `${slug(url)}.html`);
  if (!forceReload && (await fse.pathExists(file))) {
    return await fse.readFile(file, 'utf-8');
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
  const shadowPage = await getPageForHtml({ browser, html, opts: { waitUntil: 'networkidle0' } });

  const content = await shadowPage.evaluate(() => {
    let counter = 0;
    const styles = {};
    const shadow = document.body.childNodes['0'].shadowRoot;
    subtreeSet(document.body).forEach(e => {
      const id = e.id || `_id${counter++}`;
      styles[id] = JSON.parse(JSON.stringify(getComputedStyle(e)));
      e.id = id;
    });
    removeStylesAndScripts(document.body);
    subtreeSet(document.body).forEach(e => {
      if (e.className) {
        e.className = '';
      }
      if (e.style) {
        e.style = '';
      }
    });
    const html = shadow.innerHTML.replace(/ (class|style)=""/gm, '').replace(/(\s*\n\s*)+/gm, '\n');
    return { html, styles };
  });

  const page = await getPageForHtml({ browser, ...content });
  const inlineStyleHtml = await page.evaluate(() => {
    [...document.body.getElementsByTagName('*')].forEach(e => {
      const style = content.styles[e.id];
      if (style) {
        return true;
      }
    });
    removeStylesAndScripts(document.body);
    return document.body.innerHTML;
  });

  await browser.close();
  await fse.writeFile(file, inlineStyleHtml, 'utf-8');
  console.log(inlineStyleHtml);
  return inlineStyleHtml;
};

async function getPageForHtml({ browser, html, opts, styles }) {
  const tmp = require('tmp');
  const { name: tmpFile } = tmp.fileSync({ postfix: '.html' });
  const script = styles ? `<script>const content={styles:${JSON.stringify(styles)}};</script>` : '';
  await fse.writeFile(tmpFile, `<html><body>${script}${html}</body></html>`, 'utf-8');
  const page = await browser.newPage();
  await page.goto(`file://${tmpFile}`, opts);

  if (styles) {
    await page.addScriptTag({
      content: `const content={styles:${JSON.stringify(styles)}};`,
    });
  }
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

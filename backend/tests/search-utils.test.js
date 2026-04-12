const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractSearchResultUrl,
  matchesTargetDomains,
  parseBingResults,
  parseDuckDuckGoResults,
  parseSogouResults,
} = require('../src/lib/social/search-utils.js');

test('extractSearchResultUrl resolves direct target urls', () => {
  const url = extractSearchResultUrl('https://www.xiaohongshu.com/explore/abc');
  assert.equal(url, 'https://www.xiaohongshu.com/explore/abc');
});

test('extractSearchResultUrl resolves duckduckgo redirect urls', () => {
  const url = extractSearchResultUrl('https://duckduckgo.com/l/?uddg=https%3A%2F%2Fweibo.com%2F123');
  assert.equal(url, 'https://weibo.com/123');
});

test('matchesTargetDomains accepts decoded bing-style redirect targets', () => {
  const wrapped = 'https://www.bing.com/ck/a?!&&p=abc&u=a1aHR0cHM6Ly93ZWliby5jb20vMTIzNDU';
  assert.equal(matchesTargetDomains(wrapped, ['weibo.com']), true);
});

test('parseBingResults extracts only target-domain posts', () => {
  const html = `
    <li class="b_algo">
      <h2><a href="https://www.bing.com/ck/a?!&&p=abc&u=a1aHR0cHM6Ly93d3cueGlhb2hvbmdzaHUuY29tL2V4cGxvcmUvYWJj">北京柳絮</a></h2>
      <p>今天北京柳絮又来了</p>
    </li>
    <li class="b_algo">
      <h2><a href="https://example.com/news">无关内容</a></h2>
      <p>无关摘要</p>
    </li>
  `;

  const posts = parseBingResults(html, 'xiaohongshu', ['xiaohongshu.com'], { id: 'haidian', name: '海淀区' });

  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, 'https://www.xiaohongshu.com/explore/abc');
});

test('parseDuckDuckGoResults extracts wrapped target links', () => {
  const html = `
    <div class="result">
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fweibo.com%2Fpost-1">海淀柳絮</a>
      <a class="result__snippet">圆明园飞絮明显</a>
    </div>
  `;

  const posts = parseDuckDuckGoResults(html, 'weibo', ['weibo.com'], { id: 'haidian', name: '海淀区' });

  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, 'https://weibo.com/post-1');
  assert.match(posts[0].summary, /圆明园/);
});

test('parseSogouResults extracts direct target-domain links', () => {
  const html = `
    <div class="vrwrap">
      <h3><a href="https://weibo.com/1656961892/PnlMI6MiU">海淀圆明园飞絮明显</a></h3>
      <p class="str_info">今天圆明园门口风一大就糊脸</p>
    </div>
    <div class="vrwrap">
      <h3><a href="https://example.com/news">无关链接</a></h3>
      <p class="str_info">无关摘要</p>
    </div>
  `;

  const posts = parseSogouResults(html, 'weibo', ['weibo.com'], { id: 'haidian', name: '海淀区' });

  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, 'https://weibo.com/1656961892/PnlMI6MiU');
  assert.match(posts[0].title, /海淀/);
});

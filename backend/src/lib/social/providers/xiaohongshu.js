const { createLogger } = require('../../logger');
const CONFIG = require('../../../config');
const { parseBingResults, parseDuckDuckGoResults, parseSogouResults } = require('../search-utils');

const DOMAINS = ['xiaohongshu.com', 'www.xiaohongshu.com'];
const SOCIAL_TIMEOUT_MS = CONFIG.SOCIAL_TIMEOUT_MS;
const USER_AGENT = CONFIG.USER_AGENT;

function createXiaohongshuProvider(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const logger = options.logger || createLogger('xiaohongshu-provider');

  function buildQueries(district) {
    return [
      `北京 柳絮 小红书`,
      `北京 ${district.name} 柳絮 小红书`,
      `北京 ${district.shortName} 飞絮 小红书`,
      `北京 柳絮 ${district.hotspots[0] || district.name} 小红书`,
      `北京 杨絮 ${district.name} 小红书`,
    ];
  }

  async function fetchSearch(engine, query, district, attempt = 1) {
    const url = engine === 'duckduckgo'
      ? `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      : engine === 'sogou'
        ? `https://www.sogou.com/web?query=${encodeURIComponent(query)}`
        : `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-Hans`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SOCIAL_TIMEOUT_MS);
    let response;

    try {
      logger.debug(`Fetching xiaohongshu query (attempt ${attempt})`, {
        engine,
        query: query.substring(0, 50),
        district: district.id,
      });

      response = await fetchImpl(url, {
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'zh-CN,zh;q=0.9',
          'accept-encoding': 'gzip, deflate',
          'dnt': '1',
          'connection': 'keep-alive',
          'upgrade-insecure-requests': '1',
        },
      });
    } catch (error) {
      logger.warn(`Xiaohongshu query failed (attempt ${attempt})`, {
        engine,
        error: error.message,
        district: district.id,
        code: error.code,
      });

      if (attempt < 2 && error.code !== 'ENOTFOUND') {
        await new Promise(resolve => setTimeout(resolve, 300));
        return fetchSearch(engine, query, district, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      logger.warn(`Xiaohongshu HTTP error`, { status: response.status, district: district.id });
      throw new Error(`Xiaohongshu discovery failed: ${response.status}`);
    }

    const html = await response.text();
    if (engine === 'sogou') {
      return parseSogouResults(html, 'xiaohongshu', DOMAINS, district);
    }
    if (engine === 'duckduckgo') {
      return parseDuckDuckGoResults(html, 'xiaohongshu', DOMAINS, district);
    }
    return parseBingResults(html, 'xiaohongshu', DOMAINS, district);
  }

  async function searchDistrictPosts(district) {
    logger.info(`Searching xiaohongshu posts for ${district.name}`);

    const batches = await searchDistrictPostsDetailed(district);
    const results = batches.flatMap((batch) => batch.posts);
    logger.info(`Found ${results.length} xiaohongshu posts for ${district.name}`);
    return results;
  }

  async function searchDistrictPostsDetailed(district) {
    return Promise.all(
      buildQueries(district).map(async (query) => {
        try {
          const [sogouPosts, ddgPosts, bingPosts] = await Promise.all([
            fetchSearch('sogou', query, district).catch(() => []),
            fetchSearch('duckduckgo', query, district).catch(() => []),
            fetchSearch('bing', query, district).catch(() => []),
          ]);
          const posts = [...sogouPosts, ...ddgPosts, ...bingPosts];
          return {
            query,
            posts,
            error: null,
          };
        } catch (error) {
          logger.error(`Xiaohongshu search error for query`, {
            query: query.substring(0, 50),
            error: error.message,
            district: district.id,
          });
          return {
            query,
            posts: [],
            error: error.message,
          };
        }
      })
    );
  }

  return {
    platform: 'xiaohongshu',
    searchDistrictPosts,
    searchDistrictPostsDetailed,
  };
}

module.exports = {
  createXiaohongshuProvider,
};

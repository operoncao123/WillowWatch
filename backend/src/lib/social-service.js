const { createXiaohongshuProvider } = require('./social/providers/xiaohongshu.js');
const { createWeiboProvider } = require('./social/providers/weibo.js');

const CACHE_TTL_MS = 15 * 60 * 1000;
const SOCIAL_TOPIC_PATTERNS = ['柳絮', '飞絮', '杨絮', '杨柳絮', '絮团', '絮毛'];

function dedupePosts(posts) {
  const seen = new Set();

  return posts.filter((post) => {
    const key = `${post.platform}:${post.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isSocialTopic(post) {
  const text = `${post.title} ${post.summary}`;
  return SOCIAL_TOPIC_PATTERNS.some((pattern) => text.includes(pattern));
}

function getDistrictMatchType(post, district) {
  const text = `${post.title} ${post.summary}`;

  if (text.includes(district.name) || text.includes(district.shortName)) {
    return 'strong';
  }

  const hotspotHit = district.hotspots.some((hotspot) => {
    if (text.includes(hotspot)) {
      return true;
    }

    const simplified = hotspot.replace(/公园|森林|周边|沿线/g, '');
    return simplified && text.includes(simplified);
  });

  if (hotspotHit) {
    return 'strong';
  }

  if (isSocialTopic(post) && (text.includes('北京') || text.includes('京城') || text.includes('帝都'))) {
    return 'weak';
  }

  if (isSocialTopic(post)) {
    return 'weak';
  }

  return 'none';
}

function computeSeverity(posts) {
  if (!posts.length) {
    return 0;
  }

  const heavyPhrases = ['糊脸', '漫天', '严重', '护目镜', '太多', '爆发', '呛', '难受'];
  const total = posts.reduce((score, post) => {
    const text = `${post.title} ${post.summary}`;
    const hitCount = heavyPhrases.reduce(
      (count, phrase) => count + (text.includes(phrase) ? 1 : 0),
      0
    );
    return score + Math.min(1, 0.15 + hitCount * 0.18);
  }, 0);

  return Math.min(1, total / posts.length);
}

function createSocialService(options = {}) {
  const providers = options.providers || [
    createXiaohongshuProvider({ fetchImpl: options.fetchImpl }),
    createWeiboProvider({ fetchImpl: options.fetchImpl }),
  ];
  const cache = new Map();

  async function getDistrictSignal(district) {
    const cached = cache.get(district.id);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }

    const settled = await Promise.allSettled(
      providers.map(async (provider) => provider.searchDistrictPosts(district))
    );
    const providerResults = settled.map((result) => (result.status === 'fulfilled' ? result.value : []));

    const posts = dedupePosts(providerResults.flat());
    const classifiedPosts = posts.map((post) => ({
      ...post,
      matchType: getDistrictMatchType(post, district),
    }));
    const strongPosts = classifiedPosts.filter((post) => post.matchType === 'strong');
    const weakPosts = classifiedPosts.filter((post) => post.matchType === 'weak');
    const scoringPosts = strongPosts.length ? strongPosts : weakPosts;
    const matchQuality = strongPosts.length ? 'strong' : weakPosts.length ? 'weak' : 'none';
    const providerCount = new Set(scoringPosts.map((post) => post.platform)).size;
    const severityBase = computeSeverity(scoringPosts);
    const severity = matchQuality === 'weak' ? Math.min(0.65, severityBase * 0.72) : severityBase;
    const value = {
      postCount: scoringPosts.length,
      providerCount,
      severity,
      freshness: matchQuality === 'strong' ? 0.65 : matchQuality === 'weak' ? 0.35 : 0,
      matchQuality,
      samplePosts: (strongPosts.length ? strongPosts : weakPosts.length ? weakPosts : classifiedPosts).slice(0, 4),
    };

    cache.set(district.id, {
      timestamp: now,
      value,
    });

    return value;
  }

  async function getDistrictDebugReport(district) {
    const settled = await Promise.allSettled(
      providers.map(async (provider) => {
        if (typeof provider.searchDistrictPostsDetailed === 'function') {
          const queries = await provider.searchDistrictPostsDetailed(district);
          return {
            platform: provider.platform || 'unknown',
            queries,
          };
        }

        const posts = await provider.searchDistrictPosts(district);
        return {
          platform: provider.platform || 'unknown',
          queries: [
            {
              query: 'provider-default',
              posts,
              error: null,
            },
          ],
        };
      })
    );

    const providersReport = settled.map((result, index) => {
      if (result.status === 'fulfilled') {
        const providerReport = result.value;
        return {
          platform: providerReport.platform,
          queries: providerReport.queries.map((entry) => ({
            query: entry.query,
            error: entry.error,
            posts: entry.posts.map((post) => ({
              ...post,
              matchType: getDistrictMatchType(post, district),
              isTopic: isSocialTopic(post),
            })),
          })),
        };
      }

      return {
        platform: providers[index] && providers[index].platform ? providers[index].platform : 'unknown',
        queries: [
          {
            query: 'provider-error',
            error: result.reason ? result.reason.message : 'unknown provider error',
            posts: [],
          },
        ],
      };
    });

    const allPosts = providersReport.flatMap((provider) =>
      provider.queries.flatMap((entry) => entry.posts)
    );

    return {
      district: {
        id: district.id,
        name: district.name,
        shortName: district.shortName,
      },
      providers: providersReport,
      summary: {
        totalPosts: allPosts.length,
        strongCount: allPosts.filter((post) => post.matchType === 'strong').length,
        weakCount: allPosts.filter((post) => post.matchType === 'weak').length,
        noneCount: allPosts.filter((post) => post.matchType === 'none').length,
      },
    };
  }

  return {
    getDistrictSignal,
    getDistrictDebugReport,
  };
}

module.exports = {
  createSocialService,
  getDistrictMatchType,
  isSocialTopic,
};

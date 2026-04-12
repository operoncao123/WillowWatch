const test = require('node:test');
const assert = require('node:assert/strict');

const { createSocialService } = require('../src/lib/social-service.js');

const district = {
  id: 'haidian',
  name: '海淀区',
  shortName: '海淀',
  hotspots: ['颐和园', '圆明园', '国家植物园'],
};

test('social service keeps district-query topic posts visible even without explicit district mention', async () => {
  const service = createSocialService({
    providers: [
      {
        async searchDistrictPosts() {
          return [
            {
              platform: 'xiaohongshu',
              title: '今天北京柳絮又来了',
              summary: '风一吹就炸毛，口罩还是得戴',
              url: 'https://www.xiaohongshu.com/post-1',
            },
          ];
        },
      },
    ],
  });

  const signal = await service.getDistrictSignal(district);

  assert.equal(signal.postCount, 1);
  assert.equal(signal.providerCount, 1);
  assert.equal(signal.matchQuality, 'weak');
  assert.equal(signal.samplePosts.length, 1);
});

test('social service prefers strong district matches when explicit location evidence exists', async () => {
  const service = createSocialService({
    providers: [
      {
        async searchDistrictPosts() {
          return [
            {
              platform: 'weibo',
              title: '海淀圆明园飞絮明显',
              summary: '今天圆明园门口风一大就糊脸',
              url: 'https://weibo.com/post-1',
            },
            {
              platform: 'weibo',
              title: '北京柳絮又来了',
              summary: '还是得戴口罩',
              url: 'https://weibo.com/post-2',
            },
          ];
        },
      },
    ],
  });

  const signal = await service.getDistrictSignal(district);

  assert.equal(signal.postCount, 1);
  assert.equal(signal.providerCount, 1);
  assert.equal(signal.matchQuality, 'strong');
  assert.match(signal.samplePosts[0].title, /海淀/);
});

test('social service exposes provider-level debug report with match classification', async () => {
  const service = createSocialService({
    providers: [
      {
        platform: 'xiaohongshu',
        async searchDistrictPostsDetailed() {
          return [
            {
              query: 'site:xiaohongshu.com 北京 海淀区 柳絮',
              posts: [
                {
                  platform: 'xiaohongshu',
                  title: '北京柳絮又来了',
                  summary: '今天风大，柳絮很多',
                  url: 'https://www.xiaohongshu.com/post-a',
                },
                {
                  platform: 'xiaohongshu',
                  title: '海淀圆明园飞絮明显',
                  summary: '走到圆明园门口就开始糊脸',
                  url: 'https://www.xiaohongshu.com/post-b',
                },
              ],
            },
          ];
        },
        async searchDistrictPosts() {
          return [];
        },
      },
    ],
  });

  const report = await service.getDistrictDebugReport(district);

  assert.equal(report.district.id, 'haidian');
  assert.equal(report.providers.length, 1);
  assert.equal(report.providers[0].platform, 'xiaohongshu');
  assert.equal(report.providers[0].queries.length, 1);
  assert.equal(report.providers[0].queries[0].posts.length, 2);
  assert.equal(report.providers[0].queries[0].posts[0].matchType, 'weak');
  assert.equal(report.providers[0].queries[0].posts[1].matchType, 'strong');
  assert.equal(report.summary.strongCount, 1);
  assert.equal(report.summary.weakCount, 1);
});

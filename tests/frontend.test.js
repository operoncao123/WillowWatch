const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPageState,
  chunkItems,
  getDistrictVisualStyle,
  getRiskSticker,
  getStickerCollection,
  getStickerVariantOptions,
  resolveDataStrategy,
  resolveApiBase,
  selectOverviewModel,
} = require('../script.js');

test('chunkItems groups district tiles into fixed rows', () => {
  const rows = chunkItems([1, 2, 3, 4, 5], 4);
  assert.deepEqual(rows, [[1, 2, 3, 4], [5]]);
});

test('buildPageState converts overview payload into poster and detail view model', () => {
  const state = buildPageState({
    generatedAt: '2026-04-11 21:30',
    poster: {
      headline: '今天北京哪里柳絮最猛？',
      dek: '全市已有 2 个区进入高风险，朝阳区最值得警惕。',
      topDistrict: {
        id: 'chaoyang',
        name: '朝阳区',
        score: 84,
        level: { key: 'high', label: '高风险' },
      },
      updatedAt: '2026-04-11 21:30',
    },
    ranking: [
      { id: 'chaoyang', name: '朝阳区', shortName: '朝阳', score: 64, level: { key: 'high', label: '高风险' }, ecologyMultiplier: 1.28 },
      { id: 'haidian', name: '海淀区', shortName: '海淀', score: 62, level: { key: 'high', label: '高风险' }, ecologyMultiplier: 1.24, districtTag: '园林高校带', districtHint: '圆明园与植物园周边暴露更强' },
      { id: 'tongzhou', name: '通州区', shortName: '通州', score: 48, level: { key: 'medium', label: '中风险' }, ecologyMultiplier: 1.18, districtTag: '运河森林', districtHint: '绿心与运河森林一带更敏感' },
      { id: 'dongcheng', name: '东城区', shortName: '东城', score: 36, level: { key: 'medium', label: '中风险' }, ecologyMultiplier: 1.1, districtTag: '老城中轴', districtHint: '胡同绿荫与中轴公园交织' },
      { id: 'yanqing', name: '延庆区', shortName: '延庆', score: 18, level: { key: 'low', label: '低风险' }, ecologyMultiplier: 0.91, districtTag: '高地晴风', districtHint: '高地晴天阵风会放大飘散感' }
    ],
    selectedDistrict: {
      id: 'chaoyang',
      name: '朝阳区',
      shortName: '朝阳',
      score: 64,
      level: { key: 'high', label: '高风险' },
      weather: {
        date: '2026-04-11',
        temperatureMax: 27,
        temperatureMin: 13,
        temperatureMean: 20,
        humidity: 45,
        windSpeed: 4.5,
        precipitation: 0.2,
      },
      tomorrow: {
        score: 60,
        level: { key: 'medium', label: '中风险' },
        weather: {
          date: '2026-04-12',
          temperatureMax: 28,
          temperatureMin: 15,
          temperatureMean: 21.5,
          humidity: 48,
          windSpeed: 5.2,
          precipitation: 0
        }
      },
      weatherScore: 50,
      ecologyMultiplier: 1.28,
      hotspots: ['朝阳公园', '奥林匹克森林公园'],
      advice: '建议减少外出，尤其注意大型公园。',
      headline: '朝阳区当前区级生态暴露较强，需要重点留意大型绿地周边。',
      rollingGdd: 14.5,
      gddBoost: 1.15,
      precipitationPenalty: 0.9,
      drynessWindBoost: 1.16,
      sunshineBoost: 1.16,
      cloudPenalty: 1,
      sunnyStreakBoost: 1.12,
    }
  }, 'handdrawn');

  assert.equal(state.poster.badge, '朝阳区 · 84');
  assert.equal(state.matrixRows.length, 2);
  assert.match(state.matrixRows[0][0].stickerSvg, /risk-high\.webp/);
  assert.equal(state.matrixRows[0][0].visualStyle.key, 'garden');
  assert.equal(state.activeStickerVariant, 'handdrawn');
  assert.equal(state.stickerVariants.length, 1);
  assert.equal(state.selected.detailTitle, '朝阳区实时详情');
  assert.equal(state.selected.drivers.length, 2);
  assert.equal(state.selected.factors.length, 7);
  assert.equal(state.selected.factors[0].label, '连续积温');
  assert.equal(state.selected.factors[4].label, '日照/辐射');
  assert.equal(state.matrixRows[0][0].ecologyTag, '生态 x1.28');
  const flattened = state.matrixRows.flat();
  const haidianTile = flattened.find((item) => item.shortName === '海淀');
  assert.equal(haidianTile.districtTag, '园林高校带');
  assert.equal(haidianTile.visualStyle.key, 'garden');
  assert.match(haidianTile.districtHint, /植物园/);
  assert.match(state.poster.stickerSvg, /risk-high\.webp/);
  assert.match(state.selected.todayCard.stickerSvg, /risk-high\.webp/);
  assert.match(state.selected.tomorrowCard.stickerSvg, /risk-medium\.webp/);
  assert.equal(state.stickers.length, 3);
});

test('getDistrictVisualStyle groups districts into different visual families', () => {
  assert.deepEqual(getDistrictVisualStyle('dongcheng'), { key: 'axis', label: '中轴肌理' });
  assert.deepEqual(getDistrictVisualStyle('chaoyang'), { key: 'garden', label: '园林树冠' });
  assert.deepEqual(getDistrictVisualStyle('tongzhou'), { key: 'water', label: '水岸风带' });
  assert.deepEqual(getDistrictVisualStyle('yanqing'), { key: 'ridge', label: '山地晴风' });
  assert.deepEqual(getDistrictVisualStyle('unknown'), { key: 'paper', label: '纸面底纹' });
});

test('getRiskSticker maps each risk level to a sticker asset', () => {
  assert.match(getRiskSticker('low', 'handdrawn'), /class="liuxu-sticker-image"/);
  assert.match(getRiskSticker('low', 'handdrawn'), /assets\/stickers\/risk-low\.webp\?v=/);
  assert.match(getRiskSticker('low', 'semireal'), /低风险/);
  assert.match(getRiskSticker('medium', 'ribbon'), /assets\/stickers\/risk-medium\.webp\?v=/);
  assert.match(getRiskSticker('medium', 'ribbon'), /中风险/);
  assert.match(getRiskSticker('high', 'comic'), /assets\/stickers\/risk-high\.webp\?v=/);
  assert.match(getRiskSticker('high', 'comic'), /高风险/);
});

test('getStickerCollection returns share-ready stickers for all risk levels', () => {
  const collection = getStickerCollection('handdrawn');
  assert.equal(collection.length, 3);
  assert.match(collection[0].svg, /risk-low\.webp\?v=/);
  assert.match(collection[1].svg, /risk-medium\.webp\?v=/);
  assert.match(collection[2].svg, /risk-high\.webp\?v=/);
});

test('getStickerVariantOptions exposes multiple visual directions to choose from', () => {
  const variants = getStickerVariantOptions();
  assert.equal(variants.length, 1);
  assert.deepEqual(
    variants.map((item) => item.key),
    ['handdrawn']
  );
});

test('resolveApiBase falls back to local backend when opened from file protocol', () => {
  assert.equal(resolveApiBase('', 'file:///Users/test/index.html'), 'http://127.0.0.1:8787');
  assert.equal(resolveApiBase('http://localhost:9000', 'file:///Users/test/index.html'), 'http://localhost:9000');
  assert.equal(resolveApiBase('', 'http://127.0.0.1:8787/index.html'), '');
});

test('resolveApiBase prefers runtime config and explicit query override for deployed pages', () => {
  assert.equal(
    resolveApiBase('', 'https://example.github.io/liuxu/', { apiBase: 'https://liuxu-api.example.com' }),
    'https://liuxu-api.example.com'
  );
  assert.equal(
    resolveApiBase(
      '',
      'https://example.github.io/liuxu/?api=https%3A%2F%2Foverride.example.com',
      { apiBase: 'https://liuxu-api.example.com' }
    ),
    'https://override.example.com'
  );
});

test('resolveDataStrategy uses static overview json on deployed pages without api base', () => {
  assert.deepEqual(
    resolveDataStrategy('', 'https://example.github.io/liuxu/', {}),
    {
      kind: 'static',
      overviewUrl: 'data/overview.json',
    }
  );

  assert.deepEqual(
    resolveDataStrategy('', 'http://127.0.0.1:8787/', {}),
    {
      kind: 'api',
      base: '',
    }
  );
});

test('selectOverviewModel picks district client-side from static dataset', () => {
  const payload = {
    generatedAt: '2026-04-12 22:00',
    city: { id: 'beijing', name: '北京市' },
    poster: {
      headline: '今天北京哪里柳絮最猛？',
      dek: '朝阳区仍是当前最需要留意的区域。',
      topDistrict: { id: 'chaoyang', name: '朝阳区', score: 43, level: { key: 'medium', label: '中风险' } },
      updatedAt: '2026-04-12 22:00',
    },
    topDistrict: { id: 'chaoyang', name: '朝阳区', score: 43, level: { key: 'medium', label: '中风险' } },
    ranking: [{ id: 'chaoyang', shortName: '朝阳', score: 43, level: { key: 'medium', label: '中风险' }, ecologyMultiplier: 1.28 }],
    defaultDistrictId: 'chaoyang',
    districts: [
      { id: 'chaoyang', name: '朝阳区', shortName: '朝阳', score: 43, level: { key: 'medium', label: '中风险' }, weatherScore: 26, ecologyMultiplier: 1.28, rollingGdd: 5.8, gddBoost: 1.06, precipitationPenalty: 1, drynessWindBoost: 1.12, sunshineBoost: 1.16, cloudPenalty: 0.93, sunnyStreakBoost: 1, weather: {}, tomorrow: {}, hotspots: [], advice: 'x', headline: 'x' },
      { id: 'haidian', name: '海淀区', shortName: '海淀', score: 39, level: { key: 'medium', label: '中风险' }, weatherScore: 24, ecologyMultiplier: 1.24, rollingGdd: 7.7, gddBoost: 1.08, precipitationPenalty: 1, drynessWindBoost: 1.08, sunshineBoost: 1.12, cloudPenalty: 0.93, sunnyStreakBoost: 1, weather: {}, tomorrow: {}, hotspots: [], advice: 'y', headline: 'y' }
    ],
  };

  const selected = selectOverviewModel(payload, 'haidian');
  assert.equal(selected.selectedDistrict.id, 'haidian');
  assert.equal(selected.poster.topDistrict.id, 'chaoyang');
  assert.equal(selected.ranking.length, 1);
});

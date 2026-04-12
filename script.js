(function () {
  'use strict';

  const DEFAULT_STICKER_VARIANT = 'handdrawn';
  const HANDDRAWN_STICKER_VERSION = '20260412c';

  const RISK_META = {
    low: { label: '低风险', cloud: '#DDF7DE', face: '#315441', tint: '#F4FFF4', accent: '#76BE78', blush: '#FFD7D7' },
    medium: { label: '中风险', cloud: '#FFE3A8', face: '#6B4E18', tint: '#FFF7E8', accent: '#F0B336', blush: '#FFD8C4' },
    high: { label: '高风险', cloud: '#FFCABC', face: '#6C3B34', tint: '#FFF0EC', accent: '#E16751', blush: '#FFD0C6' },
  };

  function getRiskMeta(levelKey) {
    return RISK_META[levelKey] || RISK_META.low;
  }

  function getStickerVariantOptions() {
    return [
      {
        key: 'handdrawn',
        label: '你的手绘版',
        description: '使用你放进工作目录的低 / 中 / 高风险插图',
        previewSvg: getRiskSticker('medium', 'handdrawn'),
      },
    ];
  }


  function chunkItems(items, size) {
    const rows = [];

    for (let index = 0; index < items.length; index += size) {
      rows.push(items.slice(index, index + size));
    }

    return rows;
  }

  function formatNumber(value, digits) {
    const number = Number.isFinite(Number(value)) ? Number(value) : 0;
    return number.toFixed(digits).replace(/\.0$/, '');
  }

  function formatDateLabel(isoDate) {
    if (!isoDate) {
      return '--';
    }

    const date = new Date(`${isoDate}T12:00:00+08:00`);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${weekdays[date.getDay()]} · ${date.getMonth() + 1}/${date.getDate()}`;
  }

  function getRiskSticker(levelKey, variantKey) {
    const imageMap = {
      low: `assets/stickers/risk-low.webp?v=${HANDDRAWN_STICKER_VERSION}`,
      medium: `assets/stickers/risk-medium.webp?v=${HANDDRAWN_STICKER_VERSION}`,
      high: `assets/stickers/risk-high.webp?v=${HANDDRAWN_STICKER_VERSION}`,
    };
    const src = imageMap[levelKey] || imageMap.low;
    const label = getRiskMeta(levelKey).label;
    return `<img class="liuxu-sticker-image" data-variant="handdrawn" data-risk="${levelKey}" src="${src}" alt="${label}柳絮风险形象">`;
  }

  function getStickerCollection(variantKey) {
    return [
      {
        key: 'low',
        label: '低风险贴纸',
        caption: '轻盈、软糯、可安心出门',
        svg: getRiskSticker('low', variantKey),
      },
      {
        key: 'medium',
        label: '中风险贴纸',
        caption: '有风就炸毛，建议基础防护',
        svg: getRiskSticker('medium', variantKey),
      },
      {
        key: 'high',
        label: '高风险贴纸',
        caption: '减少户外停留，注意口鼻防护',
        svg: getRiskSticker('high', variantKey),
      },
    ];
  }

  function getDistrictVisualStyle(districtId) {
    const styleMap = {
      dongcheng: { key: 'axis', label: '中轴肌理' },
      xicheng: { key: 'axis', label: '中轴肌理' },
      chaoyang: { key: 'garden', label: '园林树冠' },
      haidian: { key: 'garden', label: '园林树冠' },
      fengtai: { key: 'garden', label: '园林树冠' },
      tongzhou: { key: 'water', label: '水岸风带' },
      shunyi: { key: 'water', label: '水岸风带' },
      daxing: { key: 'water', label: '水岸风带' },
      miyun: { key: 'water', label: '水岸风带' },
      pinggu: { key: 'water', label: '水岸风带' },
      shijingshan: { key: 'ridge', label: '山地晴风' },
      changping: { key: 'ridge', label: '山地晴风' },
      mentougou: { key: 'ridge', label: '山地晴风' },
      fangshan: { key: 'ridge', label: '山地晴风' },
      huairou: { key: 'ridge', label: '山地晴风' },
      yanqing: { key: 'ridge', label: '山地晴风' },
    };

    return styleMap[districtId] || { key: 'paper', label: '纸面底纹' };
  }

  function buildForecastCardModel(label, score, level, weather, advice, stickerVariant) {
    const weatherData = weather || {};

    return {
      label,
      score: formatNumber(score, 0),
      level: level || { key: 'low', label: '低风险' },
      stickerSvg: getRiskSticker(level && level.key, stickerVariant),
      dateLabel: formatDateLabel(weatherData.date),
      weatherLine: `${formatNumber(weatherData.temperatureMin, 1)}℃ / ${formatNumber(weatherData.temperatureMax, 1)}℃`,
      humidity: `${formatNumber(weatherData.humidity, 0)}%`,
      wind: `${formatNumber(weatherData.windSpeed, 1)} m/s`,
      precipitation: `${formatNumber(weatherData.precipitation, 1)} mm`,
      averageTemp: `${formatNumber(weatherData.temperatureMean, 1)}℃`,
      advice,
    };
  }

  function buildPageState(model, stickerVariant) {
    const selected = model.selectedDistrict || {};
    const posterTop = model.poster && model.poster.topDistrict ? model.poster.topDistrict : selected;
    const ranking = Array.isArray(model.ranking) ? model.ranking : [];
    const activeStickerVariant = stickerVariant || DEFAULT_STICKER_VARIANT;

    return {
      activeStickerVariant,
      stickerVariants: getStickerVariantOptions(),
      poster: {
        title: model.poster && model.poster.headline ? model.poster.headline : '今天北京哪里柳絮最猛？',
        dek: model.poster && model.poster.dek ? model.poster.dek : '正在更新北京 16 区柳絮态势。',
        badge: `${posterTop.name || '--'} · ${formatNumber(posterTop.score, 0)}`,
        stickerSvg: getRiskSticker(posterTop.level && posterTop.level.key, activeStickerVariant),
        updated: model.generatedAt || (model.poster && model.poster.updatedAt) || '--',
        note: '当前主要由天气条件与生态暴露共同驱动',
      },
      stickers: getStickerCollection(activeStickerVariant),
      matrixRows: chunkItems(
        ranking.map((district) => ({
          visualStyle: getDistrictVisualStyle(district.id),
          id: district.id,
          shortName: district.shortName,
          score: formatNumber(district.score, 0),
          level: district.level,
          stickerSvg: getRiskSticker(district.level && district.level.key, activeStickerVariant),
          ecologyTag: `生态 x${formatNumber(district.ecologyMultiplier, 2)}`,
          districtTag: district.districtTag || '',
          districtHint: district.districtHint || '',
          isActive: district.id === selected.id,
        })),
        4
      ),
      selected: {
        id: selected.id,
        detailTitle: `${selected.name || '--'}实时详情`,
        headline: selected.headline || '当前区详情载入中',
        drivers: [
          { label: '天气驱动', value: `${formatNumber(selected.weatherScore, 0)} 分` },
          { label: '生态修正', value: `x${formatNumber(selected.ecologyMultiplier, 2)}` },
        ],
        factors: [
          { label: '连续积温', value: `${formatNumber(selected.rollingGdd, 1)}℃`, tone: 'warm' },
          { label: '积温修正', value: `x${formatNumber(selected.gddBoost, 2)}`, tone: 'warm' },
          { label: '近48h降水抑制', value: `x${formatNumber(selected.precipitationPenalty, 2)}`, tone: 'rain' },
          { label: '干燥/阵风', value: `x${formatNumber(selected.drynessWindBoost, 2)}`, tone: 'wind' },
          { label: '日照/辐射', value: `x${formatNumber(selected.sunshineBoost, 2)}`, tone: 'sun' },
          { label: '云量抑制', value: `x${formatNumber(selected.cloudPenalty, 2)}`, tone: 'cloud' },
          { label: '连续晴天', value: `x${formatNumber(selected.sunnyStreakBoost, 2)}`, tone: 'sun' },
        ],
        hotspots: Array.isArray(selected.hotspots) ? selected.hotspots : [],
        todayCard: buildForecastCardModel('今日', selected.score, selected.level, selected.weather, selected.advice, activeStickerVariant),
        tomorrowCard: buildForecastCardModel(
          '明日',
          selected.tomorrow && selected.tomorrow.score,
          selected.tomorrow && selected.tomorrow.level,
          selected.tomorrow && selected.tomorrow.weather,
          selected.tomorrow && selected.tomorrow.advice,
          activeStickerVariant
        ),
      },
    };
  }

  function getApiBase() {
    if (typeof document === 'undefined') {
      return '';
    }

    const meta = document.querySelector('meta[name="liuxu-api-base"]');
    const configured = meta && meta.content ? meta.content.trim() : '';
    const runtimeConfig =
      typeof window !== 'undefined' && window.LIUXU_APP_CONFIG && typeof window.LIUXU_APP_CONFIG === 'object'
        ? window.LIUXU_APP_CONFIG
        : {};

    return resolveApiBase(configured, typeof window !== 'undefined' ? window.location.href : '', runtimeConfig);
  }

  function normalizeApiBase(value) {
    return String(value || '').trim().replace(/\/$/, '');
  }

  function normalizeStaticPath(value) {
    return String(value || '').trim().replace(/^\/+/, '') || 'data/overview.json';
  }

  function isLocalHost(href) {
    if (!href) {
      return false;
    }

    const currentUrl = new URL(href, 'http://127.0.0.1');
    return ['127.0.0.1', 'localhost'].includes(currentUrl.hostname);
  }

  function resolveApiBase(configuredBase, locationHref, runtimeConfig) {
    const href = String(locationHref || '');
    const runtimeBase =
      runtimeConfig && typeof runtimeConfig.apiBase === 'string'
        ? normalizeApiBase(runtimeConfig.apiBase)
        : '';

    if (href) {
      const currentUrl = new URL(href, 'http://127.0.0.1');
      const queryOverride = normalizeApiBase(currentUrl.searchParams.get('api'));

      if (queryOverride) {
        return queryOverride;
      }
    }

    if (configuredBase) {
      return normalizeApiBase(configuredBase);
    }

    if (runtimeBase) {
      return runtimeBase;
    }

    if (href.startsWith('file:')) {
      return 'http://127.0.0.1:8787';
    }

    return '';
  }

  function resolveDataStrategy(configuredBase, locationHref, runtimeConfig) {
    const href = String(locationHref || '');
    const apiBase = resolveApiBase(configuredBase, href, runtimeConfig);
    const staticPath =
      runtimeConfig && typeof runtimeConfig.staticDataPath === 'string'
        ? normalizeStaticPath(runtimeConfig.staticDataPath)
        : 'data/overview.json';

    if (apiBase) {
      return {
        kind: 'api',
        base: apiBase,
      };
    }

    if (href.startsWith('file:') || isLocalHost(href)) {
      return {
        kind: 'api',
        base: '',
      };
    }

    return {
      kind: 'static',
      overviewUrl: staticPath,
    };
  }

  function selectOverviewModel(payload, districtId) {
    if (!payload || payload.selectedDistrict) {
      return payload;
    }

    const districts = Array.isArray(payload.districts) ? payload.districts : [];

    if (!districts.length) {
      return payload;
    }

    const selectedDistrict =
      districts.find((district) => district.id === districtId) ||
      districts.find((district) => district.id === payload.defaultDistrictId) ||
      districts[0];

    return {
      ...payload,
      selectedDistrict,
    };
  }

  function renderDistrictMatrix(state) {
    return state.matrixRows
      .map(
        (row) => `
          <div class="matrix-row">
            ${row
              .map(
                (district) => `
                  <button class="district-tile ${district.level.key} style-${district.visualStyle.key} ${district.isActive ? 'is-active' : ''}" data-district-id="${district.id}">
                    <div class="district-scene">${district.visualStyle.label}</div>
                    <div class="district-sticker">${district.stickerSvg}</div>
                    <div class="district-tag">${district.districtTag}</div>
                    <div class="district-name">${district.shortName}</div>
                    <div class="district-score">${district.score}</div>
                    <div class="district-level">${district.level.label}</div>
                    <div class="district-social">${district.ecologyTag}</div>
                    <div class="district-hint">${district.districtHint}</div>
                  </button>
                `
              )
              .join('')}
          </div>
        `
      )
      .join('');
  }

  function renderForecastCard(card) {
    return `
      <article class="forecast-card">
        <div class="forecast-card-head">
          <div>
            <p class="forecast-label">${card.label}</p>
            <div class="forecast-date">${card.dateLabel}</div>
          </div>
          <div class="forecast-badge ${card.level.key}">${card.level.label}</div>
        </div>

        <div class="forecast-sticker-wrap">
          ${card.stickerSvg}
        </div>

        <div class="forecast-score">
          <div>
            <div class="score-value">${card.score}</div>
            <div class="score-caption">区级综合风险分</div>
          </div>
          <div class="meter-track" aria-hidden="true">
            <div class="meter-fill" style="width: ${card.score}%;"></div>
          </div>
        </div>

        <div class="facts-grid">
          <div class="fact-chip"><span class="fact-copy">🌡️ 温度</span><strong>${card.weatherLine}</strong></div>
          <div class="fact-chip"><span class="fact-copy">☁️ 平均温度</span><strong>${card.averageTemp}</strong></div>
          <div class="fact-chip"><span class="fact-copy">💧 湿度</span><strong>${card.humidity}</strong></div>
          <div class="fact-chip"><span class="fact-copy">🍃 风速</span><strong>${card.wind}</strong></div>
          <div class="fact-chip"><span class="fact-copy">🌦️ 降水</span><strong>${card.precipitation}</strong></div>
        </div>

        <div class="advice-box">
          <strong>出行提醒</strong>
          <div class="fact-copy">${card.advice}</div>
        </div>
      </article>
    `;
  }

  function renderFactorGrid(items) {
    return items
      .map(
        (item) => `
          <div class="factor-chip ${item.tone || ''}">
            <span class="factor-label">${item.label}</span>
            <strong class="factor-value">${item.value}</strong>
          </div>
        `
      )
      .join('');
  }

  function renderStickerGallery(items) {
    return items
      .map(
        (item) => `
          <article class="sticker-card ${item.key}">
            <div class="sticker-card-image">${item.svg}</div>
            <div class="sticker-card-copy">
              <h3>${item.label}</h3>
              <p>${item.caption}</p>
            </div>
          </article>
        `
      )
      .join('');
  }

  let currentStickerVariant = DEFAULT_STICKER_VARIANT;
  let currentOverviewModel = null;

  function renderPage(model) {
    currentOverviewModel = model;
    const state = buildPageState(model, currentStickerVariant);

    document.getElementById('posterHeadline').textContent = state.poster.title;
    document.getElementById('posterDek').textContent = state.poster.dek;
    document.getElementById('posterBadge').textContent = state.poster.badge;
    document.getElementById('posterUpdated').textContent = `更新 ${state.poster.updated}`;
    document.getElementById('posterNote').textContent = state.poster.note;
    document.getElementById('posterSticker').innerHTML = state.poster.stickerSvg;
    document.getElementById('stickerGallery').innerHTML = renderStickerGallery(state.stickers);

    document.getElementById('districtMatrix').innerHTML = renderDistrictMatrix(state);
    document.getElementById('detailTitle').textContent = state.selected.detailTitle;
    document.getElementById('detailHeadline').textContent = state.selected.headline;
    document.getElementById('driverStrip').innerHTML = state.selected.drivers
      .map((item) => `<div class="driver-pill"><strong>${item.label}</strong>${item.value}</div>`)
      .join('');
    document.getElementById('factorGrid').innerHTML = renderFactorGrid(state.selected.factors);
    document.getElementById('hotspotStrip').innerHTML = state.selected.hotspots
      .map((item) => `<div class="hotspot-pill">${item}</div>`)
      .join('');
    document.getElementById('detailCards').innerHTML = [
      renderForecastCard(state.selected.todayCard),
      renderForecastCard(state.selected.tomorrowCard),
    ].join('');
  }

  async function fetchOverview(districtId) {
    const runtimeConfig =
      typeof window !== 'undefined' && window.LIUXU_APP_CONFIG && typeof window.LIUXU_APP_CONFIG === 'object'
        ? window.LIUXU_APP_CONFIG
        : {};
    const locationHref = typeof window !== 'undefined' ? window.location.href : 'http://127.0.0.1';
    const strategy = resolveDataStrategy(
      typeof document !== 'undefined'
        ? ((document.querySelector('meta[name="liuxu-api-base"]') || {}).content || '').trim()
        : '',
      locationHref,
      runtimeConfig
    );

    // 添加 5 秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const requestUrl =
        strategy.kind === 'api'
          ? (() => {
              const url = new URL(`${strategy.base}/api/overview`, locationHref);
              if (districtId) {
                url.searchParams.set('district', districtId);
              }
              return url.toString();
            })()
          : new URL(strategy.overviewUrl, locationHref).toString();

      const response = await fetch(requestUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Overview request failed: ${response.status}`);
      }

      const payload = await response.json();
      return selectOverviewModel(payload, districtId);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function loadDistrict(districtId) {
    const statusPanel = document.getElementById('statusPanel');
    statusPanel.textContent = '正在更新北京 16 区专题数据...';

    try {
      const model = await fetchOverview(districtId);
      renderPage(model);
      statusPanel.textContent = `已汇总 ${model.city.name} 风险矩阵、区级详情与生态暴露因子。`;
    } catch (error) {
      if (typeof window !== 'undefined' && String(window.location.href).startsWith('file:')) {
        statusPanel.textContent = '当前是直接打开静态文件，请先运行 `npm start`，再访问 http://127.0.0.1:8787 。';
        return;
      }

      statusPanel.textContent = `暂时无法连接后端数据服务：${error.message}`;
    }
  }

  function bindDistrictMatrix() {
    const matrix = document.getElementById('districtMatrix');

    matrix.addEventListener('click', (event) => {
      const button = event.target.closest('[data-district-id]');

      if (!button) {
        return;
      }

      loadDistrict(button.getAttribute('data-district-id'));
    });
  }

  function init() {
    if (typeof document === 'undefined') {
      return;
    }

    bindDistrictMatrix();
    loadDistrict();
  }

  const api = {
    chunkItems,
    buildPageState,
    getDistrictVisualStyle,
    getRiskSticker,
    getStickerCollection,
    getStickerVariantOptions,
    resolveDataStrategy,
    resolveApiBase,
    selectOverviewModel,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof window !== 'undefined') {
    window.LiuxuFrontend = api;
    window.addEventListener('DOMContentLoaded', init);
  }
})();

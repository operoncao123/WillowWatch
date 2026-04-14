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

  function getRiskStickerAsset(levelKey) {
    const imageMap = {
      low: `assets/stickers/risk-low.webp?v=${HANDDRAWN_STICKER_VERSION}`,
      medium: `assets/stickers/risk-medium.webp?v=${HANDDRAWN_STICKER_VERSION}`,
      high: `assets/stickers/risk-high.webp?v=${HANDDRAWN_STICKER_VERSION}`,
    };

    return imageMap[levelKey] || imageMap.low;
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
    const src = getRiskStickerAsset(levelKey);
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

  function buildForecastCardModel(label, score, level, weather, advice, stickerVariant, shareKey) {
    const weatherData = weather || {};
    const normalizedLevel = level || { key: 'low', label: '低风险' };
    const stickerSrc = getRiskStickerAsset(normalizedLevel && normalizedLevel.key);

    return {
      label,
      score: formatNumber(score, 0),
      level: normalizedLevel,
      stickerSvg: getRiskSticker(level && level.key, stickerVariant),
      stickerSrc,
      shareKey,
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
        todayCard: buildForecastCardModel('今日', selected.score, selected.level, selected.weather, selected.advice, activeStickerVariant, 'today'),
        tomorrowCard: buildForecastCardModel(
          '明日',
          selected.tomorrow && selected.tomorrow.score,
          selected.tomorrow && selected.tomorrow.level,
          selected.tomorrow && selected.tomorrow.weather,
          selected.tomorrow && selected.tomorrow.advice,
          activeStickerVariant,
          'tomorrow'
        ),
      },
    };
  }

  function sanitizeFilenamePart(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/区/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
      .replace(/[\u4e00-\u9fa5]/g, (char) => {
        const map = {
          朝: 'chao',
          阳: 'yang',
          海: 'hai',
          淀: 'dian',
          东: 'dong',
          城: 'cheng',
          西: 'xi',
          丰: 'feng',
          台: 'tai',
          石: 'shi',
          景: 'jing',
          山: 'shan',
          通: 'tong',
          州: 'zhou',
          顺: 'shun',
          义: 'yi',
          昌: 'chang',
          平: 'ping',
          大: 'da',
          兴: 'xing',
          门: 'men',
          头: 'tou',
          沟: 'gou',
          房: 'fang',
          怀: 'huai',
          柔: 'rou',
          密: 'mi',
          云: 'yun',
          延: 'yan',
          庆: 'qing',
        };
        return map[char] || '';
      }) || 'beijing';
  }

  function buildShareImageModel(options) {
    const card = options && options.card ? options.card : {};
    const districtName = options && options.districtName ? options.districtName : '北京市';
    const cityName = options && options.cityName ? options.cityName : '北京市';
    const factors = Array.isArray(options && options.factors) ? options.factors.slice(0, 3) : [];

    return {
      title: `${districtName}柳絮风险`,
      subtitle: `${card.label || '今日'} · ${card.dateLabel || '--'}`,
      districtName,
      cityName,
      generatedAt: options && options.generatedAt ? options.generatedAt : '--',
      levelLabel: card.level && card.level.label ? card.level.label : '低风险',
      levelKey: card.level && card.level.key ? card.level.key : 'low',
      score: card.score || '0',
      advice: card.advice || '',
      stickerSrc: card.stickerSrc || getRiskStickerAsset(card.level && card.level.key),
      metrics: [
        { label: '温度', value: card.weatherLine || '--' },
        { label: '平均温度', value: card.averageTemp || '--' },
        { label: '湿度', value: card.humidity || '--' },
        { label: '风速', value: card.wind || '--' },
      ],
      drivers: factors.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      shareFilename: `liuxu-${sanitizeFilenamePart(districtName)}-${card.shareKey || 'card'}.png`,
    };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      image.src = src;
    });
  }

  function roundRectPath(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
    ctx.closePath();
  }

  function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.save();
    roundRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const content = String(text || '');
    const chars = Array.from(content);
    const lines = [];
    let current = '';

    chars.forEach((char) => {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    });

    if (current) {
      lines.push(current);
    }

    const limitedLines = typeof maxLines === 'number' ? lines.slice(0, maxLines) : lines;
    limitedLines.forEach((line, index) => {
      const isLastVisibleLine = typeof maxLines === 'number' && index === maxLines - 1 && lines.length > maxLines;
      const output = isLastVisibleLine ? `${line.slice(0, Math.max(0, line.length - 1))}…` : line;
      ctx.fillText(output, x, y + lineHeight * index);
    });

    return limitedLines.length;
  }

  async function renderShareImage(model) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    const riskMeta = getRiskMeta(model.levelKey);
    const stickerImage = await loadImage(model.stickerSrc);

    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    backgroundGradient.addColorStop(0, '#f8ebd3');
    backgroundGradient.addColorStop(0.55, '#f9f0e5');
    backgroundGradient.addColorStop(1, '#efe7da');
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(860, 180, 40, 860, 180, 360);
    glow.addColorStop(0, 'rgba(255, 201, 140, 0.35)');
    glow.addColorStop(1, 'rgba(255, 201, 140, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    fillRoundRect(ctx, 72, 70, 936, 1300, 40, 'rgba(255, 250, 242, 0.9)');

    ctx.fillStyle = '#8d7360';
    ctx.font = '500 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText('BEIJING WILLOW WATCH', 118, 132);

    ctx.fillStyle = '#2e231d';
    ctx.font = '700 78px "Baskerville", "Georgia", "Songti SC", serif';
    drawWrappedText(ctx, model.title, 118, 240, 580, 84, 2);

    ctx.fillStyle = '#75665d';
    ctx.font = '500 30px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(model.subtitle, 118, 410);

    fillRoundRect(ctx, 118, 452, 250, 68, 34, 'rgba(158, 77, 48, 0.08)');
    ctx.fillStyle = '#8c4f35';
    ctx.font = '700 30px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(model.levelLabel, 162, 495);

    fillRoundRect(ctx, 712, 120, 198, 176, 28, '#2a2221');
    ctx.fillStyle = '#fff6ea';
    ctx.font = '800 72px "Avenir Next", "PingFang SC", sans-serif';
    ctx.fillText(model.score, 770, 210);
    ctx.font = '600 26px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillStyle = '#f3d8ab';
    ctx.fillText('区级综合分', 770, 252);

    fillRoundRect(ctx, 690, 336, 240, 300, 34, '#fff7ee');
    ctx.save();
    roundRectPath(ctx, 718, 364, 184, 184, 28);
    ctx.clip();
    ctx.drawImage(stickerImage, 718, 364, 184, 184);
    ctx.restore();
    ctx.fillStyle = '#725d52';
    ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText('今日柳絮形象', 760, 590);

    fillRoundRect(ctx, 118, 574, 812, 220, 30, '#fffdf9');
    ctx.fillStyle = '#2e231d';
    ctx.font = '700 34px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText('出行提醒', 154, 636);
    ctx.fillStyle = '#6b5f57';
    ctx.font = '500 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
    drawWrappedText(ctx, model.advice, 154, 690, 740, 42, 3);

    model.metrics.forEach((metric, index) => {
      const x = 118 + (index % 2) * 406;
      const y = 836 + Math.floor(index / 2) * 118;
      fillRoundRect(ctx, x, y, 372, 92, 24, 'rgba(255, 255, 255, 0.84)');
      ctx.fillStyle = '#8a7567';
      ctx.font = '500 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
      ctx.fillText(metric.label, x + 24, y + 36);
      ctx.fillStyle = '#2e231d';
      ctx.font = '700 28px "PingFang SC", "Hiragino Sans GB", sans-serif';
      ctx.fillText(metric.value, x + 24, y + 68);
    });

    model.drivers.forEach((driver, index) => {
      const y = 1096 + index * 84;
      fillRoundRect(ctx, 118, y, 812, 60, 20, `rgba(${model.levelKey === 'high' ? '226,99,77' : model.levelKey === 'medium' ? '220,155,26' : '53,165,102'}, ${index === 0 ? 0.12 : 0.08})`);
      ctx.fillStyle = '#5d5148';
      ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
      ctx.fillText(driver.label, 146, y + 39);
      ctx.fillStyle = '#2e231d';
      ctx.font = '700 24px "Avenir Next", "PingFang SC", sans-serif';
      ctx.fillText(driver.value, 820, y + 39);
    });

    ctx.fillStyle = '#7f7168';
    ctx.font = '500 24px "PingFang SC", "Hiragino Sans GB", sans-serif';
    ctx.fillText(`数据更新时间 ${model.generatedAt}`, 118, 1310);
    ctx.fillText(model.cityName, 118, 1348);

    return canvas;
  }

  async function downloadCanvas(canvas, filename) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

    if (!blob) {
      throw new Error('Share image export failed');
    }

    const file = new File([blob], filename, { type: 'image/png' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function shareForecastCard(shareKey) {
    if (!currentPageState || !currentPageState.selected) {
      return;
    }

    const card = shareKey === 'tomorrow' ? currentPageState.selected.tomorrowCard : currentPageState.selected.todayCard;
    const model = buildShareImageModel({
      cityName: currentOverviewModel && currentOverviewModel.city ? currentOverviewModel.city.name : '北京市',
      districtName: currentPageState.selected.detailTitle.replace(/实时详情$/, ''),
      generatedAt: currentOverviewModel ? currentOverviewModel.generatedAt : '--',
      factors: currentPageState.selected.factors,
      card,
    });

    const canvas = await renderShareImage(model);
    await downloadCanvas(canvas, model.shareFilename);
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
          <div class="forecast-actions">
            <div class="forecast-badge ${card.level.key}">${card.level.label}</div>
            <button class="share-button" type="button" data-share-key="${card.shareKey}">分享图片</button>
          </div>
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
  let currentMatrixDay = 'today';
  let currentOverviewModel = null;
  let currentPageState = null;

  function buildFutureRanking(model, dayKey) {
    const districts = Array.isArray(model.districts) ? model.districts : [];
    return districts
      .map(function (d) {
        var data = d[dayKey] || {};
        return {
          id: d.id,
          name: d.name,
          shortName: d.shortName,
          districtTag: d.districtTag,
          districtHint: d.districtHint,
          score: data.score || 0,
          level: data.level || { key: 'low', label: '低风险' },
          ecologyMultiplier: data.ecologyMultiplier || 1,
          rollingGdd: data.rollingGdd || 0,
          sunshineBoost: data.sunshineBoost || 1,
          cloudPenalty: data.cloudPenalty || 1,
          sunnyStreakBoost: data.sunnyStreakBoost || 1,
        };
      })
      .sort(function (a, b) { return b.score - a.score; });
  }

  function renderPage(model) {
    currentOverviewModel = model;
    var effectiveModel = currentMatrixDay !== 'today'
      ? Object.assign({}, model, { ranking: buildFutureRanking(model, currentMatrixDay) })
      : model;
    var state = buildPageState(effectiveModel, currentStickerVariant);
    currentPageState = state;

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

  function bindDetailCards() {
    const cards = document.getElementById('detailCards');

    cards.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-share-key]');

      if (!button) {
        return;
      }

      const statusPanel = document.getElementById('statusPanel');
      const originalText = statusPanel.textContent;
      statusPanel.textContent = '正在生成分享图片...';

      try {
        await shareForecastCard(button.getAttribute('data-share-key'));
        statusPanel.textContent = '分享图片已生成。';
        setTimeout(() => {
          statusPanel.textContent = originalText;
        }, 1800);
      } catch (error) {
        statusPanel.textContent = `分享图片生成失败：${error.message}`;
      }
    });
  }

  function bindDayToggle() {
    var toggle = document.getElementById('dayToggle');
    if (!toggle) return;

    toggle.addEventListener('click', function (event) {
      var button = event.target.closest('.day-toggle-btn');
      if (!button) return;

      currentMatrixDay = button.getAttribute('data-day');
      toggle.querySelectorAll('.day-toggle-btn').forEach(function (btn) {
        btn.classList.toggle('is-active', btn === button);
      });

      if (currentOverviewModel) {
        renderPage(currentOverviewModel);
      }
    });
  }

  function init() {
    if (typeof document === 'undefined') {
      return;
    }

    bindDistrictMatrix();
    bindDetailCards();
    bindDayToggle();
    loadDistrict();
  }

  const api = {
    buildShareImageModel,
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

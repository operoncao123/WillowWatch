const { listDistricts } = require('../data/districts.js');
const { getDistrictEcology } = require('./ecology-service.js');
const { buildDistrictSnapshot, rankDistrictSnapshots } = require('./risk-engine.js');
const { createWeatherService } = require('./weather-service.js');

function formatTimestamp(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce((result, part) => {
    if (part.type !== 'literal') {
      result[part.type] = part.value;
    }
    return result;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function buildPoster(topDistrict, ranking) {
  const highRiskCount = ranking.filter((district) => district.level.key === 'high').length;
  const topDistrictName = topDistrict.name || topDistrict.districtName || '--';

  return {
    headline: '今天北京哪里柳絮最猛？',
    dek:
      highRiskCount > 0
        ? `全市已有 ${highRiskCount} 个区进入高风险，${topDistrictName} 最值得警惕。`
        : `全市暂无大面积高风险，${topDistrictName} 仍是当前最需要留意的区域。`,
    topDistrict: {
      id: topDistrict.districtId,
      name: topDistrict.districtName,
      score: topDistrict.finalScore,
      level: topDistrict.level,
    },
    updatedAt: formatTimestamp(new Date()),
  };
}

function serializeRankingItem(district) {
  return {
    id: district.districtId,
    name: district.districtName,
    shortName: district.shortName,
    districtTag: district.districtTag,
    districtHint: district.districtHint,
    score: district.finalScore,
    level: district.level,
    ecologyMultiplier: district.ecologyMultiplier,
    rollingGdd: district.rollingGdd,
    sunshineBoost: district.sunshineBoost,
    cloudPenalty: district.cloudPenalty,
    sunnyStreakBoost: district.sunnyStreakBoost,
  };
}

function serializeDistrictDetail(district) {
  return {
    id: district.districtId,
    name: district.districtName,
    shortName: district.shortName,
    districtTag: district.districtTag,
    districtHint: district.districtHint,
    score: district.finalScore,
    level: district.level,
    weather: district.weather,
    weatherScore: district.weatherScore,
    rollingGdd: district.rollingGdd,
    gddBoost: district.gddBoost,
    precipitationPenalty: district.precipitationPenalty,
    drynessWindBoost: district.drynessWindBoost,
    sunshineBoost: district.sunshineBoost,
    cloudPenalty: district.cloudPenalty,
    sunnyStreakBoost: district.sunnyStreakBoost,
    ecologyMultiplier: district.ecologyMultiplier,
    hotspots: district.hotspots,
    advice: district.advice,
    headline: district.headline,
    tomorrow: {
      score: district.tomorrow.finalScore,
      level: district.tomorrow.level,
      weather: district.tomorrow.weather,
      weatherScore: district.tomorrow.weatherScore,
      rollingGdd: district.tomorrow.rollingGdd,
      gddBoost: district.tomorrow.gddBoost,
      precipitationPenalty: district.tomorrow.precipitationPenalty,
      drynessWindBoost: district.tomorrow.drynessWindBoost,
      sunshineBoost: district.tomorrow.sunshineBoost,
      cloudPenalty: district.tomorrow.cloudPenalty,
      sunnyStreakBoost: district.tomorrow.sunnyStreakBoost,
      ecologyMultiplier: district.tomorrow.ecologyMultiplier,
      advice: district.tomorrow.advice,
    },
    dayAfterTomorrow: district.dayAfterTomorrow ? {
      score: district.dayAfterTomorrow.finalScore,
      level: district.dayAfterTomorrow.level,
      weather: district.dayAfterTomorrow.weather,
      weatherScore: district.dayAfterTomorrow.weatherScore,
      rollingGdd: district.dayAfterTomorrow.rollingGdd,
      gddBoost: district.dayAfterTomorrow.gddBoost,
      precipitationPenalty: district.dayAfterTomorrow.precipitationPenalty,
      drynessWindBoost: district.dayAfterTomorrow.drynessWindBoost,
      sunshineBoost: district.dayAfterTomorrow.sunshineBoost,
      cloudPenalty: district.dayAfterTomorrow.cloudPenalty,
      sunnyStreakBoost: district.dayAfterTomorrow.sunnyStreakBoost,
      ecologyMultiplier: district.dayAfterTomorrow.ecologyMultiplier,
      advice: district.dayAfterTomorrow.advice,
    } : undefined,
  };
}

function buildOverviewPayload(ranking, options = {}) {
  const selectedDistrict =
    ranking.find((district) => district.districtId === options.districtId) || ranking[0];
  const topDistrict = ranking[0];
  const generatedAt = options.generatedAt || formatTimestamp(new Date());

  return {
    generatedAt,
    city: {
      id: 'beijing',
      name: '北京市',
    },
    poster: buildPoster(topDistrict, ranking),
    topDistrict: {
      id: topDistrict.districtId,
      name: topDistrict.districtName,
      score: topDistrict.finalScore,
      level: topDistrict.level,
    },
    ranking: ranking.map(serializeRankingItem),
    selectedDistrict: serializeDistrictDetail(selectedDistrict),
  };
}

function buildStaticSitePayload(ranking, options = {}) {
  const topDistrict = ranking[0];
  const generatedAt = options.generatedAt || formatTimestamp(new Date());

  return {
    generatedAt,
    city: {
      id: 'beijing',
      name: '北京市',
    },
    poster: buildPoster(topDistrict, ranking),
    topDistrict: {
      id: topDistrict.districtId,
      name: topDistrict.districtName,
      score: topDistrict.finalScore,
      level: topDistrict.level,
    },
    defaultDistrictId: topDistrict.districtId,
    ranking: ranking.map(serializeRankingItem),
    districts: ranking.map(serializeDistrictDetail),
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

async function createOverviewModel(options = {}) {
  const districts = listDistricts();
  const weatherService = options.weatherService || createWeatherService();

  const weatherMap = weatherService.getManyDistrictWeather
    ? await weatherService.getManyDistrictWeather(districts)
    : new Map(
        (
          await mapWithConcurrency(districts, 4, async (district) => ({
            id: district.id,
            weather: await weatherService.getDistrictWeather(district),
          }))
        ).map((entry) => [entry.id, entry.weather])
      );

  const baseInputs = await mapWithConcurrency(
    districts,
    4,
    async (district) => {
      const weather = weatherMap.get(district.id);
      const ecology = getDistrictEcology(district);

      return {
        district: {
          ...district,
          ecologyWeight: ecology.weight,
          hotspots: ecology.hotspots,
        },
        weather,
      };
    }
  );

  const snapshots = baseInputs.map((input) => {
    const tomorrowWeather = input.weather.tomorrow || {
      date: input.weather.date,
      temperatureMax: input.weather.temperatureMax,
      temperatureMin: input.weather.temperatureMin,
      temperatureMean: input.weather.temperatureMean,
      humidity: input.weather.humidity,
      windSpeed: input.weather.windSpeed,
      precipitation: input.weather.precipitation,
    };
    const dayAfterTomorrowWeather = input.weather.dayAfterTomorrow || null;
    const today = buildDistrictSnapshot({
      district: input.district,
      weather: input.weather,
    });
    const tomorrow = buildDistrictSnapshot({
      district: input.district,
      weather: tomorrowWeather,
    });
    const result = {
      ...today,
      tomorrow,
    };

    if (dayAfterTomorrowWeather) {
      result.dayAfterTomorrow = buildDistrictSnapshot({
        district: input.district,
        weather: dayAfterTomorrowWeather,
      });
    }

    return result;
  });

  const ranking = rankDistrictSnapshots(snapshots);
  return buildOverviewPayload(ranking, options);
}

async function createStaticSiteData(options = {}) {
  const overview = await createOverviewModel(options);

  if (Array.isArray(overview.districts)) {
    return overview;
  }

  const districts = listDistricts();
  const weatherService = options.weatherService || createWeatherService();
  const weatherMap = weatherService.getManyDistrictWeather
    ? await weatherService.getManyDistrictWeather(districts)
    : new Map(
        (
          await mapWithConcurrency(districts, 4, async (district) => ({
            id: district.id,
            weather: await weatherService.getDistrictWeather(district),
          }))
        ).map((entry) => [entry.id, entry.weather])
      );

  const baseInputs = await mapWithConcurrency(
    districts,
    4,
    async (district) => {
      const weather = weatherMap.get(district.id);
      const ecology = getDistrictEcology(district);

      return {
        district: {
          ...district,
          ecologyWeight: ecology.weight,
          hotspots: ecology.hotspots,
        },
        weather,
      };
    }
  );

  const snapshots = baseInputs.map((input) => {
    const tomorrowWeather = input.weather.tomorrow || {
      date: input.weather.date,
      temperatureMax: input.weather.temperatureMax,
      temperatureMin: input.weather.temperatureMin,
      temperatureMean: input.weather.temperatureMean,
      humidity: input.weather.humidity,
      windSpeed: input.weather.windSpeed,
      precipitation: input.weather.precipitation,
    };
    const dayAfterTomorrowWeather = input.weather.dayAfterTomorrow || null;
    const today = buildDistrictSnapshot({
      district: input.district,
      weather: input.weather,
    });
    const tomorrow = buildDistrictSnapshot({
      district: input.district,
      weather: tomorrowWeather,
    });
    const result = {
      ...today,
      tomorrow,
    };

    if (dayAfterTomorrowWeather) {
      result.dayAfterTomorrow = buildDistrictSnapshot({
        district: input.district,
        weather: dayAfterTomorrowWeather,
      });
    }

    return result;
  });

  const ranking = rankDistrictSnapshots(snapshots);
  return buildStaticSitePayload(ranking, options);
}

module.exports = {
  createOverviewModel,
  createStaticSiteData,
  formatTimestamp,
};

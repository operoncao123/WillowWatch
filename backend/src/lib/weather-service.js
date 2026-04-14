const CACHE_TTL_MS = 10 * 60 * 1000;
const WEATHER_TIMEOUT_MS = 12000;

function buildWeatherUrl(district) {
  return buildBatchWeatherUrl([district]);
}

function buildBatchWeatherUrl(districts) {
  const params = new URLSearchParams({
    latitude: districts.map((district) => district.latitude).join(','),
    longitude: districts.map((district) => district.longitude).join(','),
    hourly: 'cloud_cover',
    daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,wind_gusts_10m_max,relative_humidity_2m_min,sunshine_duration,shortwave_radiation_sum',
    past_days: '3',
    forecast_days: '3',
    wind_speed_unit: 'ms',
    timezone: districts.map(() => 'Asia/Shanghai').join(','),
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function mapForecast(payload) {
  const daily = payload.daily || {};
  const hourly = payload.hourly || {};
  const dayCount = Array.isArray(daily.time) ? daily.time.length : 0;
  const todayIndex = Math.max(0, dayCount - 3);
  const tomorrowIndex = Math.max(0, dayCount - 2);
  const dayAfterTomorrowIndex = Math.max(0, dayCount - 1);
  const rollingTemperatureMeans = Array.isArray(daily.temperature_2m_mean)
    ? daily.temperature_2m_mean.slice(Math.max(0, todayIndex - 3), todayIndex + 1)
    : [];
  const recentPrecipitation = Array.isArray(daily.precipitation_sum)
    ? daily.precipitation_sum.slice(Math.max(0, todayIndex - 2), todayIndex).reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  const recentConditions = Array.isArray(daily.time)
    ? daily.time.slice(Math.max(0, todayIndex - 3), todayIndex + 1).map((date, index) => {
        const absoluteIndex = Math.max(0, todayIndex - 3) + index;
        return {
          date,
          sunshineDuration: daily.sunshine_duration && daily.sunshine_duration[absoluteIndex],
          cloudCoverMean: computeCloudCoverMean(hourly, date),
        };
      })
    : [];

  return {
    date: daily.time && daily.time[todayIndex],
    temperatureMax: daily.temperature_2m_max && daily.temperature_2m_max[todayIndex],
    temperatureMin: daily.temperature_2m_min && daily.temperature_2m_min[todayIndex],
    temperatureMean: daily.temperature_2m_mean && daily.temperature_2m_mean[todayIndex],
    humidity: (daily.relative_humidity_2m_mean && daily.relative_humidity_2m_mean[todayIndex]) ?? 0,
    humidityMin: (daily.relative_humidity_2m_min && daily.relative_humidity_2m_min[todayIndex]) ?? 0,
    windSpeed: (daily.wind_speed_10m_max && daily.wind_speed_10m_max[todayIndex]) ?? 0,
    windGust: (daily.wind_gusts_10m_max && daily.wind_gusts_10m_max[todayIndex]) ?? 0,
    precipitation: daily.precipitation_sum && daily.precipitation_sum[todayIndex],
    sunshineDuration: (daily.sunshine_duration && daily.sunshine_duration[todayIndex]) ?? 0,
    shortwaveRadiationSum: (daily.shortwave_radiation_sum && daily.shortwave_radiation_sum[todayIndex]) ?? 0,
    cloudCoverMean: computeCloudCoverMean(hourly, daily.time && daily.time[todayIndex]),
    recentPrecipitation,
    rollingTemperatureMeans,
    recentConditions,
    tomorrow: {
      date: daily.time && daily.time[tomorrowIndex],
      temperatureMax: daily.temperature_2m_max && daily.temperature_2m_max[tomorrowIndex],
      temperatureMin: daily.temperature_2m_min && daily.temperature_2m_min[tomorrowIndex],
      temperatureMean: daily.temperature_2m_mean && daily.temperature_2m_mean[tomorrowIndex],
      humidity: daily.relative_humidity_2m_mean && daily.relative_humidity_2m_mean[tomorrowIndex],
      humidityMin: daily.relative_humidity_2m_min && daily.relative_humidity_2m_min[tomorrowIndex],
      windSpeed: daily.wind_speed_10m_max && daily.wind_speed_10m_max[tomorrowIndex],
      windGust: daily.wind_gusts_10m_max && daily.wind_gusts_10m_max[tomorrowIndex],
      precipitation: daily.precipitation_sum && daily.precipitation_sum[tomorrowIndex],
      sunshineDuration: daily.sunshine_duration && daily.sunshine_duration[tomorrowIndex],
      shortwaveRadiationSum: daily.shortwave_radiation_sum && daily.shortwave_radiation_sum[tomorrowIndex],
      cloudCoverMean: computeCloudCoverMean(hourly, daily.time && daily.time[tomorrowIndex]),
      recentPrecipitation: Array.isArray(daily.precipitation_sum)
        ? daily.precipitation_sum.slice(Math.max(0, tomorrowIndex - 2), tomorrowIndex).reduce((sum, value) => sum + Number(value || 0), 0)
        : 0,
      rollingTemperatureMeans: Array.isArray(daily.temperature_2m_mean)
        ? daily.temperature_2m_mean.slice(Math.max(0, tomorrowIndex - 3), tomorrowIndex + 1)
        : [],
      recentConditions: Array.isArray(daily.time)
        ? daily.time.slice(Math.max(0, tomorrowIndex - 3), tomorrowIndex + 1).map((date, index) => {
            const absoluteIndex = Math.max(0, tomorrowIndex - 3) + index;
            return {
              date,
              sunshineDuration: daily.sunshine_duration && daily.sunshine_duration[absoluteIndex],
              cloudCoverMean: computeCloudCoverMean(hourly, date),
            };
          })
        : [],
    },
    dayAfterTomorrow: {
      date: daily.time && daily.time[dayAfterTomorrowIndex],
      temperatureMax: daily.temperature_2m_max && daily.temperature_2m_max[dayAfterTomorrowIndex],
      temperatureMin: daily.temperature_2m_min && daily.temperature_2m_min[dayAfterTomorrowIndex],
      temperatureMean: daily.temperature_2m_mean && daily.temperature_2m_mean[dayAfterTomorrowIndex],
      humidity: daily.relative_humidity_2m_mean && daily.relative_humidity_2m_mean[dayAfterTomorrowIndex],
      humidityMin: daily.relative_humidity_2m_min && daily.relative_humidity_2m_min[dayAfterTomorrowIndex],
      windSpeed: daily.wind_speed_10m_max && daily.wind_speed_10m_max[dayAfterTomorrowIndex],
      windGust: daily.wind_gusts_10m_max && daily.wind_gusts_10m_max[dayAfterTomorrowIndex],
      precipitation: daily.precipitation_sum && daily.precipitation_sum[dayAfterTomorrowIndex],
      sunshineDuration: daily.sunshine_duration && daily.sunshine_duration[dayAfterTomorrowIndex],
      shortwaveRadiationSum: daily.shortwave_radiation_sum && daily.shortwave_radiation_sum[dayAfterTomorrowIndex],
      cloudCoverMean: computeCloudCoverMean(hourly, daily.time && daily.time[dayAfterTomorrowIndex]),
      recentPrecipitation: Array.isArray(daily.precipitation_sum)
        ? daily.precipitation_sum.slice(Math.max(0, dayAfterTomorrowIndex - 2), dayAfterTomorrowIndex).reduce((sum, value) => sum + Number(value || 0), 0)
        : 0,
      rollingTemperatureMeans: Array.isArray(daily.temperature_2m_mean)
        ? daily.temperature_2m_mean.slice(Math.max(0, dayAfterTomorrowIndex - 3), dayAfterTomorrowIndex + 1)
        : [],
      recentConditions: Array.isArray(daily.time)
        ? daily.time.slice(Math.max(0, dayAfterTomorrowIndex - 3), dayAfterTomorrowIndex + 1).map((date, index) => {
            const absoluteIndex = Math.max(0, dayAfterTomorrowIndex - 3) + index;
            return {
              date,
              sunshineDuration: daily.sunshine_duration && daily.sunshine_duration[absoluteIndex],
              cloudCoverMean: computeCloudCoverMean(hourly, date),
            };
          })
        : [],
    },
  };
}

function computeCloudCoverMean(hourly, isoDate) {
  if (!isoDate || !Array.isArray(hourly.time) || !Array.isArray(hourly.cloud_cover)) {
    return 0;
  }

  const values = [];
  for (let index = 0; index < hourly.time.length; index += 1) {
    if (String(hourly.time[index]).startsWith(isoDate) && Number.isFinite(Number(hourly.cloud_cover[index]))) {
      values.push(Number(hourly.cloud_cover[index]));
    }
  }

  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createWeatherService(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const cache = new Map();

  async function requestForecasts(districts, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

    try {
      const response = await fetchImpl(buildBatchWeatherUrl(districts), {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Weather request failed: ${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : [payload];

      return items.map(mapForecast);
    } catch (error) {
      if (districts.length > 4) {
        const middle = Math.ceil(districts.length / 2);
        const left = await requestForecasts(districts.slice(0, middle), attempt);
        const right = await requestForecasts(districts.slice(middle), attempt);
        return [...left, ...right];
      }

      if (attempt < 2) {
        await sleep(300);
        return requestForecasts(districts, attempt + 1);
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function getManyDistrictWeather(districts) {
    const now = Date.now();
    const result = new Map();
    const missing = [];

    for (const district of districts) {
      const cached = cache.get(district.id);

      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        result.set(district.id, cached.value);
      } else {
        missing.push(district);
      }
    }

    if (missing.length) {
      const forecasts = await requestForecasts(missing);

      missing.forEach((district, index) => {
        const value = forecasts[index];
        cache.set(district.id, {
          timestamp: now,
          value,
        });
        result.set(district.id, value);
      });
    }

    return result;
  }

  async function getDistrictWeather(district) {
    const result = await getManyDistrictWeather([district]);
    return result.get(district.id);
  }

  return {
    getDistrictWeather,
    getManyDistrictWeather,
  };
}

module.exports = {
  buildWeatherUrl,
  buildBatchWeatherUrl,
  mapForecast,
  createWeatherService,
};

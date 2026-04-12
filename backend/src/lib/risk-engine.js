function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function firstFinite() {
  for (const value of arguments) {
    if (Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function computeGdd(temperatureMean) {
  return round(Math.max(0, firstFinite(temperatureMean) - 15), 1);
}

function computeRollingGdd(temperatureMeans) {
  const values = Array.isArray(temperatureMeans) ? temperatureMeans : [];
  return round(
    values.reduce((sum, value) => sum + Math.max(0, firstFinite(value) - 15), 0),
    1
  );
}

function computePrecipitationPenalty(weather) {
  const todayRain = firstFinite(weather.precipitation);
  const recentRain = firstFinite(weather.recentPrecipitation);
  const totalRain = todayRain + recentRain;

  if (totalRain >= 8) {
    return 0.62;
  }

  if (totalRain >= 4) {
    return 0.78;
  }

  if (totalRain >= 1.5) {
    return 0.9;
  }

  return 1;
}

function computeDrynessWindBoost(weather) {
  const humidityMin = firstFinite(weather.humidityMin, weather.humidity);
  const windGust = firstFinite(weather.windGust, weather.windSpeed);
  let boost = 1;

  if (humidityMin <= 35) {
    boost += 0.08;
  } else if (humidityMin <= 45) {
    boost += 0.04;
  }

  if (windGust >= 8) {
    boost += 0.08;
  } else if (windGust >= 6) {
    boost += 0.04;
  }

  return round(clamp(boost, 0.9, 1.16), 2);
}

function computeSunshineBoost(weather) {
  const sunshineDuration = firstFinite(weather.sunshineDuration);
  const shortwaveRadiationSum = firstFinite(weather.shortwaveRadiationSum);
  let boost = 1;

  if (sunshineDuration >= 28000) {
    boost += 0.08;
  } else if (sunshineDuration >= 18000) {
    boost += 0.04;
  }

  if (shortwaveRadiationSum >= 20) {
    boost += 0.08;
  } else if (shortwaveRadiationSum >= 14) {
    boost += 0.04;
  }

  return round(clamp(boost, 0.95, 1.16), 2);
}

function computeCloudPenalty(weather) {
  const cloudCoverMean = firstFinite(weather.cloudCoverMean);

  if (cloudCoverMean >= 75) {
    return 0.86;
  }

  if (cloudCoverMean >= 55) {
    return 0.93;
  }

  return 1;
}

function computeSunnyStreakBoost(recentConditions) {
  const days = Array.isArray(recentConditions) ? recentConditions : [];
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    const item = days[index] || {};
    const sunshineDuration = firstFinite(item.sunshineDuration);
    const cloudCoverMean = firstFinite(item.cloudCoverMean);

    if (sunshineDuration >= 24000 && cloudCoverMean <= 45) {
      streak += 1;
    } else {
      break;
    }
  }

  if (streak >= 3) {
    return 1.12;
  }

  if (streak === 2) {
    return 1.06;
  }

  return 1;
}

function computeWeatherScore(weather) {
  const gdd = computeGdd(weather.temperatureMean);
  const humidity = firstFinite(weather.humidity);
  const windSpeed = firstFinite(weather.windSpeed);

  let score = gdd * 10;

  if (humidity > 60) {
    score *= 0.7;
  }

  if (windSpeed > 5) {
    score *= 1.2;
  }

  if (windSpeed > 8) {
    score *= 0.8;
  }

  return round(clamp(score, 0, 100), 1);
}

function getRiskLevel(score) {
  if (score <= 30) {
    return { key: 'low', label: '低风险' };
  }

  if (score <= 60) {
    return { key: 'medium', label: '中风险' };
  }

  return { key: 'high', label: '高风险' };
}

function getAdvice(levelKey) {
  if (levelKey === 'high') {
    return '建议减少外出，尤其注意大型公园、滨河绿地和午后风口区域；外出请做好口鼻防护。';
  }

  if (levelKey === 'medium') {
    return '建议避开 10:00-16:00 的长时间户外停留，经过公园或林地边缘时做好基础防护。';
  }

  return '整体风险较低，但靠近公园、绿地和滨河区域时仍可能遇到局部飞絮。';
}

function buildDistrictSnapshot(input) {
  const district = input.district;
  const weather = {
    date: input.weather.date,
    temperatureMax: round(firstFinite(input.weather.temperatureMax), 1),
    temperatureMin: round(firstFinite(input.weather.temperatureMin), 1),
    temperatureMean: round(firstFinite(input.weather.temperatureMean), 1),
    humidity: round(firstFinite(input.weather.humidity), 0),
    humidityMin: round(firstFinite(input.weather.humidityMin, input.weather.humidity), 0),
    windSpeed: round(firstFinite(input.weather.windSpeed), 1),
    windGust: round(firstFinite(input.weather.windGust, input.weather.windSpeed), 1),
    precipitation: round(firstFinite(input.weather.precipitation), 1),
    recentPrecipitation: round(firstFinite(input.weather.recentPrecipitation), 1),
    sunshineDuration: round(firstFinite(input.weather.sunshineDuration), 0),
    shortwaveRadiationSum: round(firstFinite(input.weather.shortwaveRadiationSum), 1),
    cloudCoverMean: round(firstFinite(input.weather.cloudCoverMean), 0),
    rollingTemperatureMeans: Array.isArray(input.weather.rollingTemperatureMeans)
      ? input.weather.rollingTemperatureMeans.map((value) => round(firstFinite(value), 1))
      : [],
    recentConditions: Array.isArray(input.weather.recentConditions)
      ? input.weather.recentConditions.map((item) => ({
          date: item.date,
          sunshineDuration: round(firstFinite(item.sunshineDuration), 0),
          cloudCoverMean: round(firstFinite(item.cloudCoverMean), 0),
        }))
      : [],
  };
  const weatherScore = computeWeatherScore(weather);
  const rollingGdd = computeRollingGdd(weather.rollingTemperatureMeans);
  const gddBoost = round(clamp(1 + rollingGdd * 0.01, 1, 1.18), 2);
  const precipitationPenalty = computePrecipitationPenalty(weather);
  const drynessWindBoost = computeDrynessWindBoost(weather);
  const sunshineBoost = computeSunshineBoost(weather);
  const cloudPenalty = computeCloudPenalty(weather);
  const sunnyStreakBoost = computeSunnyStreakBoost(weather.recentConditions);
  const ecologyMultiplier = round(clamp(firstFinite(district.ecologyWeight, 1), 0.9, 1.35), 2);
  const finalScore = round(
    clamp(weatherScore * ecologyMultiplier * gddBoost * precipitationPenalty * drynessWindBoost * sunshineBoost * cloudPenalty * sunnyStreakBoost, 0, 100),
    1
  );
  const level = getRiskLevel(finalScore);

  return {
    districtId: district.id,
    districtName: district.name,
    shortName: district.shortName,
    districtTag: district.districtTag,
    districtHint: district.districtHint,
    coordinates: {
      latitude: district.latitude,
      longitude: district.longitude,
    },
    weather,
    weatherScore,
    rollingGdd,
    gddBoost,
    precipitationPenalty,
    drynessWindBoost,
    sunshineBoost,
    cloudPenalty,
    sunnyStreakBoost,
    ecologyMultiplier,
    finalScore,
    level,
    hotspots: [...district.hotspots],
    advice: getAdvice(level.key),
    headline: `${district.name}当前以气象条件和区级生态暴露驱动为主。`,
  };
}

function rankDistrictSnapshots(snapshots) {
  return [...snapshots].sort((left, right) => right.finalScore - left.finalScore);
}

module.exports = {
  clamp,
  computeGdd,
  computeRollingGdd,
  computePrecipitationPenalty,
  computeDrynessWindBoost,
  computeSunshineBoost,
  computeCloudPenalty,
  computeSunnyStreakBoost,
  computeWeatherScore,
  getRiskLevel,
  getAdvice,
  buildDistrictSnapshot,
  rankDistrictSnapshots,
};

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getDistrictById,
  listDistricts,
} = require('../src/data/districts.js');
const {
  clamp,
  computeWeatherScore,
  computeRollingGdd,
  computePrecipitationPenalty,
  computeDrynessWindBoost,
  computeSunshineBoost,
  computeCloudPenalty,
  computeSunnyStreakBoost,
  buildDistrictSnapshot,
  rankDistrictSnapshots,
} = require('../src/lib/risk-engine.js');

test('district registry exposes all 16 Beijing districts', () => {
  const districts = listDistricts();

  assert.equal(districts.length, 16);
  assert.equal(getDistrictById('chaoyang').name, '朝阳区');
  assert.equal(getDistrictById('yanqing').name, '延庆区');
});

test('clamp still enforces 0-100 bounds', () => {
  assert.equal(clamp(120, 0, 100), 100);
});

test('computeRollingGdd accumulates only temperatures above threshold', () => {
  assert.equal(computeRollingGdd([13, 16, 18, 21]), 10);
});

test('computePrecipitationPenalty suppresses risk after meaningful recent rain', () => {
  assert.equal(computePrecipitationPenalty({ precipitation: 3.2, recentPrecipitation: 9 }), 0.62);
  assert.equal(computePrecipitationPenalty({ precipitation: 0, recentPrecipitation: 0 }), 1);
});

test('computeDrynessWindBoost rewards dry windy afternoons but caps the effect', () => {
  assert.equal(
    computeDrynessWindBoost({ humidity: 45, humidityMin: 24, windSpeed: 4.5, windGust: 8.6 }),
    1.16
  );
});

test('computeSunshineBoost rewards sunny high-radiation days', () => {
  assert.equal(
    computeSunshineBoost({ sunshineDuration: 32400, shortwaveRadiationSum: 22 }),
    1.16
  );
});

test('computeCloudPenalty suppresses heavily overcast days', () => {
  assert.equal(computeCloudPenalty({ cloudCoverMean: 78 }), 0.86);
  assert.equal(computeCloudPenalty({ cloudCoverMean: 18 }), 1);
});

test('computeSunnyStreakBoost rewards consecutive bright days', () => {
  assert.equal(
    computeSunnyStreakBoost([
      { sunshineDuration: 31000, cloudCoverMean: 28 },
      { sunshineDuration: 29500, cloudCoverMean: 32 },
      { sunshineDuration: 28000, cloudCoverMean: 34 },
      { sunshineDuration: 25000, cloudCoverMean: 44 },
    ]),
    1.12
  );
});

test('buildDistrictSnapshot combines weather ecology and additional weather modifiers', () => {
  const district = getDistrictById('chaoyang');

  const snapshot = buildDistrictSnapshot({
    district,
    weather: {
      date: '2026-04-11',
      temperatureMax: 27,
      temperatureMin: 13,
      temperatureMean: 20,
      humidity: 45,
      humidityMin: 24,
      windSpeed: 4.5,
      windGust: 8.6,
      precipitation: 0.2,
      recentPrecipitation: 1.5,
      sunshineDuration: 32400,
      shortwaveRadiationSum: 22,
      cloudCoverMean: 28,
      rollingTemperatureMeans: [16.5, 18.5, 19.5, 20],
      recentConditions: [
        { sunshineDuration: 31000, cloudCoverMean: 28 },
        { sunshineDuration: 29500, cloudCoverMean: 32 },
        { sunshineDuration: 28000, cloudCoverMean: 34 },
        { sunshineDuration: 25000, cloudCoverMean: 44 },
      ],
    },
  });

  assert.equal(computeWeatherScore(snapshot.weather), 50);
  assert.equal(snapshot.rollingGdd, 14.5);
  assert.equal(snapshot.precipitationPenalty, 0.9);
  assert.equal(snapshot.drynessWindBoost, 1.16);
  assert.equal(snapshot.sunshineBoost, 1.16);
  assert.equal(snapshot.cloudPenalty, 1);
  assert.equal(snapshot.sunnyStreakBoost, 1.12);
  assert.equal(snapshot.ecologyMultiplier, 1.28);
  assert.equal(snapshot.finalScore, 99.8);
  assert.equal(snapshot.level.label, '高风险');
});

test('rankDistrictSnapshots sorts from highest to lowest risk', () => {
  const ranked = rankDistrictSnapshots([
    { districtId: 'haidian', finalScore: 64 },
    { districtId: 'chaoyang', finalScore: 84 },
    { districtId: 'dongcheng', finalScore: 38 },
  ]);

  assert.deepEqual(
    ranked.map((item) => item.districtId),
    ['chaoyang', 'haidian', 'dongcheng']
  );
});

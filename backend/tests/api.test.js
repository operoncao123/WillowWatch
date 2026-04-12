const test = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');

const { createOverviewModel, createStaticSiteData } = require('../src/lib/overview-service.js');
const { createServer } = require('../src/server.js');

function createWeatherSnapshot(overrides) {
  return {
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
    ...overrides,
  };
}

function invokeRequest(server, url) {
  const handler = server.listeners('request')[0];

  return new Promise((resolve, reject) => {
    const req = {
      method: 'GET',
      url,
      headers: {},
    };
    const chunks = [];
    const res = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    res.statusCode = 200;
    res.headers = {};
    res.writeHead = function writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = { ...this.headers, ...headers };
      return this;
    };
    res.end = function end(chunk) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      resolve({
        statusCode: this.statusCode,
        headers: this.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });
    };

    Promise.resolve(handler(req, res)).catch(reject);
  });
}

test('createOverviewModel returns ranking poster and selected district', async () => {
  const model = await createOverviewModel({
    districtId: 'haidian',
    weatherService: {
      async getDistrictWeather(district) {
        if (district.id === 'chaoyang') {
          return createWeatherSnapshot({ temperatureMean: 21, windSpeed: 5.8 });
        }
        if (district.id === 'haidian') {
          return createWeatherSnapshot({ temperatureMean: 20.5, windSpeed: 4.8 });
        }
        return createWeatherSnapshot({ temperatureMean: 17, humidity: 60, windSpeed: 2.5 });
      },
    },
  });

  assert.equal(model.selectedDistrict.id, 'haidian');
  assert.equal(model.topDistrict.id, 'chaoyang');
  assert.equal(model.ranking.length, 16);
  assert.equal(model.selectedDistrict.ecologyMultiplier, 1.24);
  assert.equal(model.selectedDistrict.rollingGdd, 14.5);
  assert.equal(model.selectedDistrict.precipitationPenalty, 0.9);
  assert.equal(model.selectedDistrict.drynessWindBoost, 1.16);
  assert.equal(model.selectedDistrict.sunshineBoost, 1.16);
  assert.equal(model.selectedDistrict.cloudPenalty, 1);
  assert.equal(model.selectedDistrict.sunnyStreakBoost, 1.12);
  assert.match(model.poster.headline, /北京/);
  assert.doesNotMatch(model.poster.dek, /undefined/);
});

test('createStaticSiteData returns all district detail payloads for static hosting', async () => {
  const payload = await createStaticSiteData({
    weatherService: {
      async getDistrictWeather(district) {
        if (district.id === 'chaoyang') {
          return createWeatherSnapshot({ temperatureMean: 21, windSpeed: 5.8 });
        }
        return createWeatherSnapshot({ temperatureMean: 17, humidity: 60, windSpeed: 2.5 });
      },
    },
  });

  assert.equal(payload.city.id, 'beijing');
  assert.equal(payload.defaultDistrictId, 'chaoyang');
  assert.equal(payload.districts.length, 16);
  assert.equal(payload.districts[0].id, 'chaoyang');
  assert.ok(payload.districts[0].tomorrow);
});

test('createServer serves overview JSON with CORS headers', async () => {
  const server = createServer({
    async getOverviewModel(districtId) {
      return {
        generatedAt: '2026-04-11 21:00',
        selectedDistrict: { id: districtId || 'chaoyang', name: '朝阳区' },
        topDistrict: { id: 'chaoyang', name: '朝阳区' },
        ranking: [],
        poster: { headline: '今天北京哪里柳絮最猛？' },
      };
    },
  });

  const response = await invokeRequest(server, '/api/overview?district=haidian');
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['access-control-allow-origin'], '*');
  assert.equal(payload.selectedDistrict.id, 'haidian');
  assert.match(payload.poster.headline, /柳絮/);
});

test('createServer serves sticker assets with svg mime type', async () => {
  const server = createServer({
    async getOverviewModel() {
      return {};
    },
  });

  const response = await invokeRequest(server, '/assets/stickers/liuxu-low.svg');

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'image/svg+xml');
  assert.match(response.body, /<svg/);
});

test('createServer serves runtime app config javascript', async () => {
  const server = createServer({
    async getOverviewModel() {
      return {};
    },
  });

  const response = await invokeRequest(server, '/app-config.js');

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'application/javascript; charset=utf-8');
  assert.match(response.body, /LIUXU_APP_CONFIG/);
});

test('createServer serves optimized webp sticker assets', async () => {
  const server = createServer({
    async getOverviewModel() {
      return {};
    },
  });

  const response = await invokeRequest(server, '/assets/stickers/risk-low.webp');

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'image/webp');
  assert.ok(response.body.length > 100);
});

test('createServer returns structured error json when overview generation fails', async () => {
  const server = createServer({
    async getOverviewModel() {
      throw new Error('boom');
    },
  });

  const response = await invokeRequest(server, '/api/overview?district=haidian');
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 500);
  assert.equal(payload.error, true);
  assert.equal(payload.diagnostics.districtId, 'haidian');
  assert.equal(payload.message, 'boom');
});

// 集中配置管理

const CONFIG = {
  // 缓存 TTL（毫秒）
  CACHE_TTL_WEATHER: parseInt(process.env.CACHE_TTL_WEATHER || '600000'),   // 10 分钟
  CACHE_TTL_SOCIAL: parseInt(process.env.CACHE_TTL_SOCIAL || '900000'),     // 15 分钟
  CACHE_TTL_ECOLOGY: parseInt(process.env.CACHE_TTL_ECOLOGY || '3600000'),  // 1 小时

  // 请求超时（毫秒）
  SOCIAL_TIMEOUT_MS: parseInt(process.env.SOCIAL_TIMEOUT_MS || '8000'),     // 8 秒
  WEATHER_TIMEOUT_MS: parseInt(process.env.WEATHER_TIMEOUT_MS || '12000'),  // 12 秒

  // 风险等级阈值
  RISK_LOW_MAX: parseInt(process.env.RISK_LOW_MAX || '30'),
  RISK_MEDIUM_MAX: parseInt(process.env.RISK_MEDIUM_MAX || '60'),
  RISK_HIGH_MIN: parseInt(process.env.RISK_HIGH_MIN || '60'),

  // 社交信号权重系数
  SOCIAL_POST_COUNT_WEIGHT: parseFloat(process.env.SOCIAL_POST_COUNT_WEIGHT || '2'),
  SOCIAL_PROVIDER_COUNT_WEIGHT: parseFloat(process.env.SOCIAL_PROVIDER_COUNT_WEIGHT || '1.5'),
  SOCIAL_SEVERITY_WEIGHT: parseFloat(process.env.SOCIAL_SEVERITY_WEIGHT || '5'),
  SOCIAL_FRESHNESS_WEIGHT: parseFloat(process.env.SOCIAL_FRESHNESS_WEIGHT || '2.5'),
  SOCIAL_BOOST_MAX: parseFloat(process.env.SOCIAL_BOOST_MAX || '20'),

  // HTTP User-Agent
  USER_AGENT: process.env.USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // 日志级别
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // 并发限制
  MAX_CONCURRENT_REQUESTS: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '4'),

  // API 服务器
  API_PORT: parseInt(process.env.PORT || '8787'),
};

module.exports = CONFIG;

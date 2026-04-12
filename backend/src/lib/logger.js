// 简单的日志工具
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  constructor(name, minLevel = 'info') {
    this.name = name;
    this.minLevel = LOG_LEVELS[minLevel] || LOG_LEVELS.info;
  }

  log(level, message, data) {
    if (LOG_LEVELS[level] < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name}] [${level.toUpperCase()}]`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    if (level === 'error') {
      console.error(`${prefix} ${message}${dataStr}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}${dataStr}`);
    } else {
      console.log(`${prefix} ${message}${dataStr}`);
    }
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }
}

function createLogger(name, minLevel) {
  return new Logger(name, minLevel);
}

module.exports = {
  createLogger,
  Logger,
};

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createOverviewModel } = require('./lib/overview-service.js');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, accept',
    'access-control-allow-methods': 'GET, OPTIONS, POST',
    'cache-control': 'no-cache',
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, error, diagnostics = {}) {
  const errorResponse = {
    error: true,
    statusCode,
    message: typeof error === 'string' ? error : (error.message || 'Unknown error'),
    diagnostics: {
      timestamp: new Date().toISOString(),
      ...diagnostics,
    },
  };
  console.error(`[${errorResponse.diagnostics.timestamp}] API Error (${statusCode}):`, error, diagnostics);
  sendJson(res, statusCode, errorResponse);
}

function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PROJECT_ROOT, path.normalize(requestPath).replace(/^(\.\.[/\\])+/, ''));

  if (!filePath.startsWith(PROJECT_ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME_TYPES[ext] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(res);
}

function createServer(options = {}) {
  const getOverviewModel = options.getOverviewModel || ((districtId) => createOverviewModel({ districtId }));

  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type',
      });
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/api/overview')) {
      const requestUrl = new URL(req.url, 'http://127.0.0.1');
      const districtId = requestUrl.searchParams.get('district') || undefined;

      try {
        const payload = await getOverviewModel(districtId);
        sendJson(res, 200, payload);
      } catch (error) {
        const diagnostics = {
          component: 'overview-model',
          districtId,
          errorType: error.constructor.name,
        };

        if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
          diagnostics.reason = 'network_timeout';
          return sendError(res, 504, 'Service timeout - Weather data delayed', diagnostics);
        }

        if (error.message.includes('ENOTFOUND') || error.code === 'ENOTFOUND') {
          diagnostics.reason = 'dns_failure';
          return sendError(res, 503, 'Service unavailable - DNS resolution failed', diagnostics);
        }

        diagnostics.reason = 'unknown_error';
        sendError(res, 500, error.message || 'Overview generation failed', diagnostics);
      }
      return;
    }

    if (req.method === 'GET' && req.url === '/api/health') {
      sendJson(res, 200, {
        ok: true,
      });
      return;
    }

    serveStatic(req, res);
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8787);
  createServer().listen(port, '0.0.0.0', () => {
    console.log(`liuxu backend listening on http://127.0.0.1:${port}`);
  });
}

module.exports = {
  createServer,
};

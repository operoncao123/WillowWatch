function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function decodeBingWrappedUrl(value) {
  if (!value) {
    return value;
  }

  const normalized = value.startsWith('a1') ? value.slice(2) : value;

  try {
    const decoded = Buffer.from(normalized, 'base64').toString('utf8');
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      return decoded;
    }
  } catch (error) {
    return value;
  }

  return value;
}

function extractSearchResultUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }

  const normalized = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;

  try {
    const parsed = new URL(normalized);

    if (parsed.hostname.includes('duckduckgo.com')) {
      const uddg = parsed.searchParams.get('uddg');
      if (uddg) {
        return safeDecodeURIComponent(uddg);
      }
    }

    if (parsed.hostname.includes('bing.com')) {
      const u = parsed.searchParams.get('u');
      if (u) {
        const decoded = decodeBingWrappedUrl(u);
        if (decoded !== u) {
          return decoded;
        }
      }
      const target = parsed.searchParams.get('target');
      if (target) {
        return safeDecodeURIComponent(target);
      }
    }

    return normalized;
  } catch (error) {
    return normalized;
  }
}

function matchesTargetDomains(rawUrl, domains) {
  const targetUrl = extractSearchResultUrl(rawUrl);
  return domains.some((domain) => targetUrl.includes(domain));
}

function stripTags(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPost(rawUrl, titleHtml, summaryHtml, platform, district) {
  return {
    platform,
    districtId: district.id,
    districtName: district.name,
    title: stripTags(titleHtml),
    summary: stripTags(summaryHtml || ''),
    url: extractSearchResultUrl(rawUrl),
    image: '',
    collectedAt: new Date().toISOString(),
  };
}

function parseBingResults(html, platform, domains, district) {
  let blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/g) || [];

  if (blocks.length === 0) {
    blocks = html.match(/<div[^>]*class="[^"]*b_algo[^"]*"[\s\S]*?<\/div>/g) || [];
  }

  return blocks.slice(0, 8).map((block) => {
    const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/<p>([\s\S]*?)<\/p>/i);

    if (!linkMatch) {
      return null;
    }

    if (!matchesTargetDomains(linkMatch[1], domains)) {
      return null;
    }

    return buildPost(linkMatch[1], linkMatch[2], snippetMatch ? snippetMatch[1] : '', platform, district);
  }).filter(Boolean);
}

function parseDuckDuckGoResults(html, platform, domains, district) {
  const blocks = html.match(/<div[^>]*class="[^"]*result[^"]*"[\s\S]*?<\/div>\s*<\/div>?/g) || html.match(/<div[^>]*class="[^"]*result[^"]*"[\s\S]*?<\/div>/g) || [];

  return blocks.slice(0, 8).map((block) => {
    const linkMatch = block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch = block.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || block.match(/<span[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/span>/i);

    if (!linkMatch) {
      return null;
    }

    if (!matchesTargetDomains(linkMatch[1], domains)) {
      return null;
    }

    return buildPost(linkMatch[1], linkMatch[2], snippetMatch ? snippetMatch[1] : '', platform, district);
  }).filter(Boolean);
}

function parseSogouResults(html, platform, domains, district) {
  const blocks =
    html.match(/<div[^>]*class="[^"]*vrwrap[^"]*"[\s\S]*?<\/div>\s*<\/div>?/g) ||
    html.match(/<div[^>]*class="[^"]*vrwrap[^"]*"[\s\S]*?<\/div>/g) ||
    [];

  return blocks.slice(0, 10).map((block) => {
    const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const snippetMatch =
      block.match(/<p[^>]*class="[^"]*str_info[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
      block.match(/<p>([\s\S]*?)<\/p>/i);

    if (!linkMatch) {
      return null;
    }

    if (!matchesTargetDomains(linkMatch[1], domains)) {
      return null;
    }

    return buildPost(linkMatch[1], linkMatch[2], snippetMatch ? snippetMatch[1] : '', platform, district);
  }).filter(Boolean);
}

module.exports = {
  extractSearchResultUrl,
  matchesTargetDomains,
  parseBingResults,
  parseDuckDuckGoResults,
  parseSogouResults,
};

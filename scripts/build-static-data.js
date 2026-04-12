#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const { createStaticSiteData } = require('../backend/src/lib/overview-service.js');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const outputDir = path.join(projectRoot, 'data');
  const outputFile = path.join(outputDir, 'overview.json');

  await fs.mkdir(outputDir, { recursive: true });

  const payload = await createStaticSiteData();
  await fs.writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Static data written to ${outputFile}`);
  console.log(`Generated at: ${payload.generatedAt}`);
  console.log(`Default district: ${payload.defaultDistrictId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

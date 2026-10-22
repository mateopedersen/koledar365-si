import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'site');
const evidence = path.join(root, 'evidence');
const catalog = JSON.parse(fs.readFileSync(path.join(site, 'free/catalog.json')));
const rows = catalog.filter(row => row.collection === 'calendar-2027-2030');
const records = JSON.parse(fs.readFileSync(path.join(evidence, 'calendar-collection-records.json')));
const sourceValidation = JSON.parse(fs.readFileSync(path.join(evidence, 'calendar-collection-source-verification.json')));
const redirects = fs.readFileSync(path.join(site, '_redirects'), 'utf8').split(/\r?\n/)
  .map(line => line.trim().split(/\s+/)).filter(parts => parts.length >= 3 && !parts[0].startsWith('#'));
const redirectMap = new Map(redirects.map(([source, destination, status]) => [source, {destination, status}]));
const issues = [];
const results = [];
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (rows.length !== 780 || records.length !== 780) issues.push(`Expected 780 collection rows and reports, got ${rows.length}/${records.length}`);
if (!sourceValidation.passed || sourceValidation.collection_records !== 780 || sourceValidation.failed_records !== 0 || sourceValidation.pixel_identity_records !== 780) issues.push('Source PDF/WebP validation must pass for all 780 pairs before publication');
if (new Set(rows.map(row => row.fingerprint)).size !== 780) issues.push('Collection fingerprints are not unique');
const collectionRedirects = redirects.filter(([source]) => records.some(record => record.old_pdf_url === source || record.old_webp_url === source));
if (collectionRedirects.length !== 1560) issues.push(`Expected 1,560 redirects for replaced PDFs/WebPs, got ${collectionRedirects.length}`);
if (redirectMap.size !== redirects.length) issues.push('Duplicate redirect source rules');

const rowByKey = new Map(rows.map(row => {
  const o = row.options;
  return [`${o.type}/${o.year}/${o.type === 'monthly' ? o.month : 0}/${o.design}`, row];
}));
const sourceRowByPair = new Map(sourceValidation.records.map(record => [`${record.pdf}/${record.webp}`, record]));
const periodCounts = new Map();
for (const record of records) {
  const periodKey = `${record.type}/${record.year}/${record.month || 0}`;
  periodCounts.set(periodKey, (periodCounts.get(periodKey) || 0) + 1);
  const key = `${record.type}/${record.year}/${record.type === 'monthly' ? record.month : 0}/${record.design}`;
  const row = rowByKey.get(key);
  const status = {key, source_pdf: record.source_pdf, source_webp: record.source_webp, checks: []};
  const sourceRow = sourceRowByPair.get(`${record.source_pdf}/${record.source_webp}`);
  if (!sourceRow?.passed) issues.push(`${key}: source preflight is absent or failed`);
  if (!row) {
    issues.push(`${key}: missing static catalogue record`);
    results.push(status);
    continue;
  }
  if (row.options.paper !== 'A3' || !['portrait', 'landscape'].includes(row.options.orientation)) issues.push(`${key}: A3 paper/orientation metadata missing`);
  for (const [format, sourcePath, oldUrl] of [
    ['pdf', record.source_pdf, record.old_pdf_url],
    ['webp', record.source_webp, record.old_webp_url],
  ]) {
    const url = row.files[format];
    const actual = path.join(site, decodeURIComponent(new URL(url, 'https://koledar365.si').pathname.slice(1)));
    const exists = fs.existsSync(actual);
    const digest = exists ? hashFile(actual) : null;
    const expectedDigest = record[`${format}_sha256`];
    const size = exists ? fs.statSync(actual).size : null;
    if (!exists || digest !== expectedDigest) issues.push(`${key}: ${format} differs from its source checksum`);
    if (exists && size > 25 * 1024 * 1024) issues.push(`${key}: ${format} exceeds Cloudflare's 25 MiB file limit`);
    const expectedPath = `/koledarji/2027-2030/original/${sourcePath}`;
    if (decodeURIComponent(new URL(url, 'https://koledar365.si').pathname) !== expectedPath) issues.push(`${key}: original filename or path was changed`);
    if (fs.existsSync(path.join(site, decodeURIComponent(oldUrl).slice(1)))) issues.push(`${key}: retired old ${format} file still exists in the static output`);
    const redirect = redirectMap.get(oldUrl);
    const wanted = format === 'webp' && record.compatibility_zip_url ? record.compatibility_zip_url : url;
    if (!redirect || redirect.status !== '301' || redirect.destination !== wanted) issues.push(`${key}: old ${format} URL does not have its exact 301 replacement`);
    status.checks.push({format, exists, sha256: digest, expected_sha256: expectedDigest, bytes: size, redirect_to: redirect?.destination || null});
  }
  const previewUrl = row.files.preview;
  const previewPath = decodeURIComponent(new URL(previewUrl, 'https://koledar365.si').pathname);
  const previewFile = path.join(site, previewPath.slice(1));
  const previewExists = fs.existsSync(previewFile);
  if (!previewExists) issues.push(`${key}: full-page preview is missing`);
  if (previewUrl !== record.preview_url || row.preview_width !== record.preview_width || row.preview_height !== record.preview_height) issues.push(`${key}: full-page preview mapping or dimensions differ`);
  status.checks.push({format: 'preview', exists: previewExists, width: row.preview_width, height: row.preview_height});
  results.push(status);
}
if (periodCounts.size !== 52 || [...periodCounts.values()].some(count => count !== 15)) issues.push('Expected 52 period pages with exactly 15 designs each');

const months = ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'avgust', 'september', 'oktober', 'november', 'december'];
const galleryChecks = [];
for (let year = 2027; year <= 2030; year++) {
  const pages = [`koledar/${year}/index.html`, ...months.map(month => `koledar/${year}/${month}/index.html`)];
  for (const relative of pages) {
    const file = path.join(site, relative);
    if (!fs.existsSync(file)) {
      issues.push(`Missing gallery page ${relative}`);
      continue;
    }
    const html = fs.readFileSync(file, 'utf8');
    const images = [...html.matchAll(/<img\b[^>]*src="([^"]*\/koledarji\/2027-2030\/preview\/[^\"]+)"[^>]*>/g)];
    const downloadLinks = [...html.matchAll(/<a\b[^>]*data-calendar-download="(pdf|webp)"[^>]*>/g)].map(match => {
      const href = match[0].match(/\bhref="([^"]+)"/);
      return href ? {format: match[1], url: decodeURIComponent(href[1])} : null;
    }).filter(Boolean);
    const linkedPdfs = downloadLinks.filter(link => link.format === 'pdf').map(link => link.url);
    const linkedWebps = downloadLinks.filter(link => link.format === 'webp').map(link => link.url);
    if (images.length !== 15 || linkedPdfs.length !== 15 || linkedWebps.length !== 15) issues.push(`${relative}: expected 15 full-page thumbnails and 30 direct downloads`);
    if (!html.includes('rel="canonical"') || !html.includes('robots" content="index, follow')) issues.push(`${relative}: canonical or indexable robots directive is missing`);
    if (!html.includes('application/ld+json') || !html.includes('ImageObject')) issues.push(`${relative}: image structured data is missing`);
    galleryChecks.push({path: `/${relative.replace(/index\.html$/, '')}`, previews: images.length, pdfs: linkedPdfs.length, webps: linkedWebps.length, indexable: html.includes('robots" content="index, follow')});
  }
}

const sitemap = fs.readFileSync(path.join(site, 'sitemap-pages.xml'), 'utf8');
const sitemapImages = (sitemap.match(/<image:image>/g) || []).length;
const sitemapPages = galleryChecks.filter(page => page.previews === 15).length;
if (sitemapImages < sitemapPages * 15) issues.push(`Image sitemap has ${sitemapImages} images; expected at least ${sitemapPages * 15}`);

const report = {
  checked_at: new Date().toISOString(),
  collection_records: rows.length,
  period_pages: periodCounts.size,
  redirect_rules: redirects.length,
  old_collection_assets_removed: true,
  image_sitemap_entries: sitemapImages,
  gallery_pages: galleryChecks,
  records: results,
  passed: issues.length === 0,
  issues,
};
fs.writeFileSync(path.join(evidence, 'calendar-collection-static-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({passed: report.passed, collection_records: rows.length, period_pages: periodCounts.size, redirects: redirects.length, image_sitemap_entries: sitemapImages, issues}));
if (issues.length) process.exit(1);

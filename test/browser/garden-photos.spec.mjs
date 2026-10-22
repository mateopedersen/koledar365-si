import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const catalog=JSON.parse(await readFile(new URL('../../public/garden/photos.json',import.meta.url),'utf8'));

test('all sixteen vegetables have sharp self-contained licensed SVG photographs and working details',async({page,request})=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/setveni-koledar/');
  const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
  await expect(page.locator('[data-garden]')).toHaveAttribute('data-ready','true');
  await expect(page.locator('.garden-plant-photo')).toHaveCount(16);
  for(const photo of catalog.photos){
    const row=page.locator(`[data-garden-row="${photo.id}"]`),button=row.locator('[data-garden-details]');
    const icon=row.locator('img');await icon.scrollIntoViewIfNeeded();
    const versionedPath=photo.path.replace(/\.svg$/,`.${photo.svg_sha256.slice(0,16)}.svg`);
    await expect(icon).toHaveAttribute('src',versionedPath);
    await expect.poll(()=>icon.evaluate(img=>img.complete&&img.naturalWidth>=56&&img.naturalWidth===img.naturalHeight),{message:`${photo.id}: decoded square SVG photograph`}).toBe(true);
    await expect(icon).toHaveCSS('opacity','1');await expect(icon).toHaveCSS('filter','none');
    await expect(button).toHaveAccessibleName(photo.name);
    const asset=await request.get(versionedPath);expect(asset.status()).toBe(200);expect(asset.headers()['content-type']).toContain('image/svg+xml');
    const svg=await asset.body();expect(createHash('sha256').update(svg).digest('hex')).toBe(photo.svg_sha256);
    const source=svg.toString();expect(source).toContain('<image ');expect(source).toContain('data:image/webp;base64,');expect(source).toContain(photo.license);
    expect(source).not.toMatch(/<script|<foreignObject|onload=|href="https?:/);
    const embedded=Buffer.from(source.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)[1],'base64');
    expect(embedded.subarray(0,4).toString()).toBe('RIFF');expect(embedded.subarray(8,12).toString()).toBe('WEBP');
    expect(createHash('sha256').update(embedded).digest('hex')).toBe(photo.embedded_webp_sha256);
    expect(photo.author.length).toBeGreaterThan(2);expect(photo.original_width).toBeGreaterThanOrEqual(330);
    await button.click();const detail=page.locator(`[data-garden-detail="${photo.id}"]`);
    await expect(detail).toBeVisible();await expect(button).toHaveAttribute('aria-expanded','true');
    await expect(detail.locator('.garden-detail-photo')).toHaveAttribute('alt',photo.alt);
    await expect(detail.locator('.garden-photo-credit, a[href*="fotografije-in-licence"]')).toHaveCount(0);
    await button.click();await expect(detail).toBeHidden();
  }
  for(const width of [320,390,780,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for(const name of await page.locator('.garden-plant-name').all()){
      expect(await name.evaluate(el=>el.scrollWidth<=el.clientWidth&&el.scrollHeight<=el.clientHeight)).toBe(true);
    }
  }
  await page.locator('[data-garden-search]').fill('cesen');await expect(page.locator('[data-garden-row]:visible .garden-plant-photo')).toHaveCount(1);
  await expect(page.locator('main a[href*="fotografije-in-licence"], main .garden-photo-credit')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/CC BY|CC0|Avtorji in licence fotografij/);
  await page.goto('/');
  // Let the unrelated initial city request settle before leaving the document.
  // WebKit reports a request cancelled by immediate navigation as a page error.
  await expect(page.locator('#city-location-status')).not.toContainText('določamo');
  await expect(page.locator('#city-card')).toHaveAttribute('data-weather-state',/^(ready|saved|unavailable)$/);
  await expect(page.locator('#city-weather')).not.toHaveAttribute('aria-busy','true');
  await page.locator('footer a[href="/fotografije-in-licence/"]').click();
  await expect(page).toHaveURL(/\/fotografije-in-licence\/$/);
  await expect(page.locator('#fotografije-vrtnin')).toHaveText('Fotografije vrtnin');
  await expect(page.locator('.garden-photo-license')).toHaveCount(16);
  for(const photo of catalog.photos){
    const credit=page.locator(`#vrtnina-${photo.id}`);await expect(credit).toContainText(photo.author);
    await expect(credit.locator(`a[href="${photo.source}"]`)).toHaveCount(1);
    await expect(credit.locator(`a[href="${photo.license_url}"]`)).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

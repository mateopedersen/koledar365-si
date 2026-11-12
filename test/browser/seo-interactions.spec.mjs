import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('date calculator tabs preserve calculations and submit only active fields',async({page})=>{
  await page.goto('/datumski-kalkulator/');
  const form=page.locator('[data-date-form]');
  const calculate=()=>form.locator('[data-date-submit]').click();
  const primary=page.locator('[data-result-primary]');
  const oneStart=async()=>expect(await form.evaluate(element=>new FormData(element).getAll('from').length)).toBe(1);
  await form.locator('[data-date-from]').fill('2028-02-01');
  await form.locator('[data-date-to]').fill('2028-02-29');
  await calculate();await expect(primary).toHaveText('28 dni');await oneStart();
  const add=page.getByRole('tab',{name:'Prištej ali odštej'});
  await add.click();await expect(page.getByRole('tabpanel',{name:'Prištej ali odštej'})).toBeVisible();
  await form.locator('[data-shift-from]').fill('2028-01-31');
  await form.locator('[data-date-delta]').fill('1');
  await form.locator('[data-date-unit]').selectOption('months');
  await calculate();await expect(primary).toContainText('29.');await expect(primary).toContainText('2028');await oneStart();
  await add.focus();await page.keyboard.press('ArrowRight');
  const work=page.getByRole('tab',{name:'Delovni dnevi',exact:true});
  await expect(work).toBeFocused();await expect(work).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('tabpanel',{name:'Delovni dnevi',exact:true})).toBeVisible();
  await form.locator('[data-work-from]').fill('2028-02-01');
  await form.locator('[data-work-to]').fill('2028-02-29');
  await calculate();await expect(primary).toHaveText('20 delovnih dni');await oneStart();
  const accessibility=await new AxeBuilder({page}).withRules(['aria-allowed-role']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('school hero uses responsive previews and retains original attribution',async({page})=>{
  await page.goto('/solske-pocitnice/');
  const hero=page.locator('.sp-hero-art img');
  const photo=await page.locator('#sp-data').evaluate(element=>JSON.parse(element.textContent).photos.hero);
  await expect(hero).toHaveAttribute('src',photo.display_path);
  await expect(hero).toHaveAttribute('srcset',photo.srcset);
  await expect(hero).toHaveAttribute('fetchpriority','high');
  await expect.poll(()=>hero.evaluate(image=>image.complete&&image.naturalWidth>0&&new URL(image.currentSrc).pathname.endsWith('.webp'))).toBe(true);
  await expect(page.locator('.sp-photo-credit-hero a').first()).toHaveAttribute('href',photo.source);
  await expect(page.locator('.sp-photo-credit-hero a').last()).toHaveAttribute('href',photo.licenseUrl);
});

for(const path of ['/','/solske-pocitnice/','/horoskop/']){
  test(`public landmarks and content roles support navigation on ${path}`,async({page})=>{
    await page.goto(path);
    const result=await new AxeBuilder({page}).withRules(['landmark-unique','landmark-complementary-is-top-level','aria-allowed-role']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('copying a calculation or its link preserves the result even when clipboard access is denied', async ({page}) => {
  await page.addInitScript(() => {
    window.writtenValues = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      async writeText(text) {
        await new Promise(resolve => setTimeout(resolve, 20));
        if (window.denyClipboard) throw new Error('Clipboard access denied');
        window.writtenValues.push(text);
      }
    } });
  });
  await page.goto('/datumski-kalkulator/?calc=difference&from=2028-02-28&to=2028-03-01');
  const consent = page.locator('[data-consent=necessary]');
  if (await consent.isVisible()) await consent.click();
  const primary = page.locator('[data-result-primary]');
  await expect(primary).toHaveText('2 dneva');
  const resultButton = page.locator('[data-copy-result]');
  await resultButton.click();
  await expect(resultButton).toHaveText('Kopirano ✓');
  const linkButton = page.locator('[data-copy-link]');
  await linkButton.click();
  await expect(linkButton).toHaveText('Povezava kopirana ✓');
  const [text, link] = await page.evaluate(() => window.writtenValues);
  expect(text).toContain('2 dneva');
  expect(new URL(link).searchParams.get('to')).toBe('2028-03-01');
  await page.evaluate(() => { window.denyClipboard = true; });
  await resultButton.click();
  await expect(resultButton).toHaveText('Kopiranje ni uspelo');
  await expect(primary).toHaveText('2 dneva');
});

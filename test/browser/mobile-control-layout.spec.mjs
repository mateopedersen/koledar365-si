import {test,expect} from '@playwright/test';

async function controlGeometry(page,selector){return page.locator(selector).evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),p=node.parentElement.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(node);return{width:r.width,height:r.height,left:r.left,right:r.right,parentWidth:p.width,contentFits:[...range.getClientRects()].filter(x=>x.width>2&&x.height>2).every(x=>x.left>=r.left-2&&x.right<=r.right+2&&x.top>=r.top-2&&x.bottom<=r.bottom+2)}}));}

test('the homepage note panel keeps the heading, field and save button in separate rows', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.calendar-notes-panel');
  for (const width of [320, 390, 600, 960, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await panel.scrollIntoViewIfNeeded();
    const [heading, field, save] = await Promise.all([
      panel.locator('h2').boundingBox(), panel.locator('#day-notes').boundingBox(),
      panel.locator('#save-notes').boundingBox(),
    ]);
    expect(heading.y + heading.height).toBeLessThanOrEqual(field.y);
    expect(field.y + field.height).toBeLessThanOrEqual(save.y);
    expect(save.x + save.width).toBeLessThanOrEqual(field.x + field.width + 1);
  }
});

test('mobile garden actions and native date fields fit their rows before and after entry',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/setveni-koledar/');
  await expect(page.locator('[data-garden]')).toHaveAttribute('data-ready','true');
  for(const width of [320,390,480,600,768]){
    await page.setViewportSize({width,height:900});
    const actions=await controlGeometry(page,'.garden-hero-actions>.button');
    expect(Math.abs(actions[0].height-actions[1].height)).toBeLessThanOrEqual(1);
    expect(actions.every(x=>x.contentFits&&x.right<=width+1&&x.left>=0)).toBeTruthy();
    for(const value of ['', '2027-03-12']){
      await page.locator('#garden-plan-date').fill(value);
      const fields=await controlGeometry(page,'.garden-plan-form input,.garden-plan-form select');
      expect(fields.every(x=>Math.abs(x.height-48)<1&&x.width<=x.parentWidth+1&&x.right<=width+1)).toBeTruthy();
    }
    const boxes=await page.locator('.garden-plan-form input,.garden-plan-form select').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)expect(Math.min(boxes[i].right,boxes[j].right)-Math.max(boxes[i].x,boxes[j].x)>2&&Math.min(boxes[i].bottom,boxes[j].bottom)-Math.max(boxes[i].y,boxes[j].y)>2).toBeFalsy();
  }
});

test('mobile school weekday tabs remain readable and expose full accessible names',async({page})=>{
  await page.goto('/solski-urnik/');
  for(const width of [320,390,480]){
    await page.setViewportSize({width,height:900});
    const tabs=await controlGeometry(page,'.student-day-filters>button');
    expect(tabs).toHaveLength(5);
    expect(tabs.every(x=>x.contentFits&&x.height>=48)).toBeTruthy();
    for(const name of ['Pon Ponedeljek','Tor Torek','Sre Sreda','Čet Četrtek','Pet Petek'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
  }
});

test('studio download and template names fit the narrowest phone',async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto('/ustvari-koledar/');
  await expect(page.locator('.studio-presets>button')).not.toHaveCount(0);
  for(const selector of ['#studio-download','.studio-presets>button']){
    const controls=await controlGeometry(page,selector);
    expect(controls.every(x=>x.contentFits&&x.left>=0&&x.right<=320)).toBeTruthy();
  }
});

test('expanded shift entry fields keep their own rows on phones',async({page})=>{
  await page.goto('/razpored-izmen/');
  await page.locator('.shift-custom-entries>summary').click();
  for(const width of [320,430,768]){
    await page.setViewportSize({width,height:900});
    const fields=await controlGeometry(page,'.shift-custom-entries #planner-entry .filters input');
    expect(fields).toHaveLength(8);
    expect(fields.every(x=>x.width>=100&&x.width<=x.parentWidth+1&&x.right<=width+1)).toBeTruthy();
  }
});

test('shift preview remains inside the phone workspace',async({page})=>{
  await page.goto('/razpored-izmen/');
  for(const width of [320,390,430,768]){
    await page.setViewportSize({width,height:900});
    const pieces=await controlGeometry(page,'.shift-preview__top,.shift-preview__badge,.shift-stats>div');
    expect(pieces.every(x=>x.left>=0&&x.right<=width+1&&x.contentFits)).toBeTruthy();
  }
});

test('touching the tools menu does not leave it in a mouse hover state', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Requires a touch device');
  await page.goto('/');
  const menu = page.locator('.nav-explorer');
  const toggle = menu.locator('summary');
  const closedColor = await toggle.evaluate(element => getComputedStyle(element).backgroundColor);

  await toggle.tap();
  await expect(menu).toHaveJSProperty('open', true);
  await toggle.tap();
  await expect(menu).toHaveJSProperty('open', false);
  await expect(toggle).toHaveCSS('background-color', closedColor);
});

test('phone download cards use consistent spacing and equal actions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/lunin-koledar/2029/avgust/');
  const cards = page.locator('.lunar-download-grid > .panel');
  await expect(cards.nth(1)).toBeVisible();
  const [first, second] = await Promise.all([cards.first().boundingBox(), cards.nth(1).boundingBox()]);
  expect(second.y - first.y - first.height).toBeLessThanOrEqual(13);

  const actions = await controlGeometry(page, '.lunar-download-grid > .panel:first-child .lunar-download-actions > a');
  expect(actions).toHaveLength(2);
  expect(actions.every(action => action.height >= 44 && action.contentFits)).toBeTruthy();
  expect(Math.abs(actions[0].width - actions[1].width)).toBeLessThanOrEqual(1);
});

test('the photo caption is legible and separate from the note on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/o-nas/');
  const caption = page.locator('.about-photo figcaption');
  await expect(caption).toHaveCSS('color', 'rgb(255, 255, 255)');
  const [photo, note] = await Promise.all([
    page.locator('.about-photo').boundingBox(),
    page.locator('.about-calendar-note').boundingBox()
  ]);
  expect(photo.y + photo.height).toBeLessThanOrEqual(note.y);
});

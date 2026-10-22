import {test,expect} from '@playwright/test';

async function controlGeometry(page,selector){return page.locator(selector).evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),p=node.parentElement.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(node);return{width:r.width,height:r.height,left:r.left,right:r.right,parentWidth:p.width,contentFits:[...range.getClientRects()].filter(x=>x.width>2&&x.height>2).every(x=>x.left>=r.left-2&&x.right<=r.right+2&&x.top>=r.top-2&&x.bottom<=r.bottom+2)}}));}

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
    for(const name of ['Ponedeljek','Torek','Sreda','Četrtek','Petek'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
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

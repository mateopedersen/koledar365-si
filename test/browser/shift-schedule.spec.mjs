import {test,expect} from '@playwright/test';

test('shift entries can be saved, edited and restored after reload',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('k365.consent',JSON.stringify({version:2,expiresAt:Date.now()+86400000,preferences:false})));
 await page.goto('/razpored-izmen/');
 const form=page.locator('#planner-entry');
 await form.locator('[name=date]').fill('2027-01-05');
 await form.locator('[name=title]').fill('Jutranja izmena');
 await form.locator('[name=time]').fill('07:00');
 await form.locator('[name=end_time]').fill('15:00');
 await form.locator('[type=submit]').click();
 const row=page.locator('#planner-entries .planner-entry-row').filter({hasText:'Jutranja izmena'});
 await expect(row).toBeVisible();
 await row.getByRole('button',{name:'Uredi',exact:true}).click();
 await form.locator('[name=title]').fill('Popoldanska izmena');
 await form.locator('[type=submit]').click();
 await page.reload();
 await expect(page.locator('#planner-entries')).toContainText('Popoldanska izmena');
 await expect(page.locator('#planner-entries')).not.toContainText('Jutranja izmena');
 expect(errors).toEqual([]);
});

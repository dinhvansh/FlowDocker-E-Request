/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const saved=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const check=(ok,message)=>{if(!ok)throw new Error(message);};
 try {
  await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');});await page.reload();
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Đề nghị thanh toán · mẫu chi phí VND',exact:true}).click();
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
  const spacing=page.locator('.fd-preview-controls').getByRole('button',{name:'Khoảng cách',exact:true});await spacing.click();
  await page.getByRole('combobox',{name:'Kiểu khoảng cách',exact:true}).click();await page.getByRole('option',{name:'Gọn',exact:true}).click();
  const preview=page.locator('.fd-form-preview');
  check(await preview.evaluate(el=>el.style.getPropertyValue('--fd-form-row-gap'))==='8px','Live preview compact');
  const range=page.getByRole('slider',{name:'Giữa các hàng',exact:true});
  const box=await range.boundingBox();await page.mouse.move(box.x+box.width*.2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height/2,{steps:8});await page.mouse.up();await page.keyboard.press('Escape');
  await page.locator('.fd-preview-controls').getByRole('button',{name:'Hoàn tác khoảng cách',exact:true}).click();check(await preview.evaluate(el=>el.style.getPropertyValue('--fd-form-row-gap'))==='8px','Undo entire drag');
  await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
  const inline=page.locator('.fd-preview-inline-controls');await inline.getByRole('button',{name:'Khoảng cách',exact:true}).click();await page.getByRole('slider',{name:'Giữa các hàng',exact:true}).fill('12');check(await preview.evaluate(el=>el.style.getPropertyValue('--fd-form-row-gap'))==='12px','Inline controls update preview');await page.locator('[data-slot=popover-content]').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});await page.screenshot({path:'output/playwright/inline-preview-spacing-1440.png'});await page.keyboard.press('Escape');await inline.getByRole('button',{name:'Hoàn tác khoảng cách',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,650));
  const pos=await spacing.boundingBox();check(pos.y>=0&&pos.y<80,'Preview toolbar remains visible on scroll '+JSON.stringify(pos));
  await spacing.click();await page.locator('[data-slot=popover-content]').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});await page.screenshot({path:'output/playwright/preview-spacing-access-1440.png',fullPage:false});await page.keyboard.press('Escape');
  await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','en');localStorage.setItem('flowdocker.theme','dark');});await page.reload();
  await page.getByRole('button',{name:'Expense request · VND template',exact:true}).click();await page.getByRole('tab',{name:'Form preview',exact:true}).click();
  for (const [width,height] of [[1366,768],[390,844]]) {
   await page.setViewportSize({width,height});await page.evaluate(()=>window.scrollTo(0,650));
   await page.locator('.fd-preview-controls').getByRole('button',{name:'Spacing',exact:true}).click();await page.getByRole('slider',{name:'Between rows',exact:true}).waitFor();
   await page.locator('[data-slot=popover-content]').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+width);
   await page.screenshot({path:`output/playwright/preview-spacing-access-${width}.png`,fullPage:false});await page.keyboard.press('Escape');
  }
  return {status:'PASS',stickyPosition:pos};
 } finally {
  await page.evaluate(({keys,saved})=>keys.forEach((k,i)=>saved[i]===null?localStorage.removeItem(k):localStorage.setItem(k,saved[i])),{keys,saved});
 }
}

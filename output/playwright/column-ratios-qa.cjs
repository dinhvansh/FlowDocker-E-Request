/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys), recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(ok,m)=>{if(!ok)throw Error(m)};
 const child=id=>({id,key:id,label:{vi:id,en:id},type:'text',required:false,options:[]});
 const form={id:'qa-columns',schemaVersion:2,title:{vi:'Column QA',en:'Column QA'},version:1,status:'DRAFT',fields:[{...child('cols'),type:'columns',columns:2,columnRatios:[1,2],hideLabel:true,children:[child('left'),child('right')]}]};
 try {
  await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});const fixture=sessionStorage.getItem('qa-columns-fixture');if(fixture){sessionStorage.setItem('flowdocker.form-recovery.v1',fixture);sessionStorage.removeItem('qa-columns-fixture')}});
  const results=[];
  for(const [width,height,locale,theme] of [[1440,900,'vi','light'],[1366,768,'en','dark'],[390,844,'en','dark']]) {
   await page.evaluate(({form,locale,theme})=>{localStorage.setItem('flowdocker.form-drafts.v1','[]');localStorage.setItem('flowdocker.locale',locale);localStorage.setItem('flowdocker.theme',theme);sessionStorage.setItem('qa-columns-fixture',JSON.stringify({version:1,definition:form,source:JSON.stringify(form),codeDirty:false}))},{form,locale,theme});await page.setViewportSize({width,height});await page.reload();
   const canvas=page.locator('.fd-live-form');await canvas.waitFor();
   const grid=canvas.locator('.fd-runtime-columns').first();
   const cells=grid.locator(':scope > [data-canvas-field]');
   if(width!==390){
    await canvas.locator('[data-canvas-field="cols"] > .fd-canvas-field-bar').click();
    const handle=canvas.getByRole('separator');await handle.waitFor();
    const before=await cells.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(before[1]/before[0]>1.9,'Ratio not rendered');
    await handle.focus();await handle.press('ArrowRight');
    const after=await cells.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(after[0]>before[0],'Keyboard resize failed');
    await page.getByRole('button',{name:locale==='vi'?'Hoàn tác':'Undo',exact:true}).click();
    const undone=await cells.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(Math.abs(undone[0]-before[0])<2,'Undo resize failed');
    const box=await canvas.locator('.fd-column-resize').boundingBox();const grip=await handle.boundingBox();
    await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height/2,{steps:8});await page.mouse.up();
    const dragged=await cells.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(dragged[0]>dragged[1],'Pointer resize failed');await page.screenshot({path:`output/playwright/column-ratios-editor-${width}-${locale}-${theme}.png`,animations:'disabled'});
    await page.getByRole('button',{name:locale==='vi'?'Hoàn tác':'Undo',exact:true}).click();
    const restored=await cells.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));check(Math.abs(restored[0]-before[0])<2,'Drag created more than one history checkpoint');
   }
   await page.getByRole('tab',{name:locale==='vi'?'Xem thử biểu mẫu':'Form preview',exact:true}).click();
   const preview=page.locator('.fd-preview-paper');await preview.waitFor();
   const controls=preview.locator('.fd-runtime-columns > .fd-runtime-field');
   const rects=await controls.evaluateAll(els=>els.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width})));
   if(width===390)check(Math.abs(rects[0].x-rects[1].x)<2&&rects[1].y>rects[0].y,'Mobile did not stack');else check(rects[1].w/rects[0].w>1.9,'Preview ratio mismatch');
   const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));check(metrics.width===metrics.scroll,'Overflow');
   await page.screenshot({path:`output/playwright/column-ratios-${width}-${locale}-${theme}.png`,animations:'disabled'});results.push({width,locale,theme,rects,...metrics});
  }
  check(!errors.length,errors.join(';'));console.log(JSON.stringify({results,errors}));
 } finally {await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>{if(original[i]===null)localStorage.removeItem(k);else localStorage.setItem(k,original[i])});if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery)},{keys,original,recovery});}
}

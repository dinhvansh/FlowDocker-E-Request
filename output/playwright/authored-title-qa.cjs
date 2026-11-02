/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const check=(ok,m)=>{if(!ok)throw Error(m)};
 const form={id:'qa-authored-heading',schemaVersion:2,title:{vi:'Tên quản lý biểu mẫu',en:'Catalog form name'},version:1,status:'DRAFT',fields:[]};
 try {
  await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});if(sessionStorage.getItem('qa-authored-reset')){sessionStorage.removeItem('flowdocker.form-recovery.v1');sessionStorage.removeItem('qa-authored-reset')}});
  await page.evaluate(form=>{sessionStorage.setItem('qa-authored-reset','1');localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light')},form);
  await page.reload();await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:form.title.vi,exact:true}).click();
  const canvas=page.locator('.fd-live-form');
  check(await canvas.getByRole('heading',{name:form.title.vi}).count()===0,'Automatic title still present');
  await page.getByRole('button',{name:'Thêm Nhãn / Văn bản',exact:true}).click();
  await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('ĐỀ NGHỊ THANH TOÁN');
  await page.getByRole('textbox',{name:'Nhãn tiếng Anh',exact:true}).fill('PAYMENT REQUEST');
  await page.getByRole('combobox',{name:'Cỡ chữ nội dung',exact:true}).click();await page.getByRole('option',{name:'Tiêu đề lớn',exact:true}).click();
  await page.getByRole('combobox',{name:'Căn nội dung',exact:true}).click();await page.getByRole('option',{name:'Căn giữa',exact:true}).click();
  await canvas.getByRole('heading',{name:'ĐỀ NGHỊ THANH TOÁN',exact:true}).waitFor();
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();check(await canvas.locator('.fd-content-block').getAttribute('data-align')==='left','Undo alignment failed');await page.getByRole('button',{name:'Làm lại',exact:true}).click();
  await page.screenshot({path:'output/playwright/authored-title-1440-vi-light.png',animations:'disabled'});
  await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();await page.reload();const entry=page.getByRole('button',{name:form.title.vi,exact:true});if(await entry.count())await entry.click();
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();const preview=page.locator('.fd-form-preview');await preview.getByRole('heading',{name:'ĐỀ NGHỊ THANH TOÁN',exact:true}).waitFor();check(await preview.getByRole('heading',{name:form.title.vi,exact:true}).count()===0,'Preview has catalog title');
  await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','en');localStorage.setItem('flowdocker.theme','dark')});const metrics=[];
  for(const [width,height] of [[1366,768],[390,844]]) {
   await page.setViewportSize({width,height});await page.reload();const entry=page.getByRole('button',{name:form.title.en,exact:true});await page.getByRole('heading',{name:form.title.en,level:1,exact:true}).or(entry).first().waitFor();if(await entry.count())await entry.click();await page.getByRole('tab',{name:'Form preview',exact:true}).click();await preview.getByRole('heading',{name:'PAYMENT REQUEST',exact:true}).waitFor();check(await preview.getByRole('heading',{name:form.title.en,exact:true}).count()===0,'EN preview has catalog title');const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));metrics.push(m);check(m.width===m.scroll,'Horizontal overflow');await page.screenshot({path:`output/playwright/authored-title-${width}-en-dark.png`,animations:'disabled'});
  }
  check(!errors.length,errors.join(', '));return {status:'PASS',checks:['no automatic title','add heading via toolbox','title size and alignment','undo redo','save reload','authored heading in preview','VI EN light dark responsive'],metrics,errors};
 } finally {await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery)},{keys,original,recovery})}
}

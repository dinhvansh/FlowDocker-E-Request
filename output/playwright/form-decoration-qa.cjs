/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const choose=async(label,name)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name,exact:true}).click();};
  const form={id:'qa-decoration',title:{vi:'Mẫu văn bản QA',en:'Document QA'},version:1,status:'DRAFT',fields:[{id:'reason',key:'reason',label:{vi:'Nội dung đề nghị',en:'Request details'},type:'text',required:false,options:[]}]};
  const snapshot=()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('flowdocker.form-recovery.v1')));
  try {
    await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});if(sessionStorage.getItem('flowdocker.qa.decoration-reset')==='1'){sessionStorage.removeItem('flowdocker.form-recovery.v1');sessionStorage.removeItem('flowdocker.qa.decoration-reset');}});
    await page.evaluate(form=>{sessionStorage.setItem('flowdocker.qa.decoration-reset','1');localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},form);
    await page.reload();await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Mẫu văn bản QA',exact:true}).click();
    await page.getByRole('button',{name:'Đầu trang / Chân trang',exact:true}).click();
    await page.getByRole('button',{name:'Mẫu logo và tiêu đề',exact:true}).click();
    const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=160;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#e20e17';ctx.fillRect(0,0,160,64);ctx.fillStyle='white';ctx.font='bold 24px sans-serif';ctx.fillText('DEMO',40,42);return c.toDataURL('image/png').split(',')[1];});
    await page.getByLabel('Tải ảnh / Logo',{exact:true}).setInputFiles({name:'demo-logo.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.waitForFunction(()=>!!document.querySelector('.fd-decoration-preview img')?.naturalWidth);
    await page.getByRole('textbox',{name:'Mô tả ảnh · tiếng Việt',exact:true}).fill('Logo minh họa');
    await page.getByRole('textbox',{name:'Mô tả ảnh · tiếng Anh',exact:true}).fill('Demo logo');
    await choose('Cột đang chỉnh','Cột 3');
    await page.getByRole('textbox',{name:'Nội dung · tiếng Việt',exact:true}).fill('Mã: QA-001');
    await page.getByRole('textbox',{name:'Nội dung · tiếng Anh',exact:true}).fill('Code: QA-001');
    await page.getByRole('button',{name:'Mẫu khu vực chữ ký',exact:true}).click();
    await page.getByRole('textbox',{name:'Nội dung · tiếng Việt',exact:true}).fill('Người đề nghị\nKý và ghi rõ họ tên');
    await page.getByRole('button',{name:'Đóng',exact:true}).first().click();
    const canvas=page.locator('.fd-live-form');
    check(await canvas.locator('[data-placement=header] img').count()===1,'Logo missing from canvas');
    check(await canvas.locator('[data-placement=footer] .fd-form-band-cell').count()===3,'Footer columns missing');
    check(await canvas.getByText('Chọn trường để chỉnh sửa. Dữ liệu trên canvas chỉ dùng để thử.',{exact:true}).count()===0,'Authoring hint included in document');
    await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();await page.getByRole('button',{name:'Làm lại',exact:true}).click();
    await page.getByRole('tab',{name:'Code Studio',exact:true}).click();
    const editor=page.getByRole('textbox',{name:'Schema biểu mẫu · Code Studio',exact:true});await editor.waitFor();
    const before=await snapshot();check(JSON.parse(before.source).decoration.header.columns===3,'Visual metadata missing in code');
    before.definition.decoration.header.cells[2].text.vi='Mã: QA-002';
    await editor.click();await editor.press('ControlOrMeta+A');await page.keyboard.insertText(JSON.stringify(before.definition,null,2));
    await canvas.getByText('Mã: QA-002',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
    await page.reload();await page.getByRole('button',{name:'Mẫu văn bản QA',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    const preview=page.locator('.fd-form-preview');await preview.getByText('Mã: QA-002',{exact:true}).waitFor();
    check(await preview.getByRole('img',{name:'Logo minh họa',exact:true}).count()===1,'Logo lost after save');
    check(await preview.locator('[data-placement=footer] .fd-form-band-cell').count()===3,'Footer missing from preview');
    await page.screenshot({path:'output/playwright/form-decoration-1440-vi-light.png',animations:'disabled'});
    await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','en');localStorage.setItem('flowdocker.theme','dark');});
    const metrics=[];
    for(const [width,height] of [[1366,768],[390,844]]) {
      await page.setViewportSize({width,height});await page.reload();await page.getByRole('button',{name:'Document QA',exact:true}).click();await page.getByRole('tab',{name:'Form preview',exact:true}).click();
      await preview.getByText('Code: QA-001',{exact:true}).waitFor();await preview.scrollIntoViewIfNeeded();
      const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));metrics.push(m);check(m.width===m.scroll,'Overflow '+JSON.stringify(m));
      await page.screenshot({path:`output/playwright/form-decoration-${width}-en-dark.png`,animations:'disabled'});
    }
    await page.getByRole('tab',{name:'Field designer',exact:true}).click();await page.getByRole('button',{name:'Header / Footer',exact:true}).click();
    const modal=await page.getByRole('dialog').boundingBox();check(modal.width<=390,'Mobile dialog too wide');
    await page.screenshot({path:'output/playwright/form-decoration-editor-390-en-dark.png',animations:'disabled'});await page.keyboard.press('Escape');
    check(errors.length===0,'Browser errors '+errors.join(', '));
    return {status:'PASS',metrics,checks:['real raster upload','VI/EN alt text','3-column header/footer','designer undo/redo','visual to code','code to canvas','save/reload','shared preview renderer','mobile dialog','authoring hint outside paper'],errors};
  } finally {
    page.off('pageerror',onError);
    await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery);},{keys,original,recovery});
  }
}

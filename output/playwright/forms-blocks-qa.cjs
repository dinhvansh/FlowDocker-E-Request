/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const field=(id,type,label)=>({id,key:id,type,label:{vi:label,en:label},required:false,options:[]});
  const form={id:'qa-blocks',title:{vi:'Mẫu khối nội dung',en:'Content blocks sample'},schemaVersion:2,version:1,status:'DRAFT',fields:[{...field('layout','columns','Nhóm gốc'),hideLabel:true,columns:2,children:[field('a','text','Nội dung A'),field('b','text','Nội dung B')]},field('tail','text','Cuối mẫu')]};
  const snapshot=async()=>page.evaluate(()=>JSON.parse(JSON.parse(sessionStorage.getItem('flowdocker.form-recovery.v1')).source));
  let lastDrop;
  const choose=async(label,name)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name,exact:true}).click();};
  const drag=async(source,target)=>{
    await source.scrollIntoViewIfNeeded();
    const start=await source.boundingBox();check(start,'Missing drag start');
    await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
    await page.mouse.move(start.x+start.width/2+12,start.y+start.height/2+8,{steps:3});
    await target.scrollIntoViewIfNeeded();
    const end=await target.boundingBox();check(end,'Missing drag target');
    await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:24});
    await page.waitForTimeout(250);
    const currentEnd=await target.boundingBox();
    await page.mouse.move(currentEnd.x+currentEnd.width/2,currentEnd.y+currentEnd.height/2,{steps:5});
    await page.waitForTimeout(150);
    lastDrop=await page.evaluate(({x,y})=>({point:{x,y},hit:document.elementFromPoint(x,y)?.outerHTML.slice(0,300),over:[...document.querySelectorAll('.fd-insertion-zone[data-over=true]')].map(n=>({edge:n.getAttribute('data-edge'),parent:n.parentElement.getAttribute('data-canvas-field')}))}),{x:currentEnd.x+currentEnd.width/2,y:currentEnd.y+currentEnd.height/2});
    await page.mouse.up();await page.waitForTimeout(250);
  };
  const palette=async(type,label,target)=>{await page.getByRole('searchbox',{name:'Tìm kiểu trường...',exact:true}).fill(type);await drag(page.getByRole('button',{name:`Kéo ${label} vào canvas`,exact:true}),target);};
  try {
    await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});if(sessionStorage.getItem('flowdocker.qa.blocks-reset')==='1'){sessionStorage.removeItem('flowdocker.form-recovery.v1');sessionStorage.removeItem('flowdocker.qa.blocks-reset');}});
    await page.evaluate(form=>{sessionStorage.setItem('flowdocker.qa.blocks-reset','1');localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},form);
    await page.reload();await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:form.title.vi,exact:true}).click();
    check(await page.getByRole('button',{name:'Đầu trang / Chân trang',exact:true}).count()===0,'Separate band toolbar remains');
    const canvas=page.locator('.fd-live-form');
    await palette('columns','Bố cục cột',canvas.locator(':scope > .fd-insertion-zone[data-edge=start]'));
    let f=await snapshot();check(f.fields.length===3&&f.fields[0].type==='columns'&&f.fields[1].id==='layout','Layout did not insert at start');
    const newLayoutId=f.fields[0].id;
    await choose('Trường trên mỗi hàng','1 trường');
    await palette('image','Hình ảnh',canvas.locator('[data-canvas-field=layout] > .fd-insertion-zone[data-edge=before]'));
    f=await snapshot();check(f.fields[1].type==='image'&&f.fields[2].id==='layout','Image did not insert before container '+JSON.stringify({lastDrop,fields:f.fields.map(x=>({id:x.id,type:x.type,children:x.children?.map(c=>c.type)}))}));
    const imageId=f.fields[1].id;
    await palette('content','Nhãn / Văn bản',canvas.locator('[data-canvas-field=a] > .fd-insertion-zone[data-edge=before]'));
    f=await snapshot();check(f.fields.find(x=>x.id==='layout').children[0].type==='content','Text did not insert inside columns');
    await palette('divider','Đường phân cách',canvas.locator(':scope > .fd-insertion-zone[data-edge=end]'));
    f=await snapshot();check(f.fields.at(-1).type==='divider','Divider did not insert at end');
    await drag(canvas.locator('[data-canvas-field=tail] > .fd-canvas-field-bar .fd-drag-handle'),canvas.locator(':scope > .fd-insertion-zone[data-edge=start]'));
    f=await snapshot();check(f.fields[0].id==='tail','Existing field did not move to start '+JSON.stringify(lastDrop));
    await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();f=await snapshot();check(f.fields.at(-2).id==='tail','Move undo failed');
    await page.getByRole('button',{name:'Làm lại',exact:true}).click();
    await canvas.locator(`[data-canvas-field="${imageId}"]`).getByRole('button',{name:'Chọn trường Hình ảnh',exact:true}).click();
    const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#e20e17';ctx.fillRect(0,0,320,100);ctx.fillStyle='white';ctx.font='bold 28px sans-serif';ctx.fillText('DEMO',110,60);return c.toDataURL('image/png').split(',')[1];});
    await page.getByLabel('Tải ảnh / Logo',{exact:true}).setInputFiles({name:'demo.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
    await page.waitForFunction(()=>!!document.querySelector('.fd-content-block img')?.naturalWidth);
    await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('Logo minh họa');await page.getByRole('textbox',{name:'Nhãn tiếng Anh',exact:true}).fill('Demo logo');
    await choose('Căn nội dung','Căn giữa');
    check(await canvas.locator('.fd-content-block[data-align=center] img').count()===1,'Image alignment failed');
    await palette('content','Nhãn / Văn bản',canvas.locator(`[data-canvas-field="${newLayoutId}"] > .fd-container-drop-zone`));
    f=await snapshot();check(f.fields.find(x=>x.id===newLayoutId).children.length===1,'Content did not drop into empty layout');
    await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('ĐỀ NGHỊ THANH TOÁN');
    await page.getByRole('textbox',{name:'Nhãn tiếng Anh',exact:true}).fill('PAYMENT REQUEST');
    await choose('Cỡ chữ nội dung','Tiêu đề lớn');await choose('Căn nội dung','Căn giữa');
    await page.getByRole('searchbox',{name:'Tìm kiểu trường...',exact:true}).fill('');
    await page.screenshot({path:'output/playwright/forms-blocks-1440-vi-light.png',animations:'disabled'});
    await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();await page.reload();
    const open=page.getByRole('button',{name:form.title.vi,exact:true});await open.waitFor();await open.click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    const preview=page.locator('.fd-form-preview');check(await preview.getByRole('img',{name:'Logo minh họa',exact:true}).count()===1,'Saved image missing');
    check(await preview.locator('.fd-content-divider').count()===1,'Saved divider missing');
    await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','en');localStorage.setItem('flowdocker.theme','dark');});
    const metrics=[];
    for(const [width,height] of [[1366,768],[390,844]]) {
      await page.setViewportSize({width,height});await page.reload();
      const heading=page.getByRole('heading',{name:form.title.en,exact:true}),entry=page.getByRole('button',{name:form.title.en,exact:true});await heading.or(entry).first().waitFor();if(await entry.isVisible())await entry.click();
      await page.getByRole('tab',{name:'Form preview',exact:true}).click();await preview.getByRole('img',{name:'Demo logo',exact:true}).waitFor();
      const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));metrics.push(m);check(m.width===m.scroll,'Page overflow');
      await page.screenshot({path:`output/playwright/forms-blocks-${width}-en-dark.png`,animations:'disabled'});
    }
    check(errors.length===0,'Browser errors: '+errors.join(', '));
    return {status:'PASS',checks:['real drag layout to start','image before container','text inside columns','divider to end','move existing to start','undo/redo','real raster upload','image alignment','save/reload','VI/light EN/dark mobile'],metrics,errors};
  } finally {
    page.off('pageerror',onError);
    await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery);},{keys,original,recovery});
  }
}

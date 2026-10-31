/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  page.on("dialog", dialog => dialog.accept());
  const keys=['flowdocker.form-drafts.v1','flowdocker.demo.entities.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys);
  const definition={id:'qa-master-source',title:{vi:'Danh mục minh họa',en:'Catalog example'},version:1,status:'DRAFT',schemaVersion:2,fields:[{id:'category',key:'category',type:'select',required:false,label:{vi:'Danh mục',en:'Category'},options:[{value:'manual',label:{vi:'Nhập tay mẫu',en:'Manual sample'}}]}]};
  const entity={id:'qa-catalog',key:'qa_catalog',name:'QA catalog',kind:'LOCAL_CATALOG',sourceOwner:'Demo',businessOwner:'Demo',scope:'TENANT',version:1,status:'PUBLISHED',fields:[{id:'code',key:'code',label:'Code',type:'text',required:true,classification:'INTERNAL'},{id:'name',key:'name',label:'Name',type:'text',required:true,classification:'PUBLIC'},{id:'secret',key:'secret',label:'Secret',type:'text',required:false,classification:'SENSITIVE'}],records:[{code:'A1',name:'Synthetic Alpha',secret:'PRIVATE'},{code:'B2',name:'Synthetic Beta'}]};
  const choose=async(label,option)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();};
  const shot=async(width,height,suffix)=>{await page.setViewportSize({width,height});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Page overflow');await page.screenshot({path:`output/playwright/forms-master-catalogs-${width}-${suffix}.png`,animations:'disabled'});};
  try {
    await page.evaluate(({definition,entity})=>{localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([definition]));localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify([entity]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},{definition,entity});
    await page.reload();await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Danh mục minh họa',exact:true}).click();
    await page.locator('[data-canvas-field="category"]').click();
    await choose('Nhóm thuộc tính','Dữ liệu');
    await choose('Nguồn dữ liệu','Master Data · QA catalog');
    await page.getByRole('combobox',{name:'Cột mã lưu',exact:true}).getByText('Code (code)',{exact:true}).waitFor();
    await page.getByRole('combobox',{name:'Cột tên hiển thị',exact:true}).click();
    if(await page.getByRole('option',{name:'Secret (secret)',exact:true}).count())throw Error('Sensitive column offered');
    await page.keyboard.press('Escape');
    await shot(1440,900,'vi-light');await shot(1366,768,'vi-light');
    await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('flowdocker.form-drafts.v1')).find(f=>f.id==='qa-master-source'));
    if(JSON.stringify(saved.fields[0].dataSource)!==JSON.stringify({provider:'master.qa-catalog',valueField:'code',labelField:'name'}))throw Error('Saved mapping incorrect');
    if(saved.fields[0].options.length!==1)throw Error('Master rows copied into schema');
    await page.reload();await page.getByRole('button',{name:'Danh mục minh họa',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    await choose('Danh mục','Synthetic Alpha');
    await page.getByRole('combobox',{name:'Danh mục',exact:true}).getByText('Synthetic Alpha',{exact:true}).waitFor();
    entity.records[0].name='Synthetic Updated';
    await page.evaluate(entity=>localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify([entity])),entity);
    await page.reload();await page.getByRole('button',{name:'Danh mục minh họa',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    await choose('Danh mục','Synthetic Updated');
    await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
    await page.locator('[data-canvas-field="category"]').click();await choose('Nhóm thuộc tính','Dữ liệu');
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await choose('Ngôn ngữ: Tiếng Việt','English');
    await shot(1366,768,'en-dark');
    await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'Field properties',exact:true}).click();
    await page.getByRole('combobox',{name:'Stored key column',exact:true}).waitFor();await shot(390,844,'en-dark');
    await choose('Data source','Manual choices');await page.getByRole('textbox',{name:'Bilingual options',exact:true}).waitFor();
    return {result:'PASS',checks:['master source and default mapping','sensitive column excluded','save/reopen mapping','runtime choices','updated master read without copied options','manual fallback','VI EN light dark 1440 1366 mobile']};
  } finally {
    const save=page.getByRole('button',{name:/^(Lưu bản nháp|Save draft)$/});
    if(await save.count() && await save.isEnabled()) {await save.click();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).some(b=>/^(Lưu bản nháp|Save draft)$/.test(b.textContent.trim())&&!b.disabled));}

    await page.evaluate(({keys,original})=>keys.forEach((key,i)=>original[i]===null?localStorage.removeItem(key):localStorage.setItem(key,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();
  }
}

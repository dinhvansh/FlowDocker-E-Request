/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys);
  const field=(id,type,vi,en,extra={})=>({id,key:id,type,label:{vi,en},required:false,options:[],...extra});
  const definition={id:'qa-config-indicators',title:{vi:'Cấu hình minh họa',en:'Configuration example'},version:1,status:'DRAFT',schemaVersion:2,fields:[
    field('plain','text','Trường thường','Plain field',{required:true}),
    field('source','select','Công ty mẫu','Demo company',{dataSource:{provider:'demo.companies'}}),
    field('amount','currency','Số tiền mẫu','Demo amount',{min:0,defaultValue:0}),
    field('total','currency','Tổng mẫu','Demo total',{calculation:{operator:'add',fields:['amount']}}),
    field('reason','textarea','Lý do mẫu','Demo reason',{visibleWhen:{mode:'all',conditions:[{field:'amount',operator:'gte',value:0}]}}),
    field('custom','text','Trường tùy chỉnh','Custom field',{customRenderer:'demo.control'}),
    field('group','columns','Nhóm mẫu','Demo group',{columns:2,children:[field('child','text','Trường con mẫu','Demo child',{defaultValue:false})]})
  ]};
  const choose=async(label,option)=>{
    await page.getByRole('combobox',{name:label,exact:true}).click();
    await page.getByRole('option',{name:option,exact:true}).click();
  };
  const canvas=(id)=>page.locator(`[data-canvas-field="${id}"]`);
  const indicator=(id,name)=>canvas(id).getByRole('button',{name,exact:true});
  const screenshot=async(width,height,suffix)=>{
    await page.setViewportSize({width,height});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`${width}: page overflow`);
    await page.screenshot({path:`output/playwright/forms-configuration-${width}-${suffix}.png`,animations:'disabled'});
  };
  try {
    await page.evaluate(definition=>{localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([definition]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},definition);
    await page.reload();
    await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Cấu hình minh họa',exact:true}).click();
    if(await canvas('plain').locator(':scope > .fd-field-configuration').count()) throw Error('Plain required field has extra badges');
    if(await canvas('group').locator(':scope > .fd-field-configuration').count()) throw Error('Parent inherits child configuration');
    await indicator('child','Mở cấu hình Dữ liệu cho Trường con mẫu').waitFor();
    await indicator('source','Mở cấu hình Dữ liệu cho Công ty mẫu').click();
    await page.getByRole('combobox',{name:'Nhóm thuộc tính',exact:true}).getByText('Dữ liệu',{exact:true}).waitFor();
    await indicator('total','Mở cấu hình Tính toán cho Tổng mẫu').click();
    await page.getByRole('combobox',{name:'Phép tính',exact:true}).waitFor();
    await choose('Phép tính','Không dùng');
    if(await canvas('total').locator(':scope > .fd-field-configuration').count()) throw Error('Calculation badge remains after removal');
    await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
    await indicator('total','Mở cấu hình Tính toán cho Tổng mẫu').waitFor();
    await indicator('custom','Mở cấu hình Nâng cao cho Trường tùy chỉnh').click();
    await page.getByRole('textbox',{name:'Mã bộ hiển thị tùy chỉnh',exact:true}).fill('');
    if(await canvas('custom').locator(':scope > .fd-field-configuration').count()) throw Error('Advanced badge remains after removal');
    await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
    await indicator('custom','Mở cấu hình Nâng cao cho Trường tùy chỉnh').waitFor();
    await indicator('reason','Mở cấu hình Điều kiện cho Lý do mẫu').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('combobox',{name:'Nhóm thuộc tính',exact:true}).getByText('Điều kiện và tính toán',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Xóa điều kiện',exact:true}).click();
    if(await canvas('reason').locator(':scope > .fd-field-configuration').count()) throw Error('Conditional badge remains after removal');
    await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
    await indicator('reason','Mở cấu hình Điều kiện cho Lý do mẫu').waitFor();
    await screenshot(1440,900,'vi-light');
    await screenshot(1366,768,'vi-light');
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    if(await page.locator('.fd-preview-paper .fd-field-configuration').count()) throw Error('Designer badges leaked into runtime');
    await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await choose('Ngôn ngữ: Tiếng Việt','English');
    await indicator('total','Open Calculation settings for Demo total').click();
    await screenshot(1440,900,'en-dark');
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('tab',{name:'Canvas',exact:true}).click();
    await indicator('source','Open Data settings for Demo company').click();
    await page.getByRole('combobox',{name:'Property category',exact:true}).waitFor();
    await screenshot(390,844,'en-dark');
    if(errors.length) throw Error(errors.join('\n'));
    return {result:'PASS',checks:['plain and parent no false positives','nested false default marked','data/calculation/advanced/conditions navigation','remove/undo clears/restores badges','keyboard','no runtime indicators','VI EN light dark','1440 1366 390 layout','mobile cue opens properties'],errors};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((key,index)=>original[index]===null?localStorage.removeItem(key):localStorage.setItem(key,original[index])),{keys,original});
    await page.setViewportSize({width:1440,height:900});
    await page.reload();
  }
}

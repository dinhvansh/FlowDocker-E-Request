/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const keys=['flowdocker.demo.entities.v1','flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const field=(key,label,type='text',required=false)=>({id:key,key,label,type,required,classification:'PUBLIC'});
 const entity={id:'qa_spacing',key:'qa_spacing',name:'qa_spacing',kind:'LOCAL_CATALOG',status:'DRAFT',version:1,scope:'TENANT',sourceOwner:'Demo',businessOwner:'Demo',fields:[field('code','Code','text',true),field('name','Name','text',true),field('active','Active','boolean'),field('date','Date','date')],records:[]};
 const form={id:'qa-spacing-form',title:{vi:'Biểu mẫu khoảng cách',en:'Spacing form'},version:1,status:'DRAFT',schemaVersion:2,fields:[{id:'plain',key:'plain',type:'text',label:{vi:'Nội dung mẫu',en:'Sample text'},required:true,options:[]}]};
 const measure=async(selector,gap,height)=>{
  await page.waitForTimeout(300); // Wait for the shared dialog entrance transform before geometry checks.
  const result=await page.locator(selector).first().evaluate(root=>{
   const fields=[...root.querySelectorAll(':scope > .fd-field')];
   return fields.map((f,i)=>{const rect=f.getBoundingClientRect();const children=[...f.children];const label=children.find(c=>c.getAttribute('data-slot')==='field-label');const control=children.find(c=>c.matches('input,[role=combobox],.fd-date-trigger'));
    const details=children.filter(c=>c.matches('[data-slot=field-description],[data-slot=field-error]'));const detailGaps=details.map(c=>c.getBoundingClientRect().top-c.previousElementSibling.getBoundingClientRect().bottom);
    return {detailGaps,margin:getComputedStyle(f).marginBottom,gap:i?rect.top-fields[i-1].getBoundingClientRect().bottom:null,labelGap:label&&control?control.getBoundingClientRect().top-label.getBoundingClientRect().bottom:null,height:control?.getBoundingClientRect().height};});
  });
  if(result.length<2)throw Error('Not enough fields: '+selector);
  for(const row of result){if(row.detailGaps.some(g=>Math.abs(g-6)>1))throw Error('Wrong helper/error gap '+JSON.stringify(row));if(row.margin!=='0px')throw Error('Field outer margin '+JSON.stringify(row));if(row.gap!==null && Math.abs(row.gap-gap)>1)throw Error('Wrong field gap '+JSON.stringify(row));if(row.labelGap!==null && Math.abs(row.labelGap-6)>1)throw Error('Wrong label gap '+JSON.stringify(row));if(row.height && Math.abs(row.height-height)>1)throw Error('Wrong control height '+JSON.stringify(row));}
  return result;
 };
 try {
  await page.evaluate(({entity,form})=>{localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify([entity]));localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},{entity,form});
  await page.goto('http://127.0.0.1:5174/#master');await page.reload();await page.setViewportSize({width:1440,height:900});await page.locator('.fd-entity-item').filter({hasText:'qa_spacing'}).click();
  const compact=await measure('.fd-inspector-form',12,32);
  await page.getByRole('textbox',{name:'Mã trường',exact:true}).fill('invalid key');const compactError=await measure('.fd-inspector-form',12,32);await page.getByRole('textbox',{name:'Mã trường',exact:true}).press('Escape');
  await page.getByRole('tab',{name:'Bản ghi (0)',exact:true}).click();await page.getByRole('button',{name:'Thêm bản ghi',exact:true}).click();
  const standard=await measure('[role=dialog] [data-slot=field-group]',16,36);
  await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('x');await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('');await page.getByText('Trường này là bắt buộc.',{exact:true}).waitFor();
  await measure('[role=dialog] [data-slot=field-group]',16,36);
  await page.screenshot({path:'output/playwright/spacing-1440-vi-light.png',animations:'disabled'});
  await page.getByRole('button',{name:'Hủy',exact:true}).click();await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  await page.setViewportSize({width:1366,height:768});await page.getByRole('button',{name:'Add record',exact:true}).click();await measure('[role=dialog] [data-slot=field-group]',16,36);await page.screenshot({path:'output/playwright/spacing-1366-en-dark.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});const mobile=await measure('[role=dialog] [data-slot=field-group]',16,44);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');await page.screenshot({path:'output/playwright/spacing-390-en-dark.png',animations:'disabled'});await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:5174/#forms');await page.getByRole('button',{name:'Spacing form',exact:true}).click();
  await page.locator('[data-canvas-field=plain]').click();
  const formInspector=await measure('.fd-form-properties [data-slot=field-group]',12,32);
  await page.screenshot({path:'output/playwright/spacing-forms-1440-en-dark.png',animations:'disabled'});
  return {result:'PASS',compact,compactError,standard,mobile,formInspector};
 } finally {await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:5174/#forms');await page.reload();}
}

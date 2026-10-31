/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const errors=[]; const onError=error=>errors.push(error.message);page.on('pageerror',onError);
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const field=(id,type='number',extra={})=>({id,key:id,type,label:{vi:id,en:id},required:false,options:[],...extra});
 const form={id:'demo-purchase-intake',title:{vi:'Hybrid QA',en:'Hybrid QA'},version:1,status:'DRAFT',schemaVersion:2,fields:[field('amount','number',{required:true}),field('qty','number',{defaultValue:2}),field('total','currency',{calculation:{operator:'multiply',fields:['amount','qty'],expression:'amount * qty'}}),field('department','text',{defaultValueSource:'currentUser.department'}),field('lines','repeat',{children:[field('description','text'),field('price','currency')]}),field('grand','currency',{calculation:{operator:'sum',fields:['lines.price'],expression:'SUM(lines.price)'}})]};
 const metrics=[];
 const put=async(text)=>{const e=page.getByRole('textbox',{name:'Schema biểu mẫu · Code Studio',exact:true});await e.click();await e.press('ControlOrMeta+A');await page.keyboard.insertText(text);};
 try {
  await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');});
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Đề nghị mua sắm · mẫu',exact:true}).click();
  await page.getByRole('tab',{name:'Code Studio',exact:true}).click();
  const editor=page.getByRole('textbox',{name:'Schema biểu mẫu · Code Studio',exact:true});await editor.waitFor();
  await put(JSON.stringify(form,null,2));await page.getByRole('heading',{name:'Hybrid QA',level:1}).waitFor();
  await page.waitForTimeout(600);
  await put('not JSON');
  if(!await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).isDisabled())throw Error('Save enabled on invalid code');
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await page.getByRole('tab',{name:'Code Studio',exact:true}).click();
  if((await editor.textContent()).trim()!=='not JSON')throw Error('Invalid draft lost across tabs');
  await editor.press('ControlOrMeta+z');await page.getByText('Đã đồng bộ với canvas',{exact:true}).waitFor();
  const completionSource=JSON.stringify(form,null,2).replace(`{
`,`{
  "orien": "portrait",
`);
  await put(completionSource);await editor.press('ControlOrMeta+Home');for(let i=0;i<10;i++)await editor.press('ArrowRight');
  await editor.press('ControlOrMeta+Space');await page.locator('.cm-tooltip-autocomplete').waitFor();await editor.press('Tab');
  await page.getByText('Đã đồng bộ với canvas',{exact:true}).waitFor();
  if(!(await page.locator('.cm-content').innerText()).includes('"orientation": "portrait"'))throw Error('Tab completion did not replace partial key');
  await editor.press('Escape');await editor.press('Tab');if(await editor.evaluate(e=>e===document.activeElement))throw Error('Keyboard focus trapped');
  await editor.press('ControlOrMeta+Home');await page.locator('.cm-line').filter({hasText:'"id": "amount"'}).click();
  await page.getByRole('tab',{name:'Thuộc tính trường',exact:true}).click();
  if(await page.getByRole('textbox',{name:'Mã trường',exact:true}).inputValue()!=='amount')throw Error('Code to inspector selection failed');
  await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('Số tiền QA');
  await page.getByText('Đã đồng bộ với canvas',{exact:true}).waitFor();
  await page.getByRole('tab',{name:'Thử dữ liệu',exact:true}).click();await page.getByText('Dữ liệu thử và kết quả tính toán',{exact:true}).click();
  await page.getByRole('textbox',{name:'Dữ liệu đầu vào JSON',exact:true}).fill(JSON.stringify({amount:7,lines:[{description:'A',price:10},{description:'B',price:15}]}));
  const results=JSON.parse(await page.getByRole('textbox',{name:'Kết quả sau mặc định và tính toán',exact:true}).inputValue());
  if(Number(results.total)!==14||Number(results.grand)!==25||!results.department)throw Error('Engine result mismatch '+JSON.stringify(results));
  await page.getByRole('textbox',{name:'Dữ liệu đầu vào JSON',exact:true}).fill('{');await page.getByText('Dữ liệu thử phải là đối tượng JSON hợp lệ trong giới hạn xử lý.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Đặt lại JSON',exact:true}).click();
  await page.getByText('Dùng AI hỗ trợ thiết kế',{exact:true}).click();await page.getByRole('textbox',{name:'Yêu cầu thay đổi cho AI',exact:true}).fill('Add a required note');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Tải ngữ cảnh AI',exact:true}).click();const download=await downloadPromise;await download.saveAs('output/playwright/code-studio-ai-context.md');
  await page.getByText('Dùng AI hỗ trợ thiết kế',{exact:true}).click();
  await page.getByRole('tab',{name:'Canvas',exact:true}).first().click();await page.getByRole('tab',{name:'Canvas',exact:true}).last().click();
  await editor.press('ControlOrMeta+Home');await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'output/playwright/code-studio-1440-vi-light.png',animations:'disabled'});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>window.scrollTo(0,0));
  await page.getByRole('textbox',{name:'Form schema · Code Studio',exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/code-studio-1366-en-dark.png',animations:'disabled'});
  for(const viewport of [{width:1440,height:900},{width:1366,height:768},{width:390,height:844}]) {
   await page.setViewportSize(viewport);await page.evaluate(()=>window.scrollTo(0,0));
   const metric=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('.fd-code-hint')).fontSize,family:getComputedStyle(document.querySelector('.fd-code-hint')).fontFamily,line:getComputedStyle(document.querySelector('.fd-code-hint')).lineHeight}));
   metrics.push(metric);if(metric.scroll>metric.width||metric.font!=='12px'||metric.line!=='18px'||!metric.family.includes('Inter'))throw Error('Layout/typography mismatch '+JSON.stringify(metric));
  }
  await page.screenshot({path:'output/playwright/code-studio-390-en-dark.png',animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('tab',{name:'Test data',exact:true}).click();await page.getByText('Test values and calculated results',{exact:true}).click();await page.screenshot({path:'output/playwright/code-studio-test-390-en-dark.png',animations:'disabled'});
  if(errors.length)throw Error('Browser errors '+errors.join('\n'));
  return {result:'PASS',metrics,engine:results,download:download.suggestedFilename(),checks:['live sync','invalid draft guard','undo','Tab completion replacement','keyboard escape','field selection','visual to code','calculation + aggregate + default','invalid test data recovery','AI download','VI/EN light/dark responsive','reduced motion'],errors};
 } finally {
  page.off('pageerror',onError);
  await page.evaluate(({keys,original})=>keys.forEach((key,index)=>original[index]===null?localStorage.removeItem(key):localStorage.setItem(key,original[index])),{keys,original});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:900});
 }
}
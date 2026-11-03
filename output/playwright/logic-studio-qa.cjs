/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys), recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(ok,m)=>{if(!ok)throw Error(m)};
 const field=(id,label,extra={})=>({id,key:id,label:{vi:label,en:label},type:'number',required:false,options:[],...extra});
 const form={id:'qa-logic',schemaVersion:2,title:{vi:'Logic QA',en:'Logic QA'},version:1,status:'DRAFT',fields:[field('qty','Quantity'),field('price','Price'),field('total','Total',{calculation:{operator:'multiply',fields:['qty','price'],precision:2}})]};
 try {
  await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});const fixture=sessionStorage.getItem('qa-logic-fixture');if(fixture){sessionStorage.setItem('flowdocker.form-recovery.v1',fixture);sessionStorage.removeItem('qa-logic-fixture')}});
  const results=[];
  for(const [width,height,locale,theme] of [[1440,900,'vi','light'],[1366,768,'en','dark'],[390,844,'en','dark']]) {
   await page.evaluate(({form,locale,theme})=>{localStorage.setItem('flowdocker.form-drafts.v1','[]');localStorage.setItem('flowdocker.locale',locale);localStorage.setItem('flowdocker.theme',theme);sessionStorage.setItem('qa-logic-fixture',JSON.stringify({version:1,definition:form,source:JSON.stringify(form),codeDirty:false}))},{form,locale,theme});await page.setViewportSize({width,height});await page.reload();
   await page.getByRole('tab',{name:locale==='vi'?'Điều kiện và tính toán':'Logic and calculations',exact:true}).click();
   const studio=page.locator('.fd-logic-studio');await studio.waitFor();await studio.locator('.fd-logic-list').getByRole('button',{name:/Total total/}).click();
   await studio.getByRole('tab',{name:locale==='vi'?'Phụ thuộc trường':'Field dependencies',exact:true}).click();
   await studio.locator('.fd-logic-links').getByRole('button',{name:/Quantity qty/}).click();
   check((await studio.locator('h3').textContent()).includes('Quantity'),'Dependency navigation failed');
   const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));console.log({width,metrics});if(metrics.width!==metrics.scroll){console.log(await page.locator('*').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().right>innerWidth+2).slice(-12).map(e=>({tag:e.tagName,cls:e.className,w:e.getBoundingClientRect().width}))));await page.screenshot({path:'output/playwright/logic-overflow.png'});}check(metrics.width===metrics.scroll,'Overflow');
   await page.screenshot({path:`output/playwright/logic-studio-${width}-${locale}-${theme}.png`,animations:'disabled'});
   await studio.getByRole('tab',{name:locale==='vi'?'Thử toàn biểu mẫu':'Test the entire form',exact:true}).click();
   await studio.getByText(locale==='vi'?'Dữ liệu thử và kết quả tính toán':'Test values and calculated results',{exact:true}).click();
   await studio.getByRole('textbox',{name:locale==='vi'?'Dữ liệu đầu vào JSON':'JSON input values',exact:true}).fill('{"qty":2,"price":15}');
   const output=studio.getByRole('textbox',{name:locale==='vi'?'Kết quả sau mặc định và tính toán':'Resolved defaults and calculations',exact:true});
   check((await output.inputValue()).includes('30.00'),'Wrong engine result'); results.push({width,locale,theme,...metrics});
  }
  check(!errors.length,errors.join(';'));console.log(JSON.stringify({results,errors}));
 } finally {await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>{if(original[i]===null)localStorage.removeItem(k);else localStorage.setItem(k,original[i])});if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery)},{keys,original,recovery});}
}

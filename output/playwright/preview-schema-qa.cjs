/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys), recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(ok,m)=>{if(!ok)throw Error(m)};
 const form={id:'qa-diagnostics',schemaVersion:2,title:{vi:'Bản khôi phục thử',en:'Recovered draft test'},version:1,status:'DRAFT',fields:[{id:'amount',key:'bad key',label:{vi:'Số tiền thử',en:'Test amount'},type:'number',required:false,options:[]}]};
 try {
  await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});const fixture=sessionStorage.getItem('qa-schema-fixture');if(fixture){sessionStorage.setItem('flowdocker.form-recovery.v1',fixture);sessionStorage.removeItem('qa-schema-fixture')}});
  const results=[];
  for(const [width,height,locale,theme] of [[1440,900,'vi','light'],[1366,768,'en','dark'],[390,844,'en','dark']]) {
   await page.evaluate(({form,locale,theme})=>{localStorage.setItem('flowdocker.locale',locale);localStorage.setItem('flowdocker.theme',theme);sessionStorage.setItem('qa-schema-fixture',JSON.stringify({version:1,definition:form,source:JSON.stringify(form),codeDirty:false}))},{form,locale,theme});
   await page.setViewportSize({width,height});await page.reload();await page.getByRole('tab',{name:locale==='vi'?'Xem thử biểu mẫu':'Form preview',exact:true}).click();
   const diagnostic=page.locator('.fd-preview-paper').getByRole('button').filter({hasText:'bad key'});await diagnostic.waitFor();check(await page.getByRole('button',{name:locale==='vi'?'Lưu bản nháp':'Save draft',exact:true}).isDisabled(),'Invalid draft save enabled');
   const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));check(m.width===m.scroll,'Overflow');await page.screenshot({path:`output/playwright/preview-schema-${width}-${locale}-${theme}.png`,animations:'disabled'});
   await diagnostic.click();
   if(width===390) await page.getByRole('tab',{name:'Field properties',exact:true}).click();
   const input=page.getByRole('textbox',{name:locale==='vi'?'Mã trường':'Field key',exact:true});await input.waitFor();check(await input.inputValue()==='bad key','Wrong field selected');await input.fill('amount');
   await page.getByRole('tab',{name:locale==='vi'?'Xem thử biểu mẫu':'Form preview',exact:true}).click();await page.locator('.fd-form-preview').waitFor();check(await page.locator('.fd-preview-paper').getByText('bad key',{exact:false}).count()===0,'Diagnostic persists after fix');
   const r=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('flowdocker.form-recovery.v1')));check(r.definition.fields[0].key==='amount','Recovered draft not preserved');results.push({width,locale,theme,...m});
  }
  check(!errors.length,errors.join(', '));return {status:'PASS',checks:['recovered draft','specific diagnostics','invalid save blocked','navigate to field','repair key resumes preview','recovery preserved'],results,errors};
 } catch(e) { return {status:"FAIL",error:e.message,body:await page.locator("body").innerText()}; } finally {await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery)},{keys,original,recovery})}
}

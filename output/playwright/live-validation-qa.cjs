/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
 const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys), recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(ok,m)=>{if(!ok)throw Error(m)};
 const form={id:'qa-live-validation',schemaVersion:2,title:{vi:'Kiểm tra cấu hình thử',en:'Live configuration test'},version:1,status:'DRAFT',fields:[{id:'columns',key:'columns',type:'columns',label:{vi:'Bố cục thử',en:'Test layout'},required:false,options:[],children:[{id:'child',key:'bad key',label:{vi:'Thông tin người đề nghị thanh toán trong trường hợp đặc biệt',en:'Payment requester details for a special business scenario'},type:'text',required:false,options:[]}]}]};
 try {
  await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});const fixture=sessionStorage.getItem('qa-live-fixture');if(fixture){sessionStorage.setItem('flowdocker.form-recovery.v1',fixture);sessionStorage.removeItem('qa-live-fixture')}});
  const results=[];
  for(const [width,height,locale,theme] of [[1440,900,'vi','light'],[1366,768,'en','dark'],[390,844,'en','dark']]) {
   await page.evaluate(({form,locale,theme})=>{localStorage.setItem('flowdocker.form-drafts.v1','[]');localStorage.setItem('flowdocker.locale',locale);localStorage.setItem('flowdocker.theme',theme);sessionStorage.setItem('qa-live-fixture',JSON.stringify({version:1,definition:form,source:JSON.stringify(form),codeDirty:false}))},{form,locale,theme});
   await page.setViewportSize({width,height});await page.reload();
   const label=locale==='vi'?'Kiểm tra cấu hình biểu mẫu':'Check form configuration';
   const toggle=page.getByRole('button',{name:label,exact:true});await toggle.waitFor();check((await toggle.innerText()).includes('1'),'Wrong live issue count');await toggle.focus();await toggle.press('Enter');
   const panel=page.getByRole('region',{name:label,exact:true});await panel.waitFor();const issue=panel.getByRole('button').filter({hasText:'bad key'});await issue.waitFor();
   const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));check(metrics.width===metrics.scroll,'Panel overflows');await page.screenshot({path:`output/playwright/live-validation-${width}-${locale}-${theme}.png`,animations:'disabled'});
   await issue.focus();await issue.press('Enter');const inspector=page.getByRole('complementary',{name:locale==='vi'?'Thuộc tính trường':'Field properties',exact:true});await inspector.waitFor();const input=page.getByRole('textbox',{name:locale==='vi'?'Mã trường':'Field key',exact:true});await input.waitFor();check(await input.inputValue()==='bad key','Wrong nested field');check(await inspector.evaluate(el=>el===document.activeElement),'Inspector not focused');
   if(width===390)await page.screenshot({path:'output/playwright/live-validation-390-inspector.png',animations:'disabled'});
   await input.fill('requester_details');await panel.getByRole('status').filter({hasText:locale==='vi'?'Cấu hình hợp lệ':'Configuration is valid'}).waitFor();check(await panel.getByRole('button').count()===0,'Old issue persists');
   const save=page.getByRole('button',{name:locale==='vi'?'Lưu bản nháp':'Save draft',exact:true});check(await save.isEnabled(),'Save remains blocked');await save.click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('flowdocker.form-drafts.v1')).find(f=>f.id==='qa-live-validation'));check(saved.fields[0].children[0].key==='requester_details','Nested repair not saved');
   await page.getByRole('tab',{name:locale==='vi'?'Xem thử biểu mẫu':'Form preview',exact:true}).click();await page.locator('.fd-form-preview').waitFor();results.push({width,locale,theme,...metrics});
  }
  check(!errors.length,errors.join(', '));return {status:'PASS',checks:['live count','keyboard panel toggle','nested field label','keyboard issue navigation','automatic inspector/focus on mobile','live resolution','save repaired form','preview'],results,errors};
 } catch(e) {return {status:'FAIL',error:e.message,overflow:await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(-20).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))})),body:await page.locator('body').innerText()}} finally {await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery)},{keys,original,recovery})}
}

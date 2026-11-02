/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const recoveryKey='flowdocker.form-recovery.v1';
  const originalRecovery=await page.evaluate(k=>sessionStorage.getItem(k),recoveryKey);
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  // The CLI pauses scripts at native dialogs. Suppress only the browser leave prompt for deliberate test reloads; pagehide/persistence still execute.
  const reload=()=>page.reload();
  const put=async (text,name='Schema biểu mẫu · Code Studio')=>{
    const editor=page.getByRole('textbox',{name,exact:true});await editor.click();await editor.press('ControlOrMeta+A');await page.keyboard.insertText(text);
  };
  try {
    await page.addInitScript(k=>{window.addEventListener('beforeunload',event=>event.stopImmediatePropagation(),{capture:true});if(sessionStorage.getItem('flowdocker.qa.recovery-reset')==='1'){sessionStorage.removeItem(k);sessionStorage.removeItem('flowdocker.qa.recovery-reset');}},recoveryKey);
    await page.evaluate(()=>{sessionStorage.setItem('flowdocker.qa.recovery-reset','1');localStorage.removeItem('flowdocker.form-drafts.v1');localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');});
    await reload();await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Đề nghị mua sắm · mẫu',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    await page.getByRole('textbox',{name:/Mục đích mua sắm/}).fill('RUNTIME-DO-NOT-RECOVER');
    await page.getByRole('tab',{name:'Code Studio',exact:true}).click();
    const editor=page.getByRole('textbox',{name:'Schema biểu mẫu · Code Studio',exact:true});await editor.waitFor();
    const schema={id:'demo-purchase-intake',version:1,status:'DRAFT',title:{vi:'Khôi phục QA',en:'Recovery QA'},fields:[{id:'purpose',key:'purpose',type:'textarea',required:false,options:[],label:{vi:'Mục đích',en:'Purpose'}}]};
    await put(JSON.stringify(schema,null,2));await page.getByRole('heading',{name:'Khôi phục QA',level:1}).waitFor();
    const unfinished='{\n  "title": {"vi": "dang go';await put(unfinished);
    await page.waitForFunction(k=>JSON.parse(sessionStorage.getItem(k)).source.includes('dang go'),recoveryKey);
    check(!await page.evaluate(k=>sessionStorage.getItem(k).includes('RUNTIME-DO-NOT-RECOVER'),recoveryKey),'Runtime values leaked');
    await reload();await editor.waitFor();
    check(await editor.innerText()===unfinished,'Unfinished code changed on reload');
    check(await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).isDisabled(),'Invalid source can be saved');
    check(await page.evaluate(()=>localStorage.getItem('flowdocker.form-drafts.v1'))===null,'Recovery silently saved catalog');
    await page.getByText('Đã khôi phục phiên chỉnh sửa trong tab này. Mã gõ dở được giữ nguyên; bản đã lưu chưa thay đổi.',{exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/form-recovery-1440-vi-light.png',animations:'disabled'});
    const metrics=[];
    await page.evaluate(()=>{localStorage.setItem('flowdocker.locale','en');localStorage.setItem('flowdocker.theme','dark');});
    for(const [width,height] of [[1366,768],[390,844]]) {
      await page.setViewportSize({width,height});await reload();
      const code=page.getByRole('textbox',{name:'Form schema · Code Studio',exact:true});await code.waitFor();
      check(await code.innerText()===unfinished,'Recovery lost on locale/mobile reload');
      const metric=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));metrics.push(metric);check(metric.width>=metric.scroll,'Horizontal overflow');
      await page.screenshot({path:`output/playwright/form-recovery-${width}-en-dark.png`,animations:'disabled'});
    }
    await page.getByRole('button',{name:'Discard recovery',exact:true}).click();
    await page.getByRole('button',{name:'Continue editing',exact:true}).click();
    check(await page.evaluate(k=>sessionStorage.getItem(k)!==null,recoveryKey),'Cancel discarded recovery');
    await put(JSON.stringify(schema,null,2),'Form schema · Code Studio');
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    check(await page.evaluate(k=>sessionStorage.getItem(k)===null,recoveryKey),'Save did not clear recovery');
    await reload();await page.getByRole('button',{name:'Recovery QA',exact:true}).waitFor();
    check(errors.length===0,'Browser errors: '+errors.join(', '));
    return {status:'PASS',metrics,checks:['exact invalid source reload','last valid canvas','save guard','no runtime input persistence','VI/EN light/dark','mobile','cancel discard','correct and save','recovery cleared'],errors};
  } finally {
    page.off('pageerror',onError);

    await page.evaluate(({keys,original,recoveryKey,originalRecovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(originalRecovery===null)sessionStorage.removeItem(recoveryKey);else sessionStorage.setItem(recoveryKey,originalRecovery);},{keys,original,recoveryKey,originalRecovery});
  }
}

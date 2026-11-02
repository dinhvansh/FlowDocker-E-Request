/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const recovery=await page.evaluate(()=>sessionStorage.getItem('flowdocker.form-recovery.v1'));
  const form={id:'qa-iso-removal',version:1,status:'DRAFT',title:{vi:'Kiểm tra số tiền',en:'Amount check'},fields:[{id:'amount',key:'amount',label:{vi:'Số tiền',en:'Amount'},type:'currency',required:false,options:[],min:0,currency:'USD'}]};
  try {
    await page.addInitScript(()=>{window.addEventListener('beforeunload',e=>e.stopImmediatePropagation(),{capture:true});if(sessionStorage.getItem('flowdocker.qa.iso-reset')==='1'){sessionStorage.removeItem('flowdocker.form-recovery.v1');sessionStorage.removeItem('flowdocker.qa.iso-reset');}});
    await page.evaluate(form=>{sessionStorage.setItem('flowdocker.qa.iso-reset','1');localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},form);
    await page.reload();await page.setViewportSize({width:1366,height:768});
    await page.getByRole('button',{name:'Kiểm tra số tiền',exact:true}).click();
    await page.getByRole('button',{name:'Chọn trường Số tiền',exact:true}).click();
    await page.getByRole('combobox',{name:'Nhóm thuộc tính',exact:true}).click();
    await page.getByRole('option',{name:'Kiểm tra dữ liệu',exact:true}).click();
    await page.getByRole('spinbutton',{name:'Giá trị nhỏ nhất',exact:true}).waitFor();
    if(await page.getByRole('textbox',{name:'Mã tiền tệ ISO',exact:true}).count())throw Error('ISO input remains');
    if(await page.locator('[data-canvas-field=amount]').getByText('USD',{exact:true}).count())throw Error('Currency badge remains in canvas');
    await page.screenshot({path:'output/playwright/remove-currency-badge-canvas.png',animations:'disabled'});
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    if(await page.locator('.fd-form-preview').getByText('USD',{exact:true}).count())throw Error('Currency badge remains in preview');
    await page.screenshot({path:'output/playwright/remove-currency-badge-preview.png',animations:'disabled'});
    return {status:'PASS',checks:['ISO input absent','numeric validation remains','currency badge absent in canvas and preview']};
  } finally {
    await page.evaluate(({keys,original,recovery})=>{keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i]));if(recovery===null)sessionStorage.removeItem('flowdocker.form-recovery.v1');else sessionStorage.setItem('flowdocker.form-recovery.v1',recovery);},{keys,original,recovery});
  }
}

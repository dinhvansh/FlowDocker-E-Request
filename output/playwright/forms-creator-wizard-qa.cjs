/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const key='flowdocker.form-drafts.v1';
  const original=await page.evaluate(key=>localStorage.getItem(key),key);
  const form={id:'qa-creator-wizard',title:{vi:'Mẫu nhiều bước',en:'Wizard sample'},version:1,status:'DRAFT',display:'wizard',fields:[
    {id:'creator',key:'creator',type:'text',label:{vi:'Người tạo',en:'Creator'},required:true,readOnly:true,options:[],defaultValueSource:'currentUser.name'},
    {id:'note',key:'note',type:'text',label:{vi:'Ghi chú bước hai',en:'Step two note'},required:false,options:[]},
  ]};
  try {
    await page.evaluate(({key,form})=>localStorage.setItem(key,JSON.stringify([form])),{key,form});await page.reload();
    await page.getByRole('button',{name:'Mẫu nhiều bước',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    await page.getByRole('button',{name:'Bước tiếp',exact:true}).click();
    await page.getByRole('textbox',{name:'Ghi chú bước hai',exact:true}).waitFor();
    return {result:'PASS',check:'required creator default advances to next wizard step'};
  } finally {
    await page.evaluate(({key,original})=>original===null?localStorage.removeItem(key):localStorage.setItem(key,original),{key,original});await page.reload();
  }
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const keys=['flowdocker.demo.entities.v1','flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const entity=id=>({id,key:id,name:id,kind:'LOCAL_CATALOG',status:'DRAFT',version:1,scope:'TENANT',sourceOwner:'Demo',businessOwner:'Demo',fields:[],records:[]});
  const entities=[entity('qa_empty_catalog'),entity('qa_linked_catalog')];
  const form={id:'qa-linked-form',title:{vi:'Mẫu tham chiếu',en:'Referenced sample'},version:1,status:'DRAFT',fields:[{id:'choice',key:'choice',type:'select',label:{vi:'Lựa chọn',en:'Choice'},required:false,options:[],dataSource:{provider:'master.qa_linked_catalog',valueField:'code',labelField:'name'}}]};
  try {
    await page.evaluate(({entities,form})=>{localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify(entities));localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([form]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},{entities,form});
    await page.goto('http://127.0.0.1:5174/#master');await page.reload();await page.setViewportSize({width:1440,height:900});
    await page.locator('.fd-entity-item').filter({hasText:'qa_empty_catalog'}).click();
    await page.getByRole('button',{name:'Xóa entity',exact:true}).click();
    await page.getByRole('button',{name:'Hủy',exact:true}).click();
    if(!(await page.locator('.fd-entity-item').filter({hasText:'qa_empty_catalog'}).count()))throw Error('Cancel removed entity');
    await page.getByRole('button',{name:'Xóa entity',exact:true}).click();
    await page.screenshot({path:'output/playwright/master-delete-1440-vi.png',animations:'disabled'});
    await page.getByRole('button',{name:'Xác nhận xóa entity',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    if(await page.locator('.fd-entity-item').filter({hasText:'qa_empty_catalog'}).count())throw Error('Deleted entity visible');
    await page.reload();
    if(await page.locator('.fd-entity-item').filter({hasText:'qa_empty_catalog'}).count())throw Error('Entity returned after reload');
    await page.locator('.fd-entity-item').filter({hasText:'qa_linked_catalog'}).click();
    await page.getByRole('button',{name:'Xóa entity',exact:true}).click();
    await page.getByText('Danh mục đang được biểu mẫu sử dụng. Đổi nguồn dữ liệu của trường trước khi xóa.',{exact:true}).waitFor();
    if(!(await page.getByRole('button',{name:'Xác nhận xóa entity',exact:true}).isDisabled()))throw Error('Dependency not blocked');
    await page.getByRole('button',{name:'Hủy',exact:true}).click();
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
    await page.getByRole('button',{name:'Delete entity',exact:true}).click();
    await page.setViewportSize({width:1366,height:768});await page.screenshot({path:'output/playwright/master-delete-1366-en-dark.png',animations:'disabled'});
    await page.setViewportSize({width:390,height:844});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
    await page.screenshot({path:'output/playwright/master-delete-390-en-dark.png',animations:'disabled'});
    return {result:'PASS',checks:['cancel','delete empty draft','persists after reload','referenced form blocks deletion','VI EN light dark 1440 1366 mobile']};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();
  }
}

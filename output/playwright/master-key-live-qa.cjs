/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const keys=['flowdocker.demo.entities.v1','flowdocker.locale','flowdocker.theme'];
 const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const field=(id,key)=>({id,key,label:id,type:'text',required:false,classification:'PUBLIC'});
 const entity={id:'qa_live_key',key:'qa_live_key',name:'qa_live_key',kind:'LOCAL_CATALOG',status:'DRAFT',version:1,scope:'TENANT',sourceOwner:'Demo',businessOwner:'Demo',fields:[field('name','currency_name'),field('code','currency_code')],records:[]};
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('flowdocker.demo.entities.v1')).find(e=>e.id==='qa_live_key').fields[0].key);
 try {
  await page.evaluate(entity=>{localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify([entity]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},entity);
  await page.reload(); await page.setViewportSize({width:1440,height:900});
  await page.locator('.fd-entity-item').filter({hasText:'qa_live_key'}).click();
  const input=page.getByRole('textbox',{name:'Mã trường',exact:true});
  await input.fill('currency name');
  if(await input.getAttribute('aria-invalid')!=='true')throw Error('No live error');
  if(await stored()!=='currency_name')throw Error('Invalid draft saved');
  await page.screenshot({path:'output/playwright/master-key-1440-vi.png',animations:'disabled'});
  await input.press('Tab'); if(await stored()!=='currency_name')throw Error('Invalid blur saved');
  await input.fill('currency_code'); await page.getByText('Mã trường đã tồn tại trong danh mục.',{exact:true}).waitFor();
  await input.press('Enter'); if(await stored()!=='currency_name')throw Error('Duplicate saved');
  await input.fill(''); if(await input.getAttribute('aria-invalid')!=='true')throw Error('Empty accepted');
  await input.press('Escape'); if(await input.inputValue()!=='currency_name')throw Error('Escape failed');
  await input.fill('currency_label'); await input.press('Enter'); await page.waitForFunction(()=>JSON.parse(localStorage.getItem('flowdocker.demo.entities.v1')).find(e=>e.id==='qa_live_key').fields[0].key==='currency_label');
  await page.reload(); if(await page.getByRole('textbox',{name:'Mã trường',exact:true}).inputValue()!=='currency_label')throw Error('Correction lost');
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  await page.getByRole('textbox',{name:'Field key',exact:true}).fill('Bad key');
  await page.setViewportSize({width:1366,height:768});await page.screenshot({path:'output/playwright/master-key-1366-en-dark.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
  await page.getByRole('textbox',{name:'Field key',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/master-key-390-en-dark.png',animations:'disabled'});
  return {result:'PASS',checks:['immediate format/empty/duplicate errors','invalid never persisted','Escape','valid Enter and reload persistence','VI EN light dark 1440 1366 mobile']};
 } finally {
  await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();
 }
}

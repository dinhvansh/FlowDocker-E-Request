/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const keys=['flowdocker.demo.entities.v1','flowdocker.locale','flowdocker.theme'];const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
 const field=(key,label,type='text',required=false)=>({id:key,key,label,type,required,classification:'PUBLIC'});
 const base={kind:'LOCAL_CATALOG',status:'PUBLISHED',version:4,scope:'TENANT',sourceOwner:'Demo',businessOwner:'Demo'};
 const group={...base,id:'qa_groups',key:'qa_groups',name:'qa_groups',fields:[field('code','Code', 'text',true),field('name','Name','text',true)],records:[{code:'G1',name:'Group one'}]};
 const entity={...base,id:'qa_records',key:'qa_records',name:'qa_records',fields:[field('code','Code','text',true),field('name','Name','text',true),field('amount','Amount','number'),field('active','Active','boolean'),field('date','Date','date'),{...field('group','Group','reference'),referenceEntity:'qa_groups'}],records:[{code:'A',name:'Alpha',amount:1.5,active:true,date:'2026-10-01',group:'G1'},{code:'B',name:'Beta'}]};
 const external={...entity,id:'qa_external',key:'qa_external',name:'qa_external',kind:'EXTERNAL_MIRROR'};
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('flowdocker.demo.entities.v1')).find(e=>e.id==='qa_records'));
 const openRecords=async(name)=>{await page.locator('.fd-entity-item').filter({hasText:name}).click();await page.getByRole('tab',{name:/^(Bản ghi|Records)/}).click();};
 try {
  await page.evaluate(entities=>{localStorage.setItem('flowdocker.demo.entities.v1',JSON.stringify(entities));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},[entity,group,external]);
  await page.goto('http://127.0.0.1:5174/#master');await page.reload();await page.setViewportSize({width:1440,height:900});await openRecords('qa_records');
  await page.getByRole('button',{name:'Sửa bản ghi A',exact:true}).click();
  await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('');await page.getByText('Trường này là bắt buộc.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Lưu bản ghi',exact:true}).click();if((await saved()).records[0].name!=='Alpha')throw Error('Invalid saved');
  await page.screenshot({path:'output/playwright/master-records-1440-vi.png',animations:'disabled'});
  await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('Updated Alpha');
  const amount=page.getByRole('textbox',{name:'Amount',exact:true});await amount.fill('12.');if(await amount.inputValue()!=='12.')throw Error('Decimal typing broken');await amount.fill('12.75');
  await page.getByRole('combobox',{name:'Active',exact:true}).click();await page.getByRole('option',{name:'Để trống',exact:true}).click();await page.getByRole('combobox',{name:'Active',exact:true}).click();await page.getByRole('option',{name:'Không',exact:true}).click();
  await page.getByRole('button',{name:'Date',exact:true}).click();await page.getByRole('button',{name:'Xóa ngày',exact:true}).click();await page.getByRole('button',{name:'Date',exact:true}).click();await page.getByRole('button',{name:'Hôm nay',exact:true}).click();
  await page.getByRole('button',{name:'Lưu bản ghi',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  let stored=await saved();if(stored.records[0].amount!==12.75||stored.records[0].active!==false||stored.status!=='PUBLISHED'||stored.version!==4)throw Error('Typed update/status failed');
  await page.getByRole('button',{name:'Sửa bản ghi A',exact:true}).click();await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('discard');await page.getByRole('button',{name:'Hủy',exact:true}).click();if((await saved()).records[0].name!=='Updated Alpha')throw Error('Cancel saved');
  await page.getByRole('button',{name:'Thêm bản ghi',exact:true}).click();await page.getByRole('textbox',{name:'Code (bắt buộc)',exact:true}).fill('A');await page.getByText('Mã bản ghi đã tồn tại.',{exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Code (bắt buộc)',exact:true}).fill('C');await page.getByRole('textbox',{name:'Name (bắt buộc)',exact:true}).fill('Gamma');
  await page.getByRole('combobox',{name:'Group',exact:true}).click();await page.getByRole('option',{name:'Để trống',exact:true}).click();await page.getByRole('combobox',{name:'Group',exact:true}).click();await page.getByRole('option',{name:'Group one',exact:true}).click();
  await page.getByRole('button',{name:'Lưu bản ghi',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});if((await saved()).records[2].group!=='G1')throw Error('Reference create failed');
  await page.reload();await openRecords('qa_records');await page.getByRole('button',{name:'Xóa bản ghi C',exact:true}).click();await page.getByRole('button',{name:'Hủy',exact:true}).click();if((await saved()).records.length!==3)throw Error('Cancel deleted');
  await page.getByRole('button',{name:'Xóa bản ghi C',exact:true}).click();await page.getByRole('button',{name:'Xác nhận xóa bản ghi',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});if((await saved()).records.length!==2)throw Error('Delete failed');
  await openRecords('qa_groups');await page.getByRole('button',{name:'Xóa bản ghi G1',exact:true}).click();await page.getByRole('button',{name:'Xác nhận xóa bản ghi',exact:true}).click();await page.getByText('Bản ghi đang được tham chiếu. Gỡ tham chiếu trước khi xóa hoặc đổi mã.',{exact:true}).waitFor();await page.getByRole('button',{name:'Hủy',exact:true}).click();
  await openRecords('qa_external');if(await page.getByRole('button',{name:'Thêm bản ghi',exact:true}).count())throw Error('External editable');
  await openRecords('qa_records');await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();
  await page.setViewportSize({width:1366,height:768});await page.screenshot({path:'output/playwright/master-records-1366-en-dark.png',animations:'disabled'});
  await page.getByRole('button',{name:'Edit record A',exact:true}).click();await page.getByRole('textbox',{name:'Name (required)',exact:true}).fill('Stale draft');
  await page.evaluate(()=>{const k='flowdocker.demo.entities.v1';const e=JSON.parse(localStorage.getItem(k));e.find(e=>e.id==='qa_records').records[0].name='Other tab';localStorage.setItem(k,JSON.stringify(e));});
  await page.getByRole('button',{name:'Save record',exact:true}).click();await page.getByRole('alert').waitFor();if((await saved()).records[0].name!=='Other tab')throw Error('Stale overwrote storage');
  await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');await page.screenshot({path:'output/playwright/master-records-390-en-dark.png',animations:'disabled'});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.reload();await openRecords('qa_records');if(!(await page.getByRole('cell',{name:'Other tab',exact:true}).count()))throw Error('Reload lost latest');
  return {result:'PASS',checks:['required/duplicate live validation','edit decimal/boolean/reference','create','cancel edit/delete','confirm delete','reload persistence','published status unchanged','external read-only','stale writes blocked','VI EN light dark 1440 1366 mobile']};
 } finally {await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();}
}

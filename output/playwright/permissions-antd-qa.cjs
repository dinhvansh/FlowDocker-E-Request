/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.reload();
  await page.setViewportSize({width:1440,height:900});
  const original=await page.evaluate(()=>localStorage.getItem('flowdocker.demo.roles.v1'));
  const choose=async(label,option)=>{
    await page.getByRole('combobox',{name:label,exact:true}).click();
    await page.getByRole('option',{name:option,exact:true}).click();
  };
  try {
    await page.getByText('Ant Design · bản thử',{exact:true}).waitFor();
    const search=page.getByRole('searchbox',{name:'Tìm vai trò...',exact:true});
    await search.fill('no-match');
    await page.getByText('Không tìm thấy vai trò',{exact:true}).waitFor();
    await search.fill('');
    await page.getByRole('menuitem',{name:/Manager/}).click();
    await page.getByRole('heading',{name:'Manager',exact:true}).waitFor();
    await page.getByRole('menuitem',{name:/Data Steward/}).click();
    const grant=page.getByRole('checkbox',{name:'Loại tài sản: Tạo',exact:true});
    const before=await grant.isChecked();
    await grant.setChecked(!before);
    if(await grant.isChecked()===before) throw Error('Grant not updated');
    await grant.setChecked(before);
    await choose('Phạm vi dữ liệu','Bản ghi của mình');
    const trigger=page.getByRole('button',{name:'Mô phỏng truy cập',exact:true});
    await trigger.focus();
    await page.keyboard.press('Enter');
    const simulation=page.getByRole('dialog',{name:'Mô phỏng truy cập',exact:true});
    await simulation.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await simulation.getByText('Không phải chủ sở hữu',{exact:true}).waitFor();
    await simulation.getByRole('checkbox',{name:'Chủ sở hữu bản ghi',exact:true}).check();
    await simulation.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await simulation.getByText('Đạt các điều kiện của mô phỏng',{exact:true}).waitFor();
    await simulation.getByRole('checkbox',{name:'Cùng tenant',exact:true}).uncheck();
    await simulation.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await simulation.getByText('Khác tenant',{exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/permissions-antd-simulation-1440.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await simulation.waitFor({state:'hidden'});
    if(!(await trigger.evaluate(el=>el===document.activeElement))) throw Error('Modal focus not restored');
    await choose('Phạm vi dữ liệu','Công ty');
    await page.getByRole('tab',{name:'Bảo vệ trường',exact:true}).click();
    await choose('Quyền với vendor.bank_account','Từ chối');
    await choose('Quyền với vendor.bank_account','Che giá trị');
    await page.getByRole('tab',{name:'Phiên bản',exact:true}).click();
    await page.getByText('Bản nháp hiện tại · trình duyệt này',{exact:true}).waitFor();
    await page.getByRole('tab',{name:'Quyền thao tác',exact:true}).click();
    await page.getByRole('button',{name:'Tạo vai trò',exact:true}).click();
    const create=page.getByRole('dialog',{name:'Tạo vai trò',exact:true});
    if(!(await create.getByRole('button',{name:'Tạo bản nháp',exact:true}).isDisabled())) throw Error('Empty role allowed');
    await create.getByRole('button',{name:'Hủy',exact:true}).click();
    await create.waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Tạo vai trò',exact:true}).click();
    await create.getByRole('textbox',{name:'Tên vai trò',exact:true}).fill('Ant QA role');
    await create.getByRole('button',{name:'Tạo bản nháp',exact:true}).click();
    await page.getByRole('heading',{name:'Ant QA role',exact:true}).waitFor();
    if(await page.getByRole('checkbox',{checked:true}).count()) throw Error('New role has grants');
    await page.evaluate(value=>{if(value===null)localStorage.removeItem('flowdocker.demo.roles.v1');else localStorage.setItem('flowdocker.demo.roles.v1',value);},original);
    await page.reload();
    await page.getByText('Ant Design · bản thử',{exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/permissions-antd-1440-vi-light.png',animations:'disabled'});
    await page.setViewportSize({width:1366,height:768});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('1366 overflow');
    await page.screenshot({path:'output/playwright/permissions-antd-1366-vi-light.png',animations:'disabled'});
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
    await page.getByRole('option',{name:'English',exact:true}).click();
    await page.getByText('Ant Design · preview',{exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/permissions-antd-1366-en-dark.png',animations:'disabled'});
    await page.setViewportSize({width:390,height:844});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile overflow');
    await page.screenshot({path:'output/playwright/permissions-antd-390-en-dark.png',animations:'disabled',fullPage:true});
    await page.getByRole('button',{name:'Simulate access',exact:true}).click();
    const mobile=page.getByRole('dialog',{name:'Simulate access',exact:true});
    await mobile.getByRole('button',{name:'Run simulation',exact:true}).click();
    await page.screenshot({path:'output/playwright/permissions-antd-simulation-390-en-dark.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await mobile.waitFor({state:'hidden'});
    if(errors.length)throw Error(errors.join('\n'));
    return {result:'PASS',checks:['role search and selection','grant and scope edits','owner and tenant simulation','field masking','versions','create/cancel/zero grants','keyboard modal focus','VI/EN light/dark 1440/1366/390'],errors};
  } finally {
    await page.evaluate(value=>{if(value===null)localStorage.removeItem('flowdocker.demo.roles.v1');else localStorage.setItem('flowdocker.demo.roles.v1',value);},original);
    await page.setViewportSize({width:1440,height:900});
    if(await page.getByRole('button',{name:'Switch to light theme',exact:true}).count())await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
    if(await page.getByRole('combobox',{name:'Language: English',exact:true}).count()){
      await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
      await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
    }
    await page.reload();
  }
}

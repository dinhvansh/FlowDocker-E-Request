/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.reload();
  await page.setViewportSize({width:1440,height:900});
  const original=await page.evaluate(()=>localStorage.getItem('flowdocker.demo.roles.v1'));
  const choose=async(label,option)=>{
    await page.getByRole('combobox',{name:label,exact:true}).click();
    await page.getByRole('option',{name:option,exact:true}).click();
  };
  try {
    await page.getByRole('heading',{name:'Phân quyền',exact:true}).waitFor();
    const roles=page.getByRole('complementary',{name:'Vai trò',exact:true});
    await page.getByRole('searchbox',{name:'Tìm vai trò...',exact:true}).fill('nothing-matches');
    await page.getByText('Không tìm thấy vai trò',{exact:true}).waitFor();
    await page.getByRole('searchbox',{name:'Tìm vai trò...',exact:true}).fill('');
    await roles.getByRole('button',{name:/^Manager/}).click();
    await page.getByRole('heading',{name:'Manager',exact:true}).waitFor();
    await roles.getByRole('button',{name:/^Data Steward/}).click();
    const grant=page.getByRole('checkbox',{name:'Loại tài sản: Tạo',exact:true});
    const before=await grant.isChecked();
    await grant.setChecked(!before);
    if(await grant.isChecked()===before) throw Error('Grant did not change');
    await grant.setChecked(before);
    await choose('Phạm vi dữ liệu','Bản ghi của mình');
    await page.getByRole('button',{name:'Mô phỏng truy cập',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Mô phỏng truy cập',exact:true});
    await dialog.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await dialog.getByText('Không phải chủ sở hữu',{exact:true}).waitFor();
    await dialog.getByRole('checkbox',{name:'Chủ sở hữu bản ghi',exact:true}).check();
    await dialog.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await dialog.getByText('Đạt các điều kiện của mô phỏng',{exact:true}).waitFor();
    await dialog.getByRole('checkbox',{name:'Cùng tenant',exact:true}).uncheck();
    await dialog.getByRole('button',{name:'Chạy mô phỏng',exact:true}).click();
    await dialog.getByText('Khác tenant',{exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/permissions-simulation-1440.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    if(!(await page.getByRole('button',{name:'Mô phỏng truy cập',exact:true}).evaluate(el=>el===document.activeElement))) throw Error('Keyboard focus was lost');
    await choose('Phạm vi dữ liệu','Công ty');
    await page.getByRole('tab',{name:'Bảo vệ trường',exact:true}).click();
    await choose('Quyền với vendor.bank_account','Từ chối');
    await choose('Quyền với vendor.bank_account','Che giá trị');
    await page.getByRole('tab',{name:'Phiên bản',exact:true}).click();
    await page.getByText('Bản nháp hiện tại · trình duyệt này',{exact:true}).waitFor();
    await page.getByRole('tab',{name:'Quyền thao tác',exact:true}).click();
    await page.getByRole('button',{name:'Tạo vai trò',exact:true}).click();
    const create=page.getByRole('dialog',{name:'Tạo vai trò',exact:true});
    if(!(await create.getByRole('button',{name:'Tạo bản nháp',exact:true}).isDisabled())) throw Error('Empty name accepted');
    await create.getByRole('button',{name:'Hủy',exact:true}).click();
    await page.getByRole('button',{name:'Tạo vai trò',exact:true}).click();
    await page.getByRole('textbox',{name:'Tên vai trò',exact:true}).fill('UX QA role');
    await page.getByRole('button',{name:'Tạo bản nháp',exact:true}).click();
    await page.getByRole('heading',{name:'UX QA role',exact:true}).waitFor();
    if(await page.getByRole('checkbox',{checked:true}).count()) throw Error('New role received grants');
    await page.evaluate(value=>{ if(value===null) localStorage.removeItem('flowdocker.demo.roles.v1'); else localStorage.setItem('flowdocker.demo.roles.v1',value); },original);
    await page.reload();
    await roles.getByRole('button',{name:/^Data Steward/}).click();
    await page.screenshot({path:'output/playwright/permissions-after-1440-vi-light.png',animations:'disabled'});
    await page.setViewportSize({width:1366,height:768});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('1366 overflow');
    await page.screenshot({path:'output/playwright/permissions-after-1366-vi-light.png',animations:'disabled'});
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
    await page.getByRole('option',{name:'English',exact:true}).click();
    await page.getByRole('button',{name:'Simulate access',exact:true}).waitFor();
    await page.screenshot({path:'output/playwright/permissions-after-1366-en-dark.png',animations:'disabled'});
    await page.setViewportSize({width:390,height:844});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile overflow');
    await page.screenshot({path:'output/playwright/permissions-after-390-en-dark.png',animations:'disabled'});
    await page.getByRole('button',{name:'Simulate access',exact:true}).click();
    const mobile=page.getByRole('dialog',{name:'Simulate access',exact:true});
    await mobile.getByRole('button',{name:'Run simulation',exact:true}).click();
    await page.screenshot({path:'output/playwright/permissions-simulation-390-en-dark.png',animations:'disabled'});
    await page.keyboard.press('Escape');
    if(errors.length) throw Error(errors.join('\n'));
    return {result:'PASS',checks:['search and role selection','grant persistence','scope changes','deny owner / allow owner / deny other tenant','field masking','versions','create cancel and no default grants','VI EN light dark desktop mobile'],errors};
  } finally {
    await page.evaluate(value=>{
      if(value===null) localStorage.removeItem('flowdocker.demo.roles.v1');
      else localStorage.setItem('flowdocker.demo.roles.v1',value);
    },original);
    await page.setViewportSize({width:1440,height:900});
    if(await page.getByRole('button',{name:'Switch to light theme',exact:true}).count()) await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
    if(await page.getByRole('combobox',{name:'Language: English',exact:true}).count()) {
      await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
      await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
    }
    await page.reload();
  }
}

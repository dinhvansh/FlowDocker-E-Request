/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const keys = ['flowdocker.demo.roles.v1', 'flowdocker.locale', 'flowdocker.theme'];
  const original = await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys);
  const choose = async (label, value) => {
    await page.getByRole('combobox', {name: label, exact: true}).click();
    await page.getByRole('option', {name: value, exact: true}).click();
  };
  const shot = async (name, width, height) => {
    await page.setViewportSize({width, height});
    if(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`${width}: document overflow`);
    await page.screenshot({path: `output/playwright/permissions-fields-${name}.png`, animations: 'disabled'});
  };
  const dialog = page.getByRole('dialog', {name: 'Mô phỏng truy cập', exact: true});
  const run = () => dialog.getByRole('button', {name: 'Chạy mô phỏng', exact: true}).click();
  try {
    await page.evaluate(() => { localStorage.removeItem('flowdocker.demo.roles.v1'); localStorage.setItem('flowdocker.locale','vi'); localStorage.setItem('flowdocker.theme','light'); });
    await page.reload();
    await page.setViewportSize({width:1440,height:900});
    await page.getByRole('tab', {name:'Bảo vệ trường',exact:true}).click();
    await choose('Quyền với Tên nhà cung cấp', 'Cho xem');
    await page.getByText('Đã lưu bản nháp vai trò trong trình duyệt',{exact:true}).waitFor();
    await page.reload();
    await page.getByRole('tab', {name:'Bảo vệ trường',exact:true}).click();
    if(await page.getByRole('combobox',{name:'Quyền với Tên nhà cung cấp',exact:true}).innerText() !== 'Cho xem') throw Error('Field policy not persisted');
    await shot('1440-vi-light',1440,900);
    await shot('1366-vi-light',1366,768);
    await choose('Tài nguyên chứa trường','Yêu cầu thanh toán');
    await page.getByRole('combobox',{name:'Quyền với Số tiền',exact:true}).waitFor();
    await choose('Tài nguyên chứa trường','Nhà cung cấp');
    await page.getByRole('button',{name:'Mô phỏng truy cập',exact:true}).click();
    await choose('Tài nguyên','Nhà cung cấp');
    await run();
    const output=dialog.getByRole('region',{name:'Dữ liệu mẫu sau phân quyền',exact:true});
    await output.getByText('SYNTHETIC VENDOR',{exact:true}).waitFor();
    await output.getByText('••••',{exact:true}).waitFor();
    if((await output.innerText()).includes('SYNTHETIC-ACCOUNT-001')) throw Error('Masked sample leaked');
    await shot('simulation-1440-vi-light',1440,900);
    await dialog.getByRole('checkbox',{name:'Cùng tenant',exact:true}).uncheck();
    if(await output.count()) throw Error('Stale projection after context edit');
    await run();
    if(await output.getByText('Không trả về',{exact:true}).count() !== 2) throw Error('Denied context exposed fields');
    await dialog.getByRole('checkbox',{name:'Cùng tenant',exact:true}).check();
    await choose('Hành động','Xuất');
    await run();
    if(await output.getByText('Không trả về',{exact:true}).count() !== 2) throw Error('Missing export grant exposed fields');
    await page.keyboard.press('Escape');
    await choose('Quyền với Tài khoản ngân hàng','Cho xem');
    await page.getByRole('button',{name:'Mô phỏng truy cập',exact:true}).click();
    await choose('Hành động','Xem');
    await run();
    await output.getByText('SYNTHETIC-ACCOUNT-001',{exact:true}).waitFor();
    await page.keyboard.press('Escape');
    await choose('Quyền với Tài khoản ngân hàng','Từ chối');
    await page.getByRole('button',{name:'Mô phỏng truy cập',exact:true}).click();
    await run();
    await output.getByText('Không trả về',{exact:true}).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await choose('Ngôn ngữ: Tiếng Việt','English');
    await page.getByRole('tab',{name:'Field protection',exact:true}).waitFor();
    await shot('1366-en-dark',1366,768);
    await shot('390-en-dark',390,844);
    await page.getByRole('button',{name:'Simulate access',exact:true}).click();
    await page.getByRole('button',{name:'Run simulation',exact:true}).click();
    await page.getByRole('region',{name:'Synthetic data after permissions',exact:true}).waitFor();
    await shot('simulation-390-en-dark',390,844);
    await page.keyboard.press('Escape');
    if(errors.length) throw Error(errors.join('\n'));
    return {result:'PASS',checks:['resource field selection','READ MASK DENY values','scope denial overrides field policy','export requires grant','stale results cleared','save reload','VI EN light dark','1440 1366 390 no document overflow'],errors};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((key,index)=>original[index]===null?localStorage.removeItem(key):localStorage.setItem(key,original[index])),{keys,original});
    await page.setViewportSize({width:1440,height:900});
    await page.reload();
  }
}

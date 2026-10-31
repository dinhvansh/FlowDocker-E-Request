/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.demo.entities.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const choose=async(label,option)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();};
  const shot=async(width,height,suffix)=>{await page.setViewportSize({width,height});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Page overflow');await page.screenshot({path:`output/playwright/connected-payment-${width}-${suffix}.png`,animations:'disabled'});};
  try {
    await page.evaluate(()=>{localStorage.setItem('flowdocker.form-drafts.v1','[]');localStorage.removeItem('flowdocker.demo.entities.v1');localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');});await page.reload();await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Đề nghị thanh toán · người tạo & Master Data',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    const form=page.locator('form');
    await form.getByRole('combobox',{name:'Người yêu cầu (bắt buộc)',exact:true}).getByText('Nguyễn Văn A',{exact:true}).waitFor();
    if(!(await form.getByRole('combobox',{name:'Người yêu cầu (bắt buộc)',exact:true}).isDisabled()))throw Error('Requester not locked');
    if(await form.getByRole('textbox',{name:'Email người tạo',exact:true}).inputValue()!=='nguyen.van.a@example.com')throw Error('Profile not filled');
    await shot(1440,900,'vi-light');
    await choose('Nhà cung cấp từ Master Data','Nhà cung cấp mẫu A');
    if(await form.getByRole('textbox',{name:'Tên người/đơn vị thụ hưởng (bắt buộc)',exact:true}).inputValue()!=='')throw Error('Beneficiary overwritten');
    await page.getByRole('button',{name:'Kiểm tra dữ liệu thử',exact:true}).click();
    await page.locator('.fd-form-error-summary').waitFor();
    await page.getByRole('button',{name:'Xóa dữ liệu thử',exact:true}).click();
    await form.getByRole('textbox',{name:'Phòng ban người tạo (bắt buộc)',exact:true}).scrollIntoViewIfNeeded();
    await shot(1366,768,'vi-light');
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await choose('Ngôn ngữ: Tiếng Việt','English');
    await shot(1366,768,'en-dark');await shot(390,844,'en-dark');
    await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Form catalog',exact:true}).click();
    await page.getByRole('button',{name:'People and organization · sample',exact:true}).click();await page.getByRole('tab',{name:'Form preview',exact:true}).click();
    if(await page.locator('form').getByRole('textbox',{name:'Creator email',exact:true}).inputValue()!=='nguyen.van.a@example.com')throw Error('Organization profile missing');
    return {result:'PASS',checks:['catalog discovery','creator person/profile defaults','master vendor selection','beneficiary independent','local validation','organization profile sample','VI EN light dark 1440 1366 mobile']};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();
  }
}

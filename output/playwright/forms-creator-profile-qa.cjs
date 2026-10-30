/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const keys=['flowdocker.form-drafts.v1','flowdocker.locale','flowdocker.theme'];
  const original=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
  const field=(key,type,vi,en,source)=>({id:key,key,type,label:{vi,en},required:false,options:[],...(source?{defaultValueSource:source}: {})});
  const definition={id:'qa-creator-profile',title:{vi:'Thông tin người tạo mẫu',en:'Creator profile sample'},version:1,status:'DRAFT',schemaVersion:2,fields:[
    field('name','text','Họ tên','Name'),
    field('email','email','Email','Email','currentUser.email'),
    field('employee','text','Mã nhân viên','Employee code','currentUser.employeeCode'),
    field('department','text','Phòng ban','Department','currentUser.department'),
    field('position','text','Chức danh','Position','currentUser.position'),
    {...field('manager','person','Quản lý','Manager','currentUser.managerId'),dataSource:{provider:'organization.people'}}
  ]};
  const choose=async(label,option)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();};
  const shot=async(width,height,suffix)=>{await page.setViewportSize({width,height});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Page overflow');await page.screenshot({path:`output/playwright/forms-creator-profile-${width}-${suffix}.png`,animations:'disabled'});};
  try {
    await page.evaluate(definition=>{localStorage.setItem('flowdocker.form-drafts.v1',JSON.stringify([definition]));localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');},definition);
    await page.reload();await page.setViewportSize({width:1440,height:900});
    await page.getByRole('button',{name:'Thông tin người tạo mẫu',exact:true}).click();
    await page.locator('[data-canvas-field="name"]').click();
    await choose('Nguồn giá trị mặc định','Họ tên người tạo');
    await page.getByRole('checkbox',{name:'Cho phép sửa giá trị',exact:true}).uncheck();
    await shot(1440,900,'vi-light');
    await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Lưu bản nháp')?.disabled);
    await page.reload();await page.getByRole('button',{name:'Thông tin người tạo mẫu',exact:true}).click();
    await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
    const expected={'Họ tên':'Nguyễn Văn A','Email':'nguyen.van.a@example.com','Mã nhân viên':'DEMO-001','Phòng ban':'Phòng Công nghệ thông tin','Chức danh':'Chuyên viên quản trị nền tảng'};
    for(const [name,value] of Object.entries(expected)) if(await page.getByRole('textbox',{name,exact:true}).inputValue()!==value)throw Error(`Wrong ${name}`);
    if(!(await page.getByRole('textbox',{name:'Họ tên',exact:true}).isDisabled()))throw Error('Creator name not locked');
    await page.locator('form').getByText('Thông tin người tạo đã chọn chưa có dữ liệu. Ứng dụng cần cung cấp thông tin này.',{exact:true}).waitFor();
    if((await page.getByRole('combobox',{name:'Quản lý',exact:true}).textContent()).includes('Chưa đồng bộ'))throw Error('HR placeholder used as manager');
    await page.getByRole('textbox',{name:'Email',exact:true}).fill('edited@example.com');
    await page.getByRole('button',{name:'Xóa dữ liệu thử',exact:true}).click();
    if(await page.getByRole('textbox',{name:'Email',exact:true}).inputValue()!=='nguyen.van.a@example.com')throw Error('Reset failed');
    await shot(1366,768,'vi-light');
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();await choose('Ngôn ngữ: Tiếng Việt','English');
    await page.locator('form').getByText('The selected creator information is unavailable. The application must supply this attribute.',{exact:true}).waitFor();
    await shot(1366,768,'en-dark');await shot(390,844,'en-dark');
    return {result:'PASS',checks:['choose creator name','toggle editing','save reopen','five profile defaults','missing manager notice without fake identity','reset','VI EN light dark 1440 1366 mobile']};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((k,i)=>original[i]===null?localStorage.removeItem(k):localStorage.setItem(k,original[i])),{keys,original});await page.setViewportSize({width:1440,height:900});await page.reload();
  }
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const keys = ['flowdocker.form-drafts.v1', 'flowdocker.locale', 'flowdocker.theme'];
  const original = await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys);
  const choose = async (label, option) => {
    await page.getByRole('combobox', {name:label,exact:true}).click();
    await page.getByRole('option',{name:option,exact:true}).click();
  };
  const capture = async (width,height,suffix) => {
    await page.setViewportSize({width,height});
    await page.mouse.move(0,0);
    await page.evaluate(()=>scrollTo(0,0));
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`${width}: document overflow`);
    const layout=await page.locator('.fd-form-catalog').evaluate(el=>getComputedStyle(el).display);
    if(layout!=='block') throw Error('Old catalog grid overrides catalog container');
    await page.screenshot({path:`output/playwright/forms-catalog-${width}-${suffix}.png`,animations:'disabled'});
  };
  try {
    await page.evaluate(()=>{localStorage.removeItem('flowdocker.form-drafts.v1');localStorage.setItem('flowdocker.locale','vi');localStorage.setItem('flowdocker.theme','light');});
    await page.reload();
    await page.setViewportSize({width:1440,height:900});
    await page.getByRole('heading',{name:'Biểu mẫu',exact:true}).waitFor();
    const catalog=page.locator('.fd-form-catalog');
    const search=page.getByRole('searchbox',{name:'Tìm biểu mẫu...',exact:true});
    await catalog.getByRole('status').getByText('6 trên 6 biểu mẫu',{exact:true}).waitFor();
    await search.fill('thiết bị');
    if(await catalog.getByRole('listitem').count()!==1) throw Error('Search failed');
    await catalog.getByRole('status').getByText('1 trên 6 biểu mẫu',{exact:true}).waitFor();
    await search.fill('no-such-synthetic-form');
    await catalog.getByText('Không tìm thấy biểu mẫu',{exact:true}).waitFor();
    await search.fill('');
    await page.getByRole('button',{name:'Tạo biểu mẫu',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Tạo biểu mẫu',exact:true});
    if(!await dialog.getByRole('button',{name:'Tạo bản nháp',exact:true}).isDisabled()) throw Error('Empty draft accepted');
    await dialog.getByRole('button',{name:'Hủy',exact:true}).click();
    const card=catalog.getByRole('button',{name:'Đề nghị mua sắm · mẫu',exact:true});
    await card.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).waitFor();
    await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
    await catalog.waitFor();
    if(!await page.getByRole('button',{name:'Tiếp tục chỉnh sửa',exact:true}).isVisible()) throw Error('Missing resume action');
    await page.getByRole('button',{name:'Tiếp tục chỉnh sửa',exact:true}).click();
    await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).waitFor();
    await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
    await capture(1440,900,'vi-light');
    await capture(1366,768,'vi-light');
    await capture(1070,884,'vi-light');
    const columns=await page.locator('.fd-form-catalog-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    if(columns!==2) throw Error(`Expected 2 columns at owner width, got ${columns}`);
    await page.setViewportSize({width:1440,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await card.hover();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.fd-form-template')).transform!=='none');
    await page.emulateMedia({reducedMotion:'reduce'});
    const motion=await page.locator('.fd-form-catalog-grid').evaluate(el=>getComputedStyle(el).animationName);
    if(motion!=='none') throw Error('Reduced motion still animates grid');
    const transforms=await card.evaluate(el=>[el,el.querySelector('.fd-form-template-paper'),el.querySelector('.fd-form-template-open svg')].map(item=>getComputedStyle(item).transform));
    if(transforms.some(value=>value!=='none')) throw Error('Reduced motion still transforms cards');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
    await choose('Ngôn ngữ: Tiếng Việt','English');
    await page.getByRole('searchbox',{name:'Search forms...',exact:true}).waitFor();
    await catalog.getByRole('status').getByText('6 of 6 forms',{exact:true}).waitFor();
    await capture(1440,900,'en-dark');
    await capture(390,844,'en-dark');
    await page.locator('.fd-form-template').last().scrollIntoViewIfNeeded();
    await page.locator('.fd-form-template').last().click();
    await page.getByRole('tab',{name:'Field designer',exact:true}).waitFor();
    await page.getByRole('button',{name:'Form catalog',exact:true}).click();
    await page.getByRole('searchbox',{name:'Search forms...',exact:true}).waitFor();
    if(errors.length) throw Error(errors.join('\n'));
    return {result:'PASS',checks:['search/count/empty','create cancel/required names','keyboard open','resume and back','VI EN light dark','1440 1366 1070 390 responsive','hover animation and reduced motion','mobile open/back'],errors};
  } finally {
    await page.evaluate(({keys,original})=>keys.forEach((key,index)=>original[index]===null?localStorage.removeItem(key):localStorage.setItem(key,original[index])),{keys,original});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:1440,height:900});
    await page.reload();
  }
}

npx --yes --package @playwright/cli playwright-cli -s=condition-values-final open http://127.0.0.1:5174/#forms
$code = @"
async page => {
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Đề nghị thanh toán · người tạo & Master Data',exact:true}).click();
  await page.getByRole('tab',{name:'Điều kiện và tính toán',exact:true}).click();
  await page.getByRole('button',{name:'Thêm điều kiện',exact:true}).first().click();
  await page.getByRole('combobox',{name:'Trường điều kiện',exact:true}).click();
  await page.getByRole('option',{name:'Người yêu cầu (requester)',exact:true}).click();
  await page.getByRole('combobox',{name:'Phép so sánh',exact:true}).click();
  await page.getByRole('option',{name:'Bằng',exact:true}).click();
  await page.getByRole('combobox',{name:'Giá trị so sánh',exact:true}).click();
  await page.locator('.fd-combobox-popover').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
  await page.screenshot({path:'output/playwright/condition-values-vi-people.png'});
  await page.getByRole('textbox',{name:'Tìm lựa chọn...',exact:true}).fill('Bình');
  await page.getByRole('option',{name:/Bình Demo/}).focus();
  await page.keyboard.press('Enter');
  if(!(await page.getByRole('combobox',{name:'Giá trị so sánh',exact:true}).innerText()).includes('Bình Demo')) throw new Error('Keyboard choice failed');
  await page.getByRole('combobox',{name:'Trường điều kiện',exact:true}).click();
  await page.getByRole('option',{name:'Nhà cung cấp từ Master Data (vendor_id)',exact:true}).click();
  if((await page.getByRole('combobox',{name:'Giá trị so sánh',exact:true}).innerText()).includes('Bình')) throw new Error('Old operand retained');
  await page.getByRole('combobox',{name:'Giá trị so sánh',exact:true}).click();

  await page.getByRole('option',{name:'Nhà cung cấp mẫu A',exact:true}).click();
  await page.getByRole('tab',{name:'Schema JSON',exact:true}).click();
  const definition=JSON.parse(await page.locator('textarea[readonly]').inputValue());
  const c=definition.fields[0].visibleWhen.conditions[0];
  if(c.field!=='vendor_id' || typeof c.value!=='string' || c.value==='Nhà cung cấp mẫu A') throw new Error('Stable master ID not stored');
  await page.getByRole('tab',{name:'Điều kiện và tính toán',exact:true}).click();
  await page.getByRole('combobox',{name:'Trường điều kiện',exact:true}).click();
  await page.getByRole('option',{name:'Ngày hạch toán (accounting_date)',exact:true}).click();
  const input=page.getByLabel('Giá trị so sánh',{exact:true});
  if(await input.getAttribute('type')!=='date') throw new Error('Date control missing');
  await input.fill('2026-11-05');
  await page.getByRole('combobox',{name:'Trường điều kiện',exact:true}).click();
  await page.getByRole('option',{name:'Người yêu cầu (requester)',exact:true}).click();
  await page.getByRole('combobox',{name:'Giá trị so sánh',exact:true}).click();
  await page.getByRole('option',{name:/Bình Demo/}).click();
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
  await page.setViewportSize({width:1366,height:900});
  const operand=page.getByRole('combobox',{name:'Comparison value',exact:true});
  await operand.scrollIntoViewIfNeeded();
  const desktop=await operand.evaluate(el=>{const c=getComputedStyle(el);return {font:c.fontFamily,size:c.fontSize,line:c.lineHeight,height:el.getBoundingClientRect().height};});
  if(desktop.size!=='12px' || desktop.line!=='18px') throw new Error('Typography mismatch');
  await operand.click();
  await page.locator('.fd-combobox-popover').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
  await page.screenshot({path:'output/playwright/condition-values-en-dark-desktop.png'});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await operand.scrollIntoViewIfNeeded();
  const mobile=await operand.boundingBox();
  if(!mobile || mobile.height<44 || mobile.x<0 || mobile.x+mobile.width>391) throw new Error('Mobile operand does not fit');
  await operand.click();
  await page.locator('.fd-combobox-popover').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
  await page.screenshot({path:'output/playwright/condition-values-en-dark-mobile.png'});
  await page.keyboard.press('Escape');
  return {masterStableId:true,dateControl:true,searchKeyboardSelection:true,sourceReset:true,desktop,mobile};
}
"@
$flat=$code -replace '\r?\n',' '
npx --yes --package @playwright/cli playwright-cli -s=condition-values-final run-code "$flat"

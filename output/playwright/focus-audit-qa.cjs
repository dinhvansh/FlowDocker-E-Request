/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.setViewportSize({width:1440,height:900});
  const results=[];
  const inspect=async (locator, name) => {
    await page.keyboard.press('Tab');
    await locator.focus();
    await page.waitForFunction(() => {
      const el=document.activeElement;
      if(!el) return false;
      const style=getComputedStyle(el);
      return (el.getAttribute('role')==='tab'?style.outlineStyle==='none' && getComputedStyle(el,'::after').opacity==='1':style.outlineWidth==='2px') && style.boxShadow==='none';
    });
    const result=await locator.evaluate(el=>{
      const style=getComputedStyle(el);
      return {focus:el.matches(':focus-visible'),outline:style.outlineColor,outlineStyle:style.outlineStyle,width:style.outlineWidth,shadow:style.boxShadow,border:style.borderColor,underline:getComputedStyle(el,'::after').opacity};
    });
    const tab=name.endsWith('tab');
    if(!result.focus || (tab?result.outlineStyle!=='none':result.width!=='2px') || result.shadow!=='none' || (tab && result.underline!=='1')) throw new Error(name+JSON.stringify(result));
    if(name==='light invalid amount' && result.border!=='rgb(180, 60, 60)') throw new Error('Missing error border');
    if(name==='dark invalid amount' && result.border!=='rgb(255, 155, 155)') throw new Error('Missing dark error border');
    results.push({name,...result});
  };
  const light=page.getByRole('button',{name:'Bật giao diện sáng',exact:true});
  if(await light.count()) await light.click();
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await inspect(page.getByRole('tab',{name:'Điều kiện và tính toán',exact:true}),'light tab');
  await page.screenshot({path:'output/playwright/focus-audit-light-tab.png'});
  await inspect(page.getByRole('button',{name:'Tùy chọn biểu mẫu',exact:true}),'light button');
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
  await inspect(page.getByRole('textbox',{name:'Số tiền đề nghị (bắt buộc)',exact:true}),'light amount');
  await inspect(page.getByRole('textbox',{name:'Diễn giải thanh toán',exact:true}),'light textarea');
  await inspect(page.getByRole('combobox',{name:'Loại tiền',exact:true}),'light select');
  await inspect(page.getByRole('button',{name:'Ngày hóa đơn',exact:true}),'light date trigger');
  await page.getByRole('button',{name:'Kiểm tra dữ liệu thử',exact:true}).click();
  const amount=page.getByRole('textbox',{name:'Số tiền đề nghị (bắt buộc)',exact:true});
  const invalid=await amount.getAttribute('aria-invalid');
  if(invalid!=='true') throw new Error('Required validation lost');
  await inspect(amount,'light invalid amount');
  await page.screenshot({path:'output/playwright/focus-audit-validation.png'});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await inspect(amount,'dark invalid amount');
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await inspect(page.getByRole('tab',{name:'Điều kiện và tính toán',exact:true}),'dark tab');
  await page.screenshot({path:'output/playwright/focus-audit-dark-tab.png'});
  return results;
}

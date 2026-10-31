/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
  await page.getByRole('button',{name:'Mở mẫu thanh toán',exact:true}).click();
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
  const amount = page.getByRole('textbox',{name:'Chi phí (bắt buộc)',exact:true}).first();
  await amount.fill('1234567,89');
  const total = page.getByRole('textbox',{name:'Tổng chi phí',exact:true});
  const vi = {amount:await amount.inputValue(),total:await total.inputValue()};
  if(vi.amount !== '1.234.567,89' || vi.total !== '1.234.567,89') throw new Error(JSON.stringify(vi));
  await amount.scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/currency-grouping-vi.png'});
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  const enAmount = page.getByRole('textbox',{name:'Expense amount (required)',exact:true}).first();
  const en = await enAmount.inputValue();
  if(en !== '1,234,567.89') throw new Error(en);
  await page.screenshot({path:'output/playwright/currency-grouping-en.png'});
  await page.setViewportSize({width:390,height:844});
  await enAmount.scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/currency-grouping-mobile.png'});
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth);
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  await page.setViewportSize({width:1440,height:900});
  return {vi,en,mobileOverflow:overflow};
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const results=[];
 await page.getByRole('button',{name:'Chọn trường Nhà cung cấp',exact:true}).click();
 for(const locale of ['vi','en']) {
  if(locale==='en') {
   await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
   await page.getByRole('option',{name:'English',exact:true}).click();
  }
  for(const theme of ['light','dark']) {
   if(theme==='dark') await page.getByRole('button',{name:locale==='vi'?'Bật giao diện tối':'Switch to dark theme',exact:true}).click();
   for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`output/playwright/forms-redesign-after-${width}-${locale}-${theme}.png`});
    const size=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    if(size.width!==size.scrollWidth) throw new Error(`Overflow ${locale} ${theme} ${width}`);
    results.push({locale,theme,...size});
   }
  }
  await page.getByRole('button',{name:locale==='vi'?'Bật giao diện sáng':'Switch to light theme',exact:true}).click();
 }
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
 await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Điện thoại',exact:true}).click();
 await page.locator('.fd-preview-paper .fd-repeat-table').scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/forms-redesign-preview-table-390.png'});
 await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
 await page.setViewportSize({width:1366,height:768});
 await page.evaluate(()=>window.scrollTo(0,0));
 return results;
}

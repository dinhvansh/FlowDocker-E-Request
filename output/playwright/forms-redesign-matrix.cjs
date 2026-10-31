/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const results=[];
 await page.getByRole('option',{name:'English',exact:true}).click();
 await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
 for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[390,844]]) {
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`output/playwright/forms-redesign-after-${width}-en-dark.png`});
  results.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})));
 }
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
 await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
 await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
 for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[390,844]]) {
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`output/playwright/forms-redesign-after-${width}-vi-light.png`});
  results.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})));
 }
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Điện thoại',exact:true}).click();
 await page.screenshot({path:'output/playwright/forms-redesign-preview-390-vi-light.png'});
 return results;
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 const results=[];
 for (const width of [1366,1440,390]) {
   await page.setViewportSize({width,height:width===1366?768:900});
   if(width===390) await page.getByRole('tab',{name:'Thuộc tính trường',exact:true}).click();
   await page.getByRole('region',{name:'Cài đặt bảng dòng lặp',exact:true}).scrollIntoViewIfNeeded();
   await page.screenshot({path:`output/playwright/repeat-settings-${width}.png`});
   results.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 return results;
}


/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
 await page.getByRole('table',{name:'Expense lines',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/repeat-preview-en-dark.png'});
 const maxEnforced=await page.getByRole('button',{name:'Add row',exact:true}).isDisabled();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('region',{name:'Expense lines',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/repeat-preview-mobile-en-dark.png'});
 return {maxEnforced,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}


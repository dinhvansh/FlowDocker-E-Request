/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.reload();
 const restored=await page.getByRole('combobox',{name:'Form orientation',exact:true}).innerText();
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
 await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
 await page.screenshot({path:'output/playwright/form-orientation-designer.png'});
 return {restored};
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();
 const orientation=page.getByRole('combobox',{name:'Form orientation',exact:true});
 await orientation.click();
 await page.getByRole('option',{name:'Landscape',exact:true}).click();
 await page.getByRole('tab',{name:'Form preview',exact:true}).click();
 const landscape=await page.locator('.fd-preview-paper').boundingBox();
 await page.locator('.fd-preview-paper').scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/form-landscape-1440.png'});
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();
 await orientation.click();
 await page.getByRole('option',{name:'Portrait',exact:true}).click();
 await page.getByRole('tab',{name:'Form preview',exact:true}).click();
 const portrait=await page.locator('.fd-preview-paper').boundingBox();
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();
 await orientation.click();
 await page.getByRole('option',{name:'Landscape',exact:true}).click();
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await page.getByRole('tab',{name:'Form preview',exact:true}).click();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'output/playwright/form-landscape-mobile.png'});
 return {portrait:portrait.width,landscape:landscape.width,mobileOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}


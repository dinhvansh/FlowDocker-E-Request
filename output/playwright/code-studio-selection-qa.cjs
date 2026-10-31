/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Đề nghị mua sắm · mẫu',exact:true}).click();
 await page.getByRole('tab',{name:'Code Studio',exact:true}).click();
 const editor=page.getByRole('textbox',{name:'Schema biểu mẫu · Code Studio',exact:true});
 await editor.waitFor();
 await page.locator('.cm-line').filter({hasText:'"id": "needed_on"'}).click();
 await page.getByRole('tab',{name:'Thuộc tính trường',exact:true}).click();
 await page.getByRole('textbox',{name:'Mã trường',exact:true}).waitFor();
 const key=await page.getByRole('textbox',{name:'Mã trường',exact:true}).inputValue();
 if(key!=='needed_on')throw Error('Code selection did not select date '+key);
 await page.getByRole('tab',{name:'Canvas',exact:true}).last().click();
 await page.locator('[data-canvas-field="category"]').click();
 await page.getByRole('tab',{name:'Thuộc tính trường',exact:true}).click();
 if(await page.getByRole('textbox',{name:'Mã trường',exact:true}).inputValue()!=='category')throw Error('Canvas selection failed');
 await page.screenshot({path:'output/playwright/code-studio-selection-1440.png',animations:'disabled'});
 return {result:'PASS',selection:'code date -> inspector; canvas category -> code'};
}
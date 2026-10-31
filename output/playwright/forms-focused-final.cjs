/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry point. */
async (page) => {
 const checks=[];const ok=(x,s)=>{if(!x)throw new Error(s);checks.push(s)};
 if(await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).count()) await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click(); await page.reload();await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).waitFor();
 for(const [width,height] of [[626,604],[390,844],[1366,768],[1440,900]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>window.scrollTo(0,0));
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'VI/light no overflow '+width);
 await page.screenshot({path:'output/playwright/forms-focused-'+width+'.png'});
 }
 await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
 await page.getByRole('option',{name:'English',exact:true}).click();
 await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
 await page.getByRole('button',{name:'Form options',exact:true}).click();
 ok(await page.getByRole('button',{name:'Rename form',exact:true}).isVisible(),'English options exposes Rename');
 await page.keyboard.press('Escape');
 await page.locator('.fd-designer-tools summary').click();
 ok(await page.getByRole('button',{name:'Import JSON schema',exact:true}).isVisible(),'English Tools exposes import');
 await page.locator('.fd-designer-tools summary').click();
 for(const [width,height] of [[1440,900],[390,844]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>window.scrollTo(0,0));
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'EN/dark no overflow '+width);
 await page.screenshot({path:'output/playwright/forms-focused-'+width+'-en-dark.png'});
 }
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
 await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
 return checks;
}



/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI function entry point. */
async (page)=>{
 if(await page.getByRole('dialog').count()) await page.getByRole('button',{name:'Cancel',exact:true}).click();
 if(await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).count()) {await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();}
 const checks=[];const ok=(condition,label)=>{if(!condition)throw new Error(label);checks.push(label);};
 await page.setViewportSize({width:1366,height:768});
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();
 await page.getByRole('button',{name:'Import JSON schema',exact:true}).click();
 await page.getByRole('textbox',{name:'JSON schema content',exact:true}).fill('{"script":"alert(1)"}');
 await page.getByRole('button',{name:'Replace with schema',exact:true}).click();
 ok(await page.getByRole('dialog').isVisible(),'Malformed schema import is rejected and editor stays open');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
 await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
 if(await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).count()) await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
 if(await page.getByRole('button',{name:'Chọn trường Nhà cung cấp',exact:true}).count()===0) await page.getByRole('button',{name:'Mở mẫu thanh toán',exact:true}).click();
 await page.getByRole('button',{name:'Chọn trường Nhà cung cấp',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'output/playwright/forms-ux-v2-final-1366-vi-light.png'});
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'1366px designer has no page overflow');
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('tab',{name:'Canvas',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:'output/playwright/forms-ux-v2-final-390-vi-light.png',fullPage:true});
 ok(await page.getByRole('tab',{name:'Schema JSON',exact:true}).isVisible(),'Mobile JSON mode remains reachable');
 ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'VI light mobile has no page overflow');
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,0));
 return checks;
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry point. */
async(page)=>{
 const results=[];const ok=(x,s)=>{if(!x)throw new Error(s);results.push(s)};
 await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:900});
 const trigger=page.getByRole('button',{name:'Ngày cần sử dụng (bắt buộc)',exact:true});
 await page.getByRole('button',{name:'Chọn trường Mục đích mua sắm',exact:true}).click();await trigger.click();
 await page.getByRole('dialog').waitFor();
 await page.getByRole('combobox',{name:'Chọn năm',exact:true}).selectOption('2028');
 await page.getByRole('combobox',{name:'Chọn tháng',exact:true}).selectOption('1');
 await page.getByRole('button',{name:/Thứ Ba, 29 tháng 2, 2028/}).click();
 await page.getByRole('dialog').waitFor({state:'hidden'});
 ok((await trigger.innerText()).includes('29/02/2028'),'Canvas selects leap day with one click');
 await trigger.click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.matches('.fd-live-form .fd-date-trigger'));
 ok(await trigger.evaluate(e=>e===document.activeElement),'Escape restores trigger focus');
 const search=page.getByRole('searchbox',{name:'Tìm kiểu trường...',exact:true});await search.fill('datetime');
 await page.getByRole('button',{name:'Thêm Ngày và giờ',exact:true}).click();await search.fill('');
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 ok(await page.locator('.fd-preview-paper input[type=date],.fd-preview-paper input[type=datetime-local]').count()===0,'Preview has no native date inputs');
 const datetime=page.locator('.fd-preview-paper .fd-date-trigger').last();await datetime.click();
 await page.getByRole('button',{name:'Hôm nay',exact:true}).click();
 await page.getByRole('combobox',{name:'Giờ',exact:true}).click();await page.getByRole('option',{name:'18',exact:true}).click();
 await page.getByRole('combobox',{name:'Phút',exact:true}).click();await page.getByRole('option',{name:'45',exact:true}).click();
 await page.getByRole('button',{name:'Xong',exact:true}).click();
 ok((await datetime.innerText()).includes('18:45'),'Runtime sets local hours and minutes');
 await datetime.click();await page.getByRole('combobox',{name:'Chọn năm',exact:true}).selectOption('2028');await page.getByRole('combobox',{name:'Chọn tháng',exact:true}).selectOption('1');
 await page.getByRole('button',{name:/Thứ Ba, 29 tháng 2, 2028/}).click();await page.getByRole('button',{name:'Xong',exact:true}).click();
 ok((await datetime.innerText()).includes('29/02/2028')&&(await datetime.innerText()).includes('18:45'),'Changing date preserves chosen local time');
 await datetime.click();await page.getByRole('button',{name:'Xóa ngày',exact:true}).click();
 ok((await datetime.innerText()).includes('Chọn ngày'),'Runtime clears datetime');
 await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
 for(const [width,height] of [[626,604],[390,844],[1366,768],[1440,900]]){
 await page.setViewportSize({width,height});
 if(width<1150)await page.getByRole('tab',{name:'Canvas',exact:true}).click();
 await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
 await dialog.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished));});
 const box=await dialog.boundingBox();ok(box.x>=0 && box.x+box.width<=width && box.y>=0 && box.y+box.height<=height,'Calendar fits viewport '+width);
 await page.screenshot({path:'output/playwright/forms-calendar-'+width+'-vi-light.png'});await page.keyboard.press('Escape');
 }
 await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();await page.getByRole('option',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();
 for(const width of [1440,390]){
 await page.setViewportSize({width,height:width===390?844:900});if(width===390)await page.getByRole('tab',{name:'Canvas',exact:true}).click();
 await page.getByRole('button',{name:'Needed on (required)',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished));});
 ok(await page.getByRole('button',{name:'Today',exact:true}).isVisible(),'EN dark calendar '+width);await page.screenshot({path:'output/playwright/forms-calendar-'+width+'-en-dark.png'});await page.keyboard.press('Escape');
 }
 await page.getByRole('combobox',{name:'Language: English',exact:true}).click();await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
 return results;
}



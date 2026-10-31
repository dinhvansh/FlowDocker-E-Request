/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry point. */
async(page)=>{
 const results=[];const check=(value,name)=>{if(!value)throw new Error(name);results.push(name);};
 await page.goto('http://127.0.0.1:5174/#forms');await page.reload();await page.setViewportSize({width:626,height:604});
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).waitFor();
 check(!await page.getByRole('button',{name:'Tạo biểu mẫu',exact:true}).isVisible(),'No catalog creation buttons in editor');
 check(await page.locator('.fd-live-form textarea').first().isVisible(),'Actual input visible in editor');
 check((await page.locator('.fd-live-form').boundingBox()).y<300,'Canvas starts before 300px at 626px width');
 await page.getByRole('button',{name:'Tùy chọn biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Đổi tên biểu mẫu',exact:true}).click();
 await page.getByRole('textbox',{name:'Tên biểu mẫu · tiếng Việt',exact:true}).fill('Nháp kiểm tra hành trình '+Date.now());
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
 await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
 check(await page.getByRole('button',{name:'Tạo biểu mẫu',exact:true}).isVisible(),'Creation belongs to catalog');
 await page.getByRole('button',{name:'Tạo biểu mẫu',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByRole('textbox',{name:'Tên biểu mẫu · tiếng Việt',exact:true}).fill('Form hành trình mới');
 await dialog.getByRole('textbox',{name:'Tên biểu mẫu · tiếng Anh',exact:true}).fill('New journey form');
 await dialog.getByRole('button',{name:'Tạo bản nháp',exact:true}).click();
 check(!await page.getByRole('button',{name:'Tạo biểu mẫu',exact:true}).isVisible(),'Creation enters focused editor');
 await page.getByRole('tab',{name:'Thư viện trường',exact:true}).click();
 await page.getByRole('button',{name:'Thêm Văn bản ngắn',exact:true}).click();
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 check(await page.locator('.fd-preview-paper input').first().isVisible(),'Create, insert, save and Preview journey');
 await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
 await page.locator('.fd-designer-tools summary').click();
 check(await page.getByRole('button',{name:'Nhập schema JSON',exact:true}).isVisible(),'Advanced import remains available in Tools');
 await page.locator('.fd-designer-tools summary').click();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'output/playwright/forms-focused-626.png'});
 for(const width of [390,1366,1440]){
 await page.setViewportSize({width,height:width===390?844:900});await page.evaluate(()=>window.scrollTo(0,0));
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow '+width);
 await page.screenshot({path:'output/playwright/forms-focused-'+width+'.png'});
 }
 return results;
}



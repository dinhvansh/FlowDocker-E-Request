/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Mở mẫu thanh toán',exact:true}).click();
 await page.getByRole('button',{name:'Chọn trường Chi tiết chi phí',exact:true}).click();
 await page.getByRole('region',{name:'Cài đặt bảng dòng lặp',exact:true}).waitFor();
 const add=page.getByRole('combobox',{name:'Thêm cột vào bảng',exact:true});
 for(const name of ['Văn bản ngắn','Ngày','Số']) {
   await add.click();
   await page.getByRole('option',{name,exact:true}).click();
   await page.getByRole('button',{name:'Chọn trường Chi tiết chi phí',exact:true}).click();
 }
 await page.screenshot({path:'output/playwright/repeat-improved-1440.png'});
 return await page.locator('.fd-repeat-table-scroll').evaluateAll(items=>items.map(el=>({width:el.clientWidth,scroll:el.scrollWidth, pageWidth:document.documentElement.scrollWidth,viewport:innerWidth})));
}


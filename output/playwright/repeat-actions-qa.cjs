/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 const settings=page.getByRole('region',{name:'Cài đặt bảng dòng lặp',exact:true});
 await settings.getByRole('spinbutton',{name:'Số dòng tối đa',exact:true}).fill('2');
 await settings.locator('.fd-repeat-column-setting').last().getByRole('button',{name:'Lên trên',exact:true}).click();
 const order=await settings.locator('.fd-repeat-column-setting > button:first-child').allTextContents();
 await settings.getByRole('combobox',{name:'Thêm cột vào bảng',exact:true}).click();
 await page.getByRole('option',{name:'Email',exact:true}).click();
 const retained=await settings.isVisible();
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Thêm dòng',exact:true}).click();
 const maxEnforced=await page.getByRole('button',{name:'Thêm dòng',exact:true}).isDisabled();
 await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
 await page.getByRole('option',{name:'English',exact:true}).click();
 await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
 await page.getByRole('table',{name:'Expense lines',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/repeat-preview-en-dark.png'});
 return {order,retained,maxEnforced};
}



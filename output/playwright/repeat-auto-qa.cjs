/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Mở mẫu thanh toán',exact:true}).click();
 await page.getByRole('button',{name:'Chọn trường Chi tiết chi phí',exact:true}).click();
 const settings=page.getByRole('region',{name:'Cài đặt bảng dòng lặp',exact:true});
 await settings.getByRole('checkbox',{name:'Tự động chừa dòng trống',exact:true}).check();
 await settings.getByRole('spinbutton',{name:'Số dòng tối thiểu',exact:true}).fill('0');
 await settings.getByRole('spinbutton',{name:'Số dòng tối đa',exact:true}).fill('3');
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 const table=page.getByRole('table',{name:'Chi tiết chi phí',exact:true});
 const body=table.locator('tbody');
 await table.getByRole('textbox',{name:'Nội dung (bắt buộc)',exact:true}).first().fill('Mẫu kiểm tra');
 await table.getByRole('spinbutton',{name:'Chi phí (bắt buộc)',exact:true}).first().fill('0');
 const trailing=await body.locator('tr[data-placeholder="true"]').count();
 await page.getByRole('button',{name:'Thêm dòng',exact:true}).click();
 const focusInPlaceholder=await body.locator('tr[data-placeholder="true"]').evaluateAll(rows=>rows.some(row=>row.contains(document.activeElement)));
 await table.scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/repeat-auto-footer-1440.png'});
 await table.getByRole('textbox',{name:'Nội dung (bắt buộc)',exact:true}).first().fill('');
 await table.getByRole('spinbutton',{name:'Chi phí (bắt buộc)',exact:true}).first().fill('');
 await page.getByRole('textbox',{name:'Diễn giải thanh toán',exact:true}).click();
 const clearedRemoved=await body.locator('tr').count();
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Thêm dòng',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:'output/playwright/repeat-auto-footer-mobile.png'});
 return {trailing,focusInPlaceholder,clearedRemoved,mobileOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
}

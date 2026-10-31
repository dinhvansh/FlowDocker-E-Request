/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.getByRole('option',{name:'Chi phí UX',exact:true}).click();
 await page.getByRole('button',{name:'Thêm Tiền tệ',exact:true}).click();
 await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('Chi phí mới');
 await page.getByRole('textbox',{name:'Nhãn tiếng Anh',exact:true}).fill('New expense');
 await page.getByRole('textbox',{name:'Mã trường',exact:true}).fill('amount');
 await page.getByRole('combobox',{name:'Thêm vào nhóm',exact:true}).click();
 await page.getByRole('option',{name:'Cấp ngoài cùng',exact:true}).click();
 await page.getByRole('button',{name:'Thêm Tiền tệ',exact:true}).click();
 await page.getByRole('textbox',{name:'Nhãn tiếng Việt',exact:true}).fill('Tổng mới');
 await page.getByRole('textbox',{name:'Nhãn tiếng Anh',exact:true}).fill('New total');
 await page.getByRole('textbox',{name:'Mã trường',exact:true}).fill('total');
 await page.getByRole('combobox',{name:'Nhóm thuộc tính',exact:true}).click();
 await page.getByRole('option',{name:'Điều kiện và tính toán',exact:true}).click();
 await page.getByRole('combobox',{name:'Phép tính',exact:true}).click();
 await page.getByRole('option',{name:'Tổng',exact:true}).click();
 await page.getByRole('textbox',{name:'Các mã trường đầu vào',exact:false}).fill('lines.amount');
 await page.getByRole('button',{name:'Lưu bản nháp',exact:true}).click();
 await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
 const preview=page.locator('.fd-preview-paper');
 await preview.getByRole('button',{name:'Thêm dòng',exact:true}).click();
 await preview.getByRole('spinbutton',{name:'Chi phí mới',exact:true}).first().fill('0.20');
 await preview.getByRole('button',{name:'Thêm dòng',exact:true}).click();
 await preview.getByRole('spinbutton',{name:'Chi phí mới',exact:true}).nth(1).fill('0.30');
 if(await preview.getByRole('spinbutton',{name:'Tổng mới',exact:true}).inputValue()!=='0.50') throw new Error('New authored aggregate failed');
 return ['Created repeat through toolbox','Inserted child using container selector','Configured sum through inspector','New authored table produces 0.50'];
}

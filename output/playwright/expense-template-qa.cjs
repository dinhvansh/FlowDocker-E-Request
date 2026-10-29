/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.keyboard.press('Escape');
  const english=page.getByRole('combobox',{name:'Language: English',exact:true});
  if(await english.count()){
    await english.click();
    await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  }
  await page.setViewportSize({width:1440,height:900});
  const catalogItem=page.getByRole('button',{name:/Đề nghị thanh toán · mẫu chi phí VND.*trường/});
  if(await catalogItem.isVisible()) await catalogItem.click();
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
  await page.getByRole('button',{name:'Xóa dữ liệu thử',exact:true}).click();
  await page.getByRole('textbox',{name:'Người yêu cầu (bắt buộc)',exact:true}).fill('Người dùng minh họa');
  await page.getByRole('combobox',{name:'Bộ phận · danh sách mẫu (bắt buộc)',exact:true}).click();
  await page.getByRole('option',{name:'CNTT · mẫu',exact:true}).click();
  for(const [name,value] of [
    ['Tên người/đơn vị thụ hưởng (bắt buộc)','Nhà cung cấp minh họa'],
    ['Số tài khoản · chỉ nhập dữ liệu mẫu (bắt buộc)','DEMO-ACCOUNT-001'],
    ['Ngân hàng (bắt buộc)','Ngân hàng minh họa'],
    ['Nội dung chuyển khoản (bắt buộc)','Thanh toán dịch vụ minh họa'],
  ]) await page.getByRole('textbox',{name,exact:true}).fill(value);
  const table=page.getByRole('table',{name:'Chi tiết chi phí',exact:true});
  if(await table.getByRole('columnheader').count()!==10) throw new Error('Missing columns');
  const enterRow=async(index,amount)=>{
    await table.getByRole('button',{name:'Ngày hóa đơn (bắt buộc)',exact:true}).nth(index).click();
    await page.getByRole('button',{name:'Hôm nay',exact:true}).click();
    await table.getByRole('textbox',{name:'Số hóa đơn (bắt buộc)',exact:true}).nth(index).fill('DEMO-INV-'+(index+1));
    await table.getByRole('textbox',{name:'Diễn giải (bắt buộc)',exact:true}).nth(index).fill('Dịch vụ minh họa '+(index+1));
    await table.getByRole('combobox',{name:'Loại chi phí · mẫu (bắt buộc)',exact:true}).nth(index).click();
    await page.getByRole('option',{name:'Dịch vụ',exact:true}).click();
    await table.getByRole('textbox',{name:'Số tiền (bắt buộc)',exact:true}).nth(index).fill(amount);
  };
  const total=page.getByRole('textbox',{name:'Tổng thanh toán VND',exact:true});
  const difference=page.getByRole('textbox',{name:'Chênh lệch',exact:true});
  await enterRow(0,'2500000');
  if(await total.inputValue()!=='2.500.000,00'||await difference.inputValue()!=='-2.500.000,00') throw new Error('Wrong first total');
  await page.getByRole('button',{name:'Thêm dòng',exact:true}).click();
  await enterRow(1,'500000');
  await page.getByRole('textbox',{name:'Số tiền đã tạm ứng (bắt buộc)',exact:true}).fill('1000000');
  await page.getByRole('button',{name:'Kiểm tra dữ liệu thử',exact:true}).click();
  const reference=page.getByRole('textbox',{name:'Số chứng từ tạm ứng (bắt buộc)',exact:true});
  if(await reference.getAttribute('aria-invalid')!=='true') throw new Error('Missing conditional required');
  await reference.fill('DEMO-ADV-001');
  await page.getByRole('button',{name:'Kiểm tra dữ liệu thử',exact:true}).click();
  if(await page.locator('[aria-invalid="true"]').count()) throw new Error('Valid example rejected');
  const result={total:await total.inputValue(),difference:await difference.inputValue()};
  if(result.total!=='3.000.000,00'||result.difference!=='-2.000.000,00') throw new Error(JSON.stringify(result));
  await total.scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/expense-template-totals-1440.png'});
  await table.getByRole('button',{name:'Xóa dòng 2',exact:true}).click();
  if(await total.inputValue()!=='2.500.000,00') throw new Error('Removal total');
  for(const [width,height] of [[1366,768],[390,844]]){
    await page.setViewportSize({width,height});
    await table.scrollIntoViewIfNeeded();
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw new Error('Page overflow '+width);
    await page.screenshot({path:'output/playwright/expense-template-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  const enTotal=await page.getByRole('group',{name:'Settlement totals',exact:true}).getByRole('textbox',{name:'Total payment VND',exact:true}).inputValue();
  if(enTotal!=='2,500,000.00') throw new Error('Locale changed value');
  const light=page.getByRole('button',{name:'Switch to light theme',exact:true});
  if(await light.count()) await light.click();
  await page.getByRole('textbox',{name:'Difference',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/expense-template-en-light.png'});
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await page.getByRole('heading',{name:'Đề nghị thanh toán · mẫu chi phí VND',exact:true}).last().scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/expense-template-designer-1440.png'});
  return {...result,enTotal,validation:true,mobileOverflow:false};
}

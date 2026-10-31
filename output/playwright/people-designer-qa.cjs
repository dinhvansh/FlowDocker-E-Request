/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.keyboard.press('Escape');
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).waitFor();
  await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await page.getByRole('button',{name:'Thêm Chọn người',exact:true}).click();
  const added=page.getByRole('combobox',{name:'Chọn người',exact:true});
  await added.waitFor({state:'visible'});
  await added.click();
  await page.getByRole('option',{name:/An Demo/}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('listbox',{name:'Chọn người',exact:true}).waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
  if(await page.getByRole('combobox',{name:'Chọn người',exact:true}).count()) throw Error('Undo did not remove added person field');
  await page.screenshot({path:'output/playwright/people-designer-1440-vi-light.png'});
  return {result:'PASS',checks:['toolbox insertion','default directory provider','undo']};
}

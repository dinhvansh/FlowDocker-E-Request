/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const source = () => page.getByRole('combobox', {name:'Nguồn dữ liệu', exact:true});
  if (!(await source().textContent()).includes('Người trong tổ chức')) throw Error('Missing friendly source label');
  await source().click();
  for (const name of ['Danh sách nhập tay','Người trong tổ chức','Công ty · dữ liệu mẫu','Phòng ban · dữ liệu mẫu']) {
    await page.getByRole('option',{name,exact:true}).waitFor();
  }
  await page.screenshot({animations:'disabled',path:'output/playwright/forms-data-source-1440-vi-light.png'});
  await page.getByRole('option',{name:'Danh sách nhập tay',exact:true}).click();
  await page.getByRole('textbox',{name:'Lựa chọn song ngữ',exact:true}).waitFor();
  await source().click();
  await page.getByRole('option',{name:'Công ty · dữ liệu mẫu',exact:true}).click();
  if(await page.getByRole('textbox',{name:'Lựa chọn song ngữ',exact:true}).count()) throw Error('Static choices visible for dynamic provider');
  await page.getByRole('tab',{name:'Xem thử biểu mẫu',exact:true}).click();
  await page.getByRole('combobox',{name:'Người yêu cầu (bắt buộc)',exact:true}).click();
  await page.getByRole('option',{name:'Công ty mẫu',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).click();
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
  if (!(await source().textContent()).includes('Danh sách nhập tay')) throw Error('Undo source switch failed');
  await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
  if (!(await source().textContent()).includes('Người trong tổ chức')) throw Error('Undo to original source failed');
  await page.setViewportSize({width:1366,height:768});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  const enSource=page.getByRole('combobox',{name:'Data source',exact:true});
  await enSource.click();
  await page.getByRole('option',{name:'Organization people',exact:true}).waitFor();
  await page.getByRole('option',{name:'Departments · demo data',exact:true}).waitFor();
  await page.screenshot({animations:'disabled',path:'output/playwright/forms-data-source-1366-en-dark.png'});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('tab',{name:'Field properties',exact:true}).click();
  await enSource.click();
  await page.getByRole('option',{name:'Manual choices',exact:true}).waitFor();
  await page.screenshot({animations:'disabled',path:'output/playwright/forms-data-source-390-en-dark.png'});
  await page.keyboard.press('Escape');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile overflow');
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  return {result:'PASS',saved:false,checks:['friendly registered sources','manual vs dynamic choices','runtime company lookup','undo twice','VI/light 1440','EN/dark 1366','mobile 390 no overflow']};
}

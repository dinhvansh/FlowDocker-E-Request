/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async(page)=>{
  await page.reload();
  await page.setViewportSize({width:1440,height:900});
  const english=page.getByRole('combobox',{name:'Language: English',exact:true});
  if(await english.count()){
    await english.click();
    await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
    await page.getByRole('heading',{name:'Biểu mẫu',exact:true,level:1}).waitFor();
  }
  if(await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).count()) throw new Error('Editor opened automatically');
  if(await page.getByRole('button',{name:/^Mở mẫu/}).count()) throw new Error('Template shortcut remains');
  const template=page.getByRole('button',{name:/Đề nghị thanh toán · mẫu chi phí VND.*trường/});
  if(await template.count()!==1) throw new Error('Missing or duplicate template');
  await template.click();
  if(await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).count()!==1) throw new Error('Template did not open');
  await page.getByRole('button',{name:'Biểu mẫu',exact:true}).click();
  if(await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).count()) throw new Error('Menu did not return to catalog');
  await template.click();
  await page.getByRole('button',{name:'Ứng dụng',exact:true}).click();
  await page.getByRole('button',{name:'Biểu mẫu',exact:true}).click();
  if(await page.getByRole('tab',{name:'Thiết kế trường',exact:true}).count()) throw new Error('Re-entry did not show catalog');
  const search=page.getByRole('searchbox',{name:'Tìm biểu mẫu...',exact:true});
  await search.fill('chi phí');
  if(await template.count()!==1 || await page.getByRole('button',{name:/Đề nghị mua sắm · mẫu.*trường/}).count()) throw new Error('Search failed');
  await search.fill('');
  const darkButton=page.getByRole('button',{name:'Bật giao diện tối',exact:true});
  if(await darkButton.count()) await darkButton.click();
  await page.screenshot({path:'output/playwright/forms-catalog-1440-dark.png'});
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  await page.getByRole('button',{name:/Expense request · VND template.*fields/}).waitFor();
  if(await page.getByRole('button',{name:/Expense request · VND template.*fields/}).count()!==1) throw new Error('English template missing');
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  await page.setViewportSize({width:1366,height:768});
  await page.screenshot({path:'output/playwright/forms-catalog-1366-en-light.png'});
  await page.setViewportSize({width:390,height:844});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow) throw new Error('Mobile overflow');
  await page.screenshot({path:'output/playwright/forms-catalog-390.png'});
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  await page.setViewportSize({width:1440,height:900});
  return {catalogFirst:true,menuReturnsToCatalog:true,templateAsListItem:true,search:true,mobileOverflow:overflow};
}

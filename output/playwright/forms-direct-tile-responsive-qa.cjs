/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.setViewportSize({width:1366,height:768});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  await page.getByRole('tab',{name:'Field designer',exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Search field types...',exact:true}).fill('Email');
  const before=await page.locator('[data-canvas-field]').count();
  const tile=page.getByRole('button',{name:'Add Email',exact:true});
  await tile.hover();const a=await tile.boundingBox();const b=await page.locator('.fd-live-form-header').boundingBox();
  await page.mouse.move(a.x+a.width*.6,a.y+a.height*.5);await page.mouse.down();await page.mouse.move(a.x+a.width*.6+15,a.y+a.height*.5,{steps:4});await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5,{steps:20});
  await page.locator('.fd-dnd-preview').waitFor();
  await page.screenshot({path:'output/playwright/forms-direct-drag-1366-en-dark.png'});
  await page.mouse.up();await page.locator('.fd-dnd-preview').waitFor({state:'hidden'});
  if(await page.locator('[data-canvas-field]').count()!==before+1) throw Error('English tile drag failed');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await tile.focus();await page.keyboard.press('Enter');
  if(await page.locator('[data-canvas-field]').count()!==before+1) throw Error('Keyboard click alternative failed');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('tab',{name:'Field library',exact:true}).click();
  await tile.click();
  if(await page.locator('[data-canvas-field]').count()!==before+1) throw Error('Mobile click insertion failed');
  await page.screenshot({path:'output/playwright/forms-direct-drag-390-en-dark.png'});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Mobile page overflow');
  return {result:'PASS',checks:['EN dark direct drag','keyboard Enter insertion','mobile click insertion','390px no overflow'],saved:false};
}

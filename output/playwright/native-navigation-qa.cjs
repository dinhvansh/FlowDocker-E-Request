/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const original=page.url();
  await page.setViewportSize({width:1440,height:900});
  const links=page.locator('aside a');
  const hrefs=await links.evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
  if(hrefs.length!==8)throw Error('Missing menu link');
  const menu=page.getByRole('link',{name:'Master Data',exact:true});
  const before=page.url();
  await menu.click({button:'right'});await page.keyboard.press('Escape');
  if(page.url()!==before)throw Error('Right click changed current route');
  const popupPromise=page.context().waitForEvent('page');
  await menu.click({modifiers:['Control']});
  const popup=await popupPromise;
  await popup.waitForURL('**/#master');
  if(page.url()!==before)throw Error('Ctrl click changed current route');
  await popup.close();
  const middlePromise=page.context().waitForEvent('page');
  await page.locator('aside a[href="#connections"]').click({button:'middle'});
  const middle=await middlePromise;await middle.waitForURL('**/#connections');await middle.close();
  if(page.url()!==before)throw Error('Middle click changed current route');
  await menu.click();await page.waitForURL('**/#master');
  await page.screenshot({path:'output/playwright/native-navigation-1440.png',animations:'disabled'});
  for(const href of hrefs) {
    await page.locator(`aside a[href="${href}"]`).click();
    await page.waitForURL(`**/${href}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:/^(Mở điều hướng|Open navigation)$/}).click();
  await page.locator('aside a[href="#forms"]').click();
  await page.waitForURL('**/#forms');
  if(await page.locator('.fd-sidebar').getAttribute('data-open')!=='false')throw Error('Mobile menu not closed');
  await page.setViewportSize({width:1366,height:768});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  const english=page.getByRole('link',{name:'Connections',exact:true});
  await english.focus();await page.keyboard.press('Enter');await page.waitForURL('**/#connections');
  await page.screenshot({path:'output/playwright/native-navigation-1366-en-dark.png',animations:'disabled'});
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  await page.setViewportSize({width:1440,height:900});
  await page.goto(original);
  return {result:'PASS',checks:['8 native menu/profile hrefs','right click keeps route','Ctrl click opens master tab','middle click opens connections tab','all regular routes','mobile menu closes']};
}

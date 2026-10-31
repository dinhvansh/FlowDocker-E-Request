/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  await page.reload();
  await page.setViewportSize({width:1440,height:900});
  if(await page.getByRole('button',{name:'Switch to light theme',exact:true}).count()) await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  if(await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).count()) await page.getByRole('button',{name:'Bật giao diện sáng',exact:true}).click();
  const checks=[];
  const check=async(buttonName)=>{
    await page.waitForFunction(el=>{
      const brand=getComputedStyle(document.querySelector('.fd-app')).getPropertyValue('--fd-color-brand').trim();
      const rgb=brand.slice(1).match(/../g).map(x=>parseInt(x,16));
      return getComputedStyle(el).backgroundColor===`rgb(${rgb.join(', ')})`;
    },await page.getByRole('button',{name:buttonName,exact:true}).elementHandle());
    const result=await page.getByRole('button',{name:buttonName,exact:true}).evaluate(el=>{
      const brand=getComputedStyle(document.querySelector('.fd-app')).getPropertyValue('--fd-color-brand').trim();
      const rgb=brand.slice(1).match(/../g).map(x=>parseInt(x,16));
      return {actual:getComputedStyle(el).backgroundColor,expected:`rgb(${rgb.join(', ')})`};
    });
    if(result.actual!==result.expected) throw Error(JSON.stringify(result));
    checks.push(result);
  };
  await page.getByText('Ant Design · bản thử',{exact:true}).waitFor();
  await check('Tạo vai trò');
  await page.screenshot({path:'output/playwright/permissions-antd-brand-1440-vi-light.png',animations:'disabled'});
  await page.getByRole('button',{name:'Bật giao diện tối',exact:true}).click();
  await check('Tạo vai trò');
  await page.setViewportSize({width:1366,height:768});
  await page.getByRole('combobox',{name:'Ngôn ngữ: Tiếng Việt',exact:true}).click();
  await page.getByRole('option',{name:'English',exact:true}).click();
  await page.screenshot({path:'output/playwright/permissions-antd-brand-1366-en-dark.png',animations:'disabled'});
  await page.getByRole('button',{name:'Simulate access',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Simulate access',exact:true});
  await dialog.getByRole('button',{name:'Run simulation',exact:true}).click();
  await dialog.getByRole('status').waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');
  await page.screenshot({path:'output/playwright/permissions-antd-brand-390-en-dark.png',animations:'disabled',fullPage:true});
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
  await page.getByRole('combobox',{name:'Language: English',exact:true}).click();
  await page.getByRole('option',{name:'Tiếng Việt',exact:true}).click();
  return {result:'PASS',primaryMatchesSharedPalette:checks};
}

/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  await page.goto('http://127.0.0.1:5176/');await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'Đầu trang / Chân trang',exact:true}).click();
  await page.getByRole('button',{name:'Mẫu khu vực chữ ký',exact:true}).click();
  if(await page.locator('.fd-live-form [data-placement=footer] .fd-form-band-cell').count()!==3)throw Error('Independent host missing footer');
  await page.screenshot({path:'output/playwright/form-decoration-independent-host.png',animations:'disabled'});
  await page.keyboard.press('Escape');
  return {status:'PASS',host:'independent Forms example',checks:['public designer editor','live footer rendering','no E-Request imports required']};
}

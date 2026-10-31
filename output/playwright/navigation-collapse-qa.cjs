/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1366,height:768});
 const toggle=page.locator('.fd-desktop-nav-toggle');
 const before=await page.locator('.fd-main-wrap').boundingBox();
 await toggle.click();
 const after=await page.locator('.fd-main-wrap').boundingBox();
 const hidden=await page.locator('.fd-sidebar').isHidden();
 await page.screenshot({path:'output/playwright/navigation-collapsed-1366.png'});
 await toggle.click();
 const restored=await page.locator('.fd-sidebar').isVisible();
 await toggle.click();
 await page.setViewportSize({width:390,height:844});
 await page.locator('.fd-mobile-menu').click();
 const mobile=await page.locator('.fd-sidebar').isVisible();
 await page.locator('.fd-sidebar-close').click();
 await page.setViewportSize({width:1366,height:768});
 return {gainedWidth:after.width-before.width,hidden,restored,mobile};
}

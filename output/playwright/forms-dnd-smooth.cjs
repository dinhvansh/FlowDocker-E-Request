/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
 await page.setViewportSize({width:1440,height:900});
 await page.reload();
 await page.getByRole('button',{name:'Danh sách biểu mẫu',exact:true}).click();
 await page.getByRole('button',{name:'Mở mẫu thanh toán',exact:true}).click();
 await page.getByRole('button',{name:'Kéo Email vào canvas',exact:true}).scrollIntoViewIfNeeded();
 const source=page.getByRole('button',{name:'Kéo Email vào canvas',exact:true});
 const target=page.locator('[data-canvas-field="payment-details"] .fd-canvas-control').first();
 const a=await source.boundingBox(); const b=await target.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(a.x+a.width/2+12,a.y+a.height/2,{steps:5});
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:20});
 const preview=await page.locator('.fd-dnd-preview').count();
 const active=await page.locator('[data-drop-active="true"]').count();
 await page.screenshot({path:'D:/Andros portal/FlowDocker-E-Request/output/playwright/forms-dnd-during.png'});
 await page.mouse.up();
 return {preview,active,inserted:await page.getByRole('button',{name:'Chọn trường Email',exact:true}).count()};
}

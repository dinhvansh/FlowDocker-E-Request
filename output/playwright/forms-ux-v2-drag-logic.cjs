/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI function entry point. */
async (page)=>{
 const checks=[];const ok=(value,label)=>{if(!value)throw new Error(label);checks.push(label);};
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();
 if(await page.getByRole('button',{name:'Undo',exact:true}).isEnabled()) await page.getByRole('button',{name:'Undo',exact:true}).click();
 if(await page.getByRole('button',{name:'Select field Vendor',exact:true}).count()===0) await page.getByRole('button',{name:'Open payment sample',exact:true}).click();
 const vendor=page.locator('[data-canvas-field="payment-vendor"]');
 const target=page.locator('[data-canvas-field="payment-invoice_date"]');
 await target.scrollIntoViewIfNeeded();
 const start=await vendor.locator('.fd-drag-handle').boundingBox();const end=await target.boundingBox();
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
 await page.mouse.move(start.x+start.width/2,start.y+start.height/2+12,{steps:4});
 await page.mouse.move(end.x+end.width/2,end.y+end.height/2,{steps:16});await page.mouse.up();
 await page.getByRole('tab',{name:'Schema JSON',exact:true}).click();
 const schema=JSON.parse(await page.getByRole('textbox',{name:'JSON schema content',exact:true}).inputValue());
 ok(schema.fields[0].children.findIndex(field=>field.key==='vendor')!==3,'Pointer drag reorders nested field');
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 await page.getByRole('button',{name:'Select field Advance reason',exact:true}).click();
 await page.locator('.fd-form-editor > [data-slot="tabs"]').getByRole('tab',{name:'Logic and calculations',exact:true}).click();
 const inspector=page.locator('.fd-form-properties');
 const rule=inspector.locator('.fd-rule-editor').first();
 await rule.getByRole('textbox',{name:'Comparison value',exact:true}).fill('special');
 await page.getByRole('tab',{name:'Form preview',exact:true}).click();
 const preview=page.locator('.fd-preview-paper');await preview.getByRole('radio',{name:'Advance',exact:true}).click();
 ok(await preview.getByRole('textbox',{name:'Advance reason (required)',exact:true}).count()===0,'Edited visibility condition applies in Preview');
 await page.getByRole('tab',{name:'Field designer',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
 return checks;
}

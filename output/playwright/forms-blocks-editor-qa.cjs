/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async page => {
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  await page.setViewportSize({width:390,height:844});await page.getByRole('tab',{name:'Field designer',exact:true}).click();await page.getByRole('tab',{name:'Canvas',exact:true}).click();
  await page.getByRole('button',{name:'Select field Demo logo',exact:true}).click();
  await page.getByRole('tab',{name:'Field properties',exact:true}).click();
  await page.getByLabel('Upload image / Logo',{exact:true}).waitFor();
  const mobile=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));check(mobile.width===mobile.scroll,'Mobile editor overflow');
  await page.screenshot({path:'output/playwright/forms-blocks-editor-390-en-dark.png',animations:'disabled'});
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('heading',{name:'Content blocks sample',exact:true,level:1}).scrollIntoViewIfNeeded();
  const search=page.getByRole('searchbox',{name:'Search field types...',exact:true});await search.fill('divider');
  const source=page.getByRole('button',{name:'Drag Divider line onto canvas',exact:true});
  const target=page.locator('[data-canvas-field=layout] > .fd-insertion-zone[data-edge=after]');
  await source.scrollIntoViewIfNeeded();let b=await source.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+12,b.y+b.height/2+8,{steps:3});
  await target.scrollIntoViewIfNeeded();b=await target.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:24});await page.waitForTimeout(150);b=await target.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.up();
  await page.waitForTimeout(200);
  const form=await page.evaluate(()=>JSON.parse(JSON.parse(sessionStorage.getItem('flowdocker.form-recovery.v1')).source));
  const at=form.fields.findIndex(f=>f.id==='layout');check(form.fields[at+1].type==='divider'&&form.fields.length===6,'Drop after container failed');
  await search.fill('image');await page.getByRole('heading',{name:'Content blocks sample',exact:true,level:1}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'output/playwright/forms-blocks-editor-1440-en-dark.png',animations:'disabled'});
  return {status:'PASS',checks:['mobile image inspector','real drop after container'],mobile};
}

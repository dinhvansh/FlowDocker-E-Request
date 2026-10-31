/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry point. */
async(page)=>{
 const checks=[];await page.getByRole('tablist').first().getByRole('tab').first().click();
 for(const [width,height] of [[626,604],[390,844],[1366,768],[1440,900]]){
 await page.setViewportSize({width,height});
 const lists=page.getByRole('tablist');
 for(const list of await lists.all()){
 if(!await list.isVisible()) continue;
 const result=await list.evaluate(e=>({client:e.clientHeight,scroll:e.scrollHeight,overflow:getComputedStyle(e).overflowY}));
 if(result.scroll>result.client || result.overflow==='auto' || result.overflow==='scroll')throw new Error('Vertical tab scrolling '+width+JSON.stringify(result));
 }
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('Page overflow '+width);
 checks.push('No vertical tab scrolling or page overflow '+width);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'output/playwright/forms-tabs-fixed-'+width+'.png'});
 }
 const tabs=page.getByRole('tablist').first().getByRole('tab');await tabs.first().focus();await page.keyboard.press('ArrowRight');
 await page.getByRole('tab',{name:await tabs.nth(1).innerText(),selected:true,exact:true}).waitFor();
 await tabs.first().click();checks.push('ArrowRight activates next mode');
 return checks;
}



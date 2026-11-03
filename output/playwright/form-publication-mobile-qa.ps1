param([switch]$LightDesktop)
$ErrorActionPreference = 'Stop'
$qaSuffix = if ($LightDesktop) { 'en-light-desktop' } else { 'en-mobile' }
$publisher = Get-Content -LiteralPath '.playwright-cli/publisher-fixture.json' -Raw | ConvertFrom-Json
$viewer = Get-Content -LiteralPath 'backend-demo.local.json' -Raw | ConvertFrom-Json
foreach ($account in @($publisher,$viewer)) { if ($account.login -notmatch '^[a-z0-9._-]+$' -or $account.password -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unexpected synthetic credential format' } }
$code = @"
async page => {
  await page.getByLabel('Server username',{exact:true}).fill('$($publisher.login)');
  await page.getByLabel('Server password',{exact:true}).fill('$($publisher.password)');
  await page.getByRole('button',{name:'Sign in to server',exact:true}).click();
  await page.getByRole('button',{name:'Save open form to server',exact:true}).click();
  await page.getByText('Draft saved to the server. Your local copy is unchanged.',{exact:true}).waitFor();
  const response=page.waitForResponse(r=>r.url().endsWith('/publish'));
  await page.getByRole('button',{name:'Publish on server',exact:true}).click();
  if((await response).status()!==201) throw new Error('Mobile publication failed');
  await page.getByText('An immutable version was published on the server. Later edits will not change this version.',{exact:true}).waitFor();
  const metrics=await page.getByRole('dialog').evaluate(el=>{const b=el.getBoundingClientRect();const button=Array.from(el.querySelectorAll('button')).find(x=>x.textContent==='Publish on server');const cs=getComputedStyle(button);return {x:b.x,width:b.width,viewport:innerWidth,overflow:el.scrollWidth>el.clientWidth,font:cs.fontFamily,size:cs.fontSize,line:cs.lineHeight,controlHeight:button.getBoundingClientRect().height};});
  if(metrics.x<0 || metrics.x+metrics.width>metrics.viewport+1 || metrics.overflow || metrics.size!=='12px') throw new Error('Mobile layout/typography failed');
  if(metrics.viewport<640 && metrics.controlHeight<44) throw new Error('Mobile touch target too small');
  await page.screenshot({path:'output/playwright/form-publication-$qaSuffix.png',animations:'disabled'});
  await page.getByRole('button',{name:'Sign out of server',exact:true}).click();
  await page.getByLabel('Server username',{exact:true}).fill('$($viewer.login)');
  await page.getByLabel('Server password',{exact:true}).fill('$($viewer.password)');
  await page.getByRole('button',{name:'Sign in to server',exact:true}).click();
  await page.getByText('This account has not been granted form publication permission.',{exact:true}).waitFor();
  if(await page.getByRole('button',{name:'Publish on server',exact:true}).isEnabled()) throw new Error('Unauthorized publish enabled');
  await page.screenshot({path:'output/playwright/form-publication-denied-$qaSuffix.png',animations:'disabled'});
  await page.getByRole('button',{name:'Sign out of server',exact:true}).click();
  return {mobilePublication:true,permissionDenied:true,metrics};
}
"@
$singleLineCode = ($code -split "`r?`n") -join ' '
$result = & npx --yes --package @playwright/cli playwright-cli -s=server-storage run-code $singleLineCode 2>&1
$safeResult = $result -join "`n"
foreach ($account in @($publisher,$viewer)) { $safeResult=$safeResult.Replace($account.password,'<redacted>').Replace($account.login,'<test-account>') }
$safeResult | Set-Content -LiteralPath "output/playwright/form-publication-$qaSuffix-qa.log"
if ($LASTEXITCODE -ne 0 -or $safeResult -match '### Error') { throw 'Browser QA failed; inspect sanitized mobile log' }
$safeResult

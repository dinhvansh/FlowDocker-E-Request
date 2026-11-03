$ErrorActionPreference = 'Stop'
$credentials = Get-Content -LiteralPath 'backend-demo.local.json' -Raw | ConvertFrom-Json
if ($credentials.login -notmatch '^[a-z0-9._-]+$' -or $credentials.password -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unexpected synthetic credential format' }
$code = @"
async page => {
  await page.getByLabel('Server username',{exact:true}).fill('$($credentials.login)');
  await page.getByLabel('Server password',{exact:true}).fill('$($credentials.password)');
  await page.getByRole('button',{name:'Sign in to server',exact:true}).click();
  await page.getByRole('button',{name:'Save open form to server',exact:true}).waitFor();
  const title=await page.locator('.fd-form-document-name h1').textContent();
  try {
    await page.context().setOffline(true);
    await page.getByRole('button',{name:'Save open form to server',exact:true}).click();
    await page.getByText('The operation failed. Check your connection or account and retry. Your working draft is retained.',{exact:true}).waitFor();
    if(title!==await page.locator('.fd-form-document-name h1').textContent()) throw new Error('Draft changed during network failure');
    await page.screenshot({path:'output/playwright/server-storage-offline-en-dark-mobile.png',animations:'disabled'});
  } finally { await page.context().setOffline(false); }
  await page.getByRole('button',{name:'Sign out of server',exact:true}).click();
  await page.getByRole('button',{name:'Sign in to server',exact:true}).waitFor();
  return {offlineError:true,workingDraftRetained:true,mobile:true,english:true};
}
"@
$result = & npx --yes --package @playwright/cli playwright-cli -s=server-storage run-code (($code -split "`r?`n") -join ' ') 2>&1
$safeResult = ($result -join "`n").Replace($credentials.password, '<redacted>').Replace($credentials.login, '<test-account>')
$safeResult | Set-Content -LiteralPath 'output/playwright/server-storage-offline-qa.log'
if ($LASTEXITCODE -ne 0 -or $safeResult -match '### Error') { throw 'Offline QA failed; inspect sanitized log' }
$safeResult

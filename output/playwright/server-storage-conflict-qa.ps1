$ErrorActionPreference = 'Stop'
$credentials = Get-Content -LiteralPath 'backend-demo.local.json' -Raw | ConvertFrom-Json
if ($credentials.login -notmatch '^[a-z0-9._-]+$' -or $credentials.password -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unexpected synthetic credential format' }
$code = @"
async page => {
  await page.getByLabel('Tên đăng nhập máy chủ',{exact:true}).fill('$($credentials.login)');
  await page.getByLabel('Mật khẩu máy chủ',{exact:true}).fill('$($credentials.password)');
  const loginResponse=page.waitForResponse(r=>r.url().endsWith('/session/login'));
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).click();
  const login=await (await loginResponse).json();
  await page.getByRole('button',{name:'Lưu mẫu đang mở lên máy chủ',exact:true}).waitFor();
  const createdResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('/forms/'));
  await page.getByRole('button',{name:'Lưu mẫu đang mở lên máy chủ',exact:true}).click();
  const created=await (await createdResponse).json();
  await page.getByText('Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.',{exact:true}).waitFor();
  const origin=new URL(page.url()).origin; const endpoint=origin+'/api/v1/apps/e-request/forms/'+created.id;
  const headers={authorization:'Bearer '+login.accessToken};
  const stored=await (await page.request.get(endpoint,{headers})).json();
  const changed=await page.request.put(endpoint,{headers,data:{definition:stored.definition,expectedVersion:1}});
  if(changed.status()!==200) throw new Error('Concurrent writer failed');
  await page.getByRole('button',{name:'Cập nhật bản máy chủ',exact:true}).click();
  await page.getByText('Bản máy chủ đã thay đổi. Hãy mở bản mới nhất hoặc lưu thành bản sao mới; bản đang sửa vẫn được giữ lại.',{exact:true}).waitFor();
  if(!await page.getByRole('button',{name:'Cập nhật bản máy chủ',exact:true}).isDisabled()) throw new Error('Stale update remained enabled');
  await page.screenshot({path:'output/playwright/server-storage-conflict-vi.png',animations:'disabled'});
  const deleted=await page.request.delete(endpoint,{headers,data:{expectedVersion:2}});
  if(deleted.status()!==200) throw new Error('Synthetic cleanup failed');
  await page.request.post(origin+'/api/v1/session/logout',{headers});
  await page.getByRole('button',{name:'Làm mới danh sách máy chủ',exact:true}).click();
  await page.getByText('Phiên đăng nhập đã hết. Bản đang sửa vẫn được giữ lại.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).waitFor();
  return {conflict:true,staleSaveBlocked:true,sessionRevoked:true,draftRetained:await page.getByRole('dialog').count()===1};
}
"@
$singleLineCode = ($code -split "`r?`n") -join ' '
$result = & npx --yes --package @playwright/cli playwright-cli -s=server-storage run-code $singleLineCode 2>&1
$safeResult = ($result -join "`n").Replace($credentials.password, '<redacted>').Replace($credentials.login, '<test-account>')
$safeResult | Set-Content -LiteralPath 'output/playwright/server-storage-conflict-qa.log'
if ($LASTEXITCODE -ne 0 -or $safeResult -match '### Error') { throw 'Conflict QA failed; inspect sanitized log' }
$safeResult

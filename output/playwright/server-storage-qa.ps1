$ErrorActionPreference = 'Stop'
$credentials = Get-Content -LiteralPath 'backend-demo.local.json' -Raw | ConvertFrom-Json
if ($credentials.login -notmatch '^[a-z0-9._-]+$' -or $credentials.password -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unexpected synthetic credential format' }
$loginJson = "'" + $credentials.login + "'"
$passwordJson = "'" + $credentials.password + "'"
$code = @"
async page => {
  await page.getByRole('button',{name:'Lưu trên máy chủ',exact:true}).click();
  await page.getByLabel('Tên đăng nhập máy chủ',{exact:true}).fill($loginJson);
  await page.getByLabel('Mật khẩu máy chủ',{exact:true}).fill($passwordJson);
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).click();
  await page.getByRole('button',{name:'Lưu mẫu đang mở lên máy chủ',exact:true}).waitFor();
  const createdResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('/forms/'));
  await page.getByRole('button',{name:'Lưu mẫu đang mở lên máy chủ',exact:true}).click();
  const created=await createdResponse;
  if(created.status()!==201) throw new Error('Create failed: '+created.status());
  const remote=await created.json();
  await page.getByText('Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.',{exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/server-storage-vi-light.png',animations:'disabled'});
  const updatedResponse=page.waitForResponse(r=>r.request().method()==='PUT' && r.url().endsWith('/forms/'+remote.id));
  await page.getByRole('button',{name:'Cập nhật bản máy chủ',exact:true}).click();
  const updated=await updatedResponse;
  if(updated.status()!==200 || (await updated.json()).version!==2) throw new Error('Update failed');
  await page.getByText('Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Mở bản làm việc',exact:true}).click();
  await page.getByRole('button',{name:'Lưu trên máy chủ',exact:true}).waitFor();
  await page.getByRole('button',{name:'Lưu trên máy chủ',exact:true}).click();
  await page.getByRole('button',{name:'Cập nhật bản máy chủ',exact:true}).waitFor();
  await page.getByRole('button',{name:'Xóa bản máy chủ',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận xóa bản máy chủ',exact:true}).click();
  await page.getByText('Đã xóa bản máy chủ. Bản đang sửa và bản cục bộ vẫn được giữ lại.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Đăng xuất máy chủ',exact:true}).click();
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).waitFor();
  return {create:true,update:true,open:true,delete:true,logout:true};
}
"@
[IO.File]::WriteAllText((Join-Path (Get-Location) '.playwright-cli/server-storage-temp.js'), '(' + $code + ')')
& node --check .playwright-cli/server-storage-temp.js
if ($LASTEXITCODE -ne 0) { throw 'QA script syntax error' }
$singleLineCode = ($code -split "`r?`n") -join ' '
$result = & npx --yes --package @playwright/cli playwright-cli -s=server-storage run-code $singleLineCode 2>&1
$safeResult = ($result -join "`n").Replace($credentials.password, '<redacted>').Replace($credentials.login, '<test-account>')
$safeResult | Set-Content -LiteralPath 'output/playwright/server-storage-qa.log'
if ($LASTEXITCODE -ne 0 -or $safeResult -match '### Error') { throw 'Browser QA failed; inspect sanitized server-storage-qa.log' }
$safeResult

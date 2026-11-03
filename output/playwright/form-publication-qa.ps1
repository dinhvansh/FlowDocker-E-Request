$ErrorActionPreference = 'Stop'
$credentials = Get-Content -LiteralPath '.playwright-cli/publisher-fixture.json' -Raw | ConvertFrom-Json
if ($credentials.login -notmatch '^[a-z0-9._-]+$' -or $credentials.password -notmatch '^[A-Za-z0-9_-]+$') { throw 'Unexpected synthetic credential format' }
$loginJson = "'" + $credentials.login + "'"
$passwordJson = "'" + $credentials.password + "'"
$code = @"
async page => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const loginResponse=page.waitForResponse(r=>r.url().endsWith('/session/login'));
  await page.getByLabel('Tên đăng nhập máy chủ',{exact:true}).fill($loginJson);
  await page.getByLabel('Mật khẩu máy chủ',{exact:true}).fill($passwordJson);
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).click();
  const session=await (await loginResponse).json();
  const publishButton=page.getByRole('button',{name:'Xuất bản trên máy chủ',exact:true});
  await publishButton.waitFor();
  if(await publishButton.isEnabled()) throw new Error('Unsaved form can publish');
  const savedResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('/forms/'));
  await page.getByRole('button',{name:'Lưu mẫu đang mở lên máy chủ',exact:true}).click();
  const remote=await (await savedResponse).json();
  await page.getByText('Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.',{exact:true}).waitFor();
  const publishResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().endsWith('/publish'));
  await publishButton.click();
  const publication=await publishResponse;
  if(publication.status()!==201) throw new Error('Publication failed: '+publication.status());
  const frozen=await publication.json();
  await page.getByText('Đã xuất bản phiên bản cố định trên máy chủ. Các lần chỉnh sửa sau không thay đổi phiên bản này.',{exact:true}).waitFor();
  await page.screenshot({path:'output/playwright/form-publication-vi.png',animations:'disabled'});
  await page.getByRole('button',{name:'Đóng',exact:true}).first().click();
  await page.getByLabel('Nhãn tiếng Việt',{exact:true}).fill('Đầu trang kiểm thử xuất bản');
  await page.getByRole('button',{name:'Lưu trên máy chủ',exact:true}).click();
  if(await publishButton.isEnabled()) throw new Error('Changed form can publish without save');
  await page.getByText('Lưu bản đang sửa lên máy chủ trước khi xuất bản.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Cập nhật bản máy chủ',exact:true}).click();
  await page.getByText('Đã lưu bản nháp trên máy chủ. Bản cục bộ không bị thay đổi.',{exact:true}).waitFor();
  const auth={authorization:'Bearer '+session.accessToken};
  const endpoint='http://127.0.0.1:5174/api/v1/apps/e-request/forms/'+remote.id;
  const current=await (await page.request.get(endpoint,{headers:auth})).json();
  const changed=await page.request.put(endpoint,{headers:auth,data:{definition:current.definition,expectedVersion:current.version}});
  if(changed.status()!==200) throw new Error('Concurrent writer setup failed');
  const conflictResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().endsWith('/publish'));
  await publishButton.click();
  if((await conflictResponse).status()!==409) throw new Error('Stale publication not rejected');
  await page.getByText('Bản máy chủ đã thay đổi. Hãy mở bản mới nhất hoặc lưu thành bản sao mới; bản đang sửa vẫn được giữ lại.',{exact:true}).waitFor();
  if(await publishButton.isEnabled()) throw new Error('Conflict did not disable publish');
  const immutable=await (await page.request.get('http://127.0.0.1:5174/api/v1/apps/e-request/form-versions/'+frozen.id,{headers:auth})).json();
  if(immutable.checksum!==frozen.checksum) throw new Error('Published snapshot changed');
  await page.getByRole('button',{name:'Đăng xuất máy chủ',exact:true}).click();
  await page.getByRole('button',{name:'Đăng nhập máy chủ',exact:true}).waitFor();
  return {publish:true,unsavedGuard:true,changedGuard:true,conflict:true,immutable:true,pageErrors:errors};
}
"@
$singleLineCode = ($code -split "`r?`n") -join ' '
$result = & npx --yes --package @playwright/cli playwright-cli -s=server-storage run-code $singleLineCode 2>&1
$safeResult = ($result -join "`n").Replace($credentials.password, '<redacted>').Replace($credentials.login, '<test-account>')
$safeResult | Set-Content -LiteralPath 'output/playwright/form-publication-qa.log'
if ($LASTEXITCODE -ne 0 -or $safeResult -match '### Error') { throw 'Browser QA failed; inspect sanitized publication log' }
$safeResult

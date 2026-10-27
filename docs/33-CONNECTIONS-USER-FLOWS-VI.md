# Connections — Luồng thao tác (Tiếng Việt)

**DESIGN ONLY — chưa code, chưa test nguồn thật.** Ngày 27/10/2026.

## 1. Phân biệt
- **Connection**: kết nối có tên, endpoint, protocol và credential trong secret vault; ví dụ Epicor QA (SQL Server read-only).
- **Master Source**: danh mục nghiệp vụ trên nguồn, ví dụ Company, Vendor, Cost Center.
- **Sync Pipeline**: chọn nguồn nào, cột nào, mapping sang bảng đích, hình thức Full/Incremental, lịch và cách xử lý lỗi.
- Một Connection có thể dùng cho nhiều Source và Pipeline; mỗi pipeline có checkpoint riêng.

## 2. Màn hình Connections chính

    Administration > Master Data > Connections      [+ New Connection]
    All | Active | Draft | Degraded | Disabled
    Name                 Type           Status              Used By
    Epicor QA            SQL Server     ACTIVE / HEALTHY    3 pipelines
    Microsoft Entra      Graph API      ACTIVE / HEALTHY    2 pipelines
    HR Master            HR REST        DRAFT / UNTESTED    0 pipelines
    Finance REST         Epicor REST    ACTIVE / FAILED     1 pipeline

    Detail:
    Overview | Configuration | Access | Used By | Health | Audit
    [Test] [Create Sync] [Rotate Credential] [Edit] [Disable]

Dữ liệu giao diện trên là giả lập. Connection ACTIVE và health FAILED có thể tồn tại đồng thời; hệ thống không xóa dữ liệu canonical khi source tạm lỗi.

## 3. Wizard tạo Connection — 4 bước

**Bước 1: Select Connector:** Epicor SQL Server, Epicor REST/BAQ, Microsoft Entra Graph, HR REST, SFTP. Nhập tên, môi trường DEV/QA/PROD, owner.

**Bước 2: Configure:** Endpoint/host/port/database, TLS, authentication; credential gửi một lần đến vault, UI không cho hiển thị lại. SQL tài khoản nguồn chỉ được SELECT trên view cho phép.

**Bước 3: Test:** DNS → TLS → Authentication → minimal READ/permission → latency. Báo PASS/FAIL từng chặng; nếu chỉ kết nối TCP mà thiếu SELECT thì FAIL. Không đồng bộ bất kỳ master data nào.

**Bước 4: Save & Activate:** lưu cấu hình versioned và secret reference, xác minh test vẫn khớp phiên bản credential đã lưu; kích hoạt. Hai nút Finish hoặc Create Sync →.

## 4. Wizard tạo Sync Pipeline — 5 bước (tách riêng)

1. **Connection & Entity:** Chọn Active connection, chọn Company / Vendor / Cost Center / Users / Employees.
2. **Discover:** Chỉ hiện approved view/BAQ/endpoint, schema và cột được phép; chọn external key, company key.
3. **Mapping:** Chọn cột nguồn → cột canonical, kiểu dữ liệu, active flag, công ty, quan hệ, quyền sở hữu field.
4. **Sync Strategy:** Full Snapshot Diff hoặc Incremental khi cursor được chứng minh đáng tin; interval, batch size, safety guard, stale threshold.
5. **Dry Run & Publish:** Hiển thị ước lượng Insert/Update/Unchanged/Quarantine/Inactivate, không ghi vào master. Publish ở trạng thái Paused; Run Initial Sync; xem run result; sau đó mới Enable Schedule.

Ví dụ Epicor Connection ACTIVE có 3 pipeline độc lập: Company (Full daily), Vendor (Incremental hourly), Cost Center (Full diff daily). Lịch/mode ví dụ, không phải cấu hình ERP đã xác minh.

## 5. Tab chi tiết
- **Overview:** tên, endpoint đã che, owner, trạng thái, health, last test/sync.
- **Configuration:** metadata, version, mask credential; đổi config tạo draft version.
- **Access:** ai được test, config, rotate, tạo pipeline; theo tenant/environment.
- **Used By:** source/pipeline đang dùng, ảnh hưởng khi Disable.
- **Health:** lịch sử NETWORK_ERROR, TLS_INVALID, AUTH_FAILED, READ_PERMISSION_DENIED, expired secret; retry.
- **Audit:** ai tạo/sửa/test/activate/rotate/disable, không lưu password hay dữ liệu ngân hàng.

## 6. Luồng lỗi và bảo vệ
- Sai mật khẩu hoặc thiếu quyền READ: lưu draft được, không được activate.
- Đổi cấu hình hoặc secret: bắt buộc test lại phiên bản mới. Rotation theo staged → test → promote; candidate hỏng thì giữ secret cũ.
- Disable connection đang có pipeline: hiển thị impact và yêu cầu confirm; chặn lịch mới, drain/cancel run theo policy, không xóa canonical data hoặc audit.
- Connection source tạm ngắt: dữ liệu lookup đã sync còn giữ nhưng có freshness guard; workflow manager/finance critical fail closed.
- Không cho người dùng Form Studio nhập SQL tự do, URL tự do hoặc xem connection secret.

## 7. Mức quyền
Integration Admin cấu hình/test/rotate/disable. Sync Operator xem metadata an toàn, mapping/chạy theo scope. Finance/HR Data Owner phê duyệt mapping và exception. Form Designer/Workflow Designer chỉ chọn published lookup, không nhìn thấy password, table raw data, secret vault.

## 8. Tài liệu liên quan
- [Chi tiết UX Connections](30-CONNECTIONS-UX-FLOWS.md)
- [6 Sequence Diagrams](31-CONNECTIONS-SEQUENCE-DIAGRAMS.md)
- [API / Data contract](32-CONNECTIONS-API-DATA-CONTRACT.md)
- [SQL reference](../db/design/005_connections_extension.sql)

Chưa có migration, API, UI hay kết quả kiểm thử thật; chỉ là thiết kế và tài liệu bàn giao Codex.

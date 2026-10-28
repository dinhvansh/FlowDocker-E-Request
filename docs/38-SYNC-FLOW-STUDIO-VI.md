# Master Data Flow Studio — Thiết kế kéo thả node như n8n (Tiếng Việt)

**Trạng thái: ĐÃ THIẾT KẾ, CHƯA CODE/CHƯA CHẠY.** Ngày 28/10/2026.

## Quyết định thay đổi
Thay màn Mapping tĩnh trong Sync Wizard bằng **Node-based Flow Studio** dùng React Flow (MIT). Cho phép kéo node, nối dây, xem Input/Output JSON và kéo đường dẫn dữ liệu vào các trường đích. Không dùng/mượn source của n8n vào ứng dụng; n8n có Sustainable Use License cần thoả thuận OEM nếu nhúng trong sản phẩm thương mại.

**Connection** chỉ định endpoint/credential. **Source** chỉ định dữ liệu được phép đọc. **Sync Flow** xác định các node xử lý và đích, có phiên bản riêng. **Approval Workflow** là màn khác, không gộp với Sync Flow.

## 1. Bố cục
```text
Administration > Master Data > Flow Studio
+ New Flow   Save Draft   Test Node   Dry Run   Validate   Publish   Run
┌───────────────┬────────────────────────────────────┬────────────────────┐
│ Node Library  │ Canvas                             │ Node Properties    │
│  Trigger      │ [Schedule] → [Epicor Read Vendor]   │ Selected: Mapper   │
│  Sources      │                       ↓            │ Schema: Vendors    │
│  Parse JSON   │               [Parse JSON ?]       │ Input: VendorRow   │
│  Split Items  │                       ↓            │ Transform settings │
│  Transform    │                 [Split Items]      │ Output: vendor     │
│  Filter       │                       ↓            │ [Test Node]        │
│  Lookup/Join  │              RAW / STAGING          │                    │
│  Mapper       │                       ↓            │                    │
│  Validate     │ [Filter] → [Join] → [Map]           │                    │
│  Upsert       │                      ↓             │                    │
│  Notify       │              [Validate] → [Upsert] │                    │
├───────────────┴────────────────────────────────────┴────────────────────┤
│ Data Inspector: INPUT JSON | OUTPUT JSON | SCHEMA | ERRORS | RUN LOGS     │
└─────────────────────────────────────────────────────────────────────────┘
```
Không tải dữ liệu ERP hàng triệu dòng lên trình duyệt: chỉ preview 20–100 record được ẩn thông tin nhạy cảm. Backend chạy theo batch.

## 2. Các node V1
- **Source:** Epicor SQL view/BAQ, Epicor REST, Entra Graph, HR REST, File (approved).
- **Parse JSON:** Chuỗi JSON → object/array; nếu nguồn đã là object JSON thì không cần node này.
- **Extract/Split Items:** mảng → từng record, giữ key, lineage.
- **Filter:** chọn Active, lọc điều kiện AND/OR.
- **Set/Transform:** Trim, Coalesce, To String, To Decimal, To Date, Enum mapping.
- **Lookup/Join:** Vendor CompanyCode → company UUID; cho phép exact match, kiểm soát trùng/không tìm thấy.
- **Field Mapper:** kéo thả trường bên trái sang field đích ở bên phải.
- **Validate:** kiểm tra key, loại dữ liệu, ngoại khóa, company và trạng thái.
- **Quarantine/Error:** record lỗi không âm thầm bị bỏ qua.
- **Master Upsert:** ghi PostgreSQL canonical theo stable external key, idempotent.
- **Metrics:** đếm Insert/Update/Unchanged/Filtered/Quarantined.

## 3. Màn Field Mapper
```text
INPUT JSON                  TRANSFORM                   TARGET MASTER
Company   "ABC"       →    Lookup Company.code     →    company_id
VendorNum 1205        →    To String               →    vendor_external_key
Name      "Supplier A"→    Trim                    →    display_name
Inactive  false       →    NOT + Enum             →    lifecycle_state
          [Input Preview]    [Output Preview]    [Mapping Errors]
```
Dùng dữ liệu **ví dụ**, chưa xác nhận tên cột Epicor thật.

Kéo `Name` qua `display_name` tự sinh mapping. Kéo `Company` tới `company_id` bắt buộc cấu hình Lookup; không ép text thành UUID một cách mù quáng. Mapping cấu hình được lưu dưới dạng **typed JSON DSL**, không cần viết SQL hoặc JavaScript tùy ý.

## 4. Các nút chạy khác nhau
- `Test Connection`: chỉ kiểm tra DNS/TLS/Auth/READ, không cập nhật dữ liệu.
- `Test Node`: chạy 1 node trên mẫu dữ liệu cho phép, không ghi Master.
- `Dry Run`: chạy thử toàn bộ Flow, xem số record dự kiến Insert/Update/Error, không ghi dữ liệu Master và không nhảy checkpoint.
- `Publish`: khóa graph version; trạng thái `PAUSED`.
- `Run Initial Sync`: đọc nguồn thật, staging → transform → upsert → checkpoint sau khi đủ điều kiện.
- `Enable Schedule`: sau bootstrap/kiểm tra, tự chạy theo lịch.

## 5. Tình huống lỗi
Sai JSON → Parse Node báo lỗi cụ thể; Company không map được → Quarantine; sai loại dữ liệu → Validation Error; thiếu cursor incremental → đề nghị Full Snapshot Diff; lỗi lúc Upsert → retry idempotent; graph mới publish không đổi graph đã dùng bởi run đang chạy. Phân quyền theo tenant/company/connection; chặn tùy ý nhập SQL/URL/JS.

## 6. Thiết kế kỹ thuật
**Canvas:** `@xyflow/react` (MIT). **Backend:** bộ compiler graph kiểu dữ liệu và batch executor riêng, có thể dùng Temporal điều phối job/retry. **Data:** PostgreSQL staging/canonical. Không dùng chung execution engine với approval/human-task workflow. Quản lý version, lineage, dry-run log và node metrics.

## 7. Tài liệu liên quan
- [Chi tiết Flow Studio](34-MASTER-DATA-FLOW-STUDIO.md)
- [Field Mapper + runtime](35-MAPPING-EDITOR-EXECUTION.md)
- [5 Sequence Diagram](36-SYNC-FLOW-SEQUENCES.md)
- [27 QA cases](37-SYNC-FLOW-QA-PLAN.md)
- [SQL reference](../db/design/006_node_sync_graphs.sql)
- [Connection Manager](30-CONNECTIONS-UX-FLOWS.md)

**Chưa có code UI/worker thực tế, Migration/RLS/GRANT cho các bảng mới, hay kết quả chạy thử.**

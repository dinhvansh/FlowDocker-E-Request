# FlowDocker E-Request — Tổng quan thiết kế (Tiếng Việt)

**Trạng thái:** Đang thiết kế, **chưa có phần mềm chạy thật**. **Ngày cập nhật:** 27/10/2026. Repo hiện PUBLIC nên chỉ lưu dữ liệu mẫu, không lưu thông tin bí mật của công ty.

## 1. Mục tiêu
E-Request là cổng quản lý các yêu cầu nội bộ: **Payment Request**, **Business Trip**, sau đó có thể thêm Expense Claim, Purchase Request, IT Request... Người quản trị tự thiết kế biểu mẫu và luồng duyệt mà không phải lập trình lại từng màn hình.

## 2. Những quyết định đã chốt
| Chủ đề | Phương án |
|---|---|
| Thiết kế biểu mẫu | Form.io JS Core, kéo thả và lưu JSON Schema |
| Thiết kế luồng | Synergy Codes Workflow Builder Community |
| Thực thi | Temporal (sau POC thực tế) |
| Rẽ nhánh | IF/ELSE, AND/OR, có bộ lọc điều kiện theo trường form |
| Duyệt | Web và Microsoft Teams Bot dùng chung một API/quyết định |
| Lưu trữ | PostgreSQL + storage adapter; SeaweedFS đang là ứng viên |
| PDF | Xuất và lưu bản PDF cuối **sau khi được phê duyệt** |
| Thanh toán | Approved khác Paid, Finance cập nhật Paid riêng |
| Word Review / ONLYOFFICE | Chuyển V2, chưa xây ở V1 |
| Digital Signature | V2 |
| E-Office Runtime V2 | **Không dùng** cho app E-Request mới |

Những bộ thư viện nêu trên là **ứng viên thiết kế**, chưa phải đã cài/tích hợp/kiểm thử. License của từng phiên bản vẫn phải xác minh trước khi phát hành.

## 3. Quy trình sử dụng

### Admin
`Tạo loại yêu cầu → Thiết kế form → Thiết kế workflow → Cấu hình IF/ELSE → Kiểm tra schema/graph → Publish phiên bản`.

### Nhân viên
`Chọn form → Nhập dữ liệu → Lưu nháp → Gửi → Theo dõi các bước duyệt → Tải PDF sau khi duyệt`.

### Người duyệt
`Nhận task → Mở trên Web hoặc Teams → Approve / Reject / Return with Comments → Hệ thống ghi một quyết định duy nhất → Chạy bước kế`.

### Finance (Payment)
`Kiểm tra chứng từ → Duyệt → Đã duyệt → Chờ thanh toán → Đang xử lý → Paid/Failed`. Không đồng nhất trạng thái Approved và Paid.

## 4. 8 sequence diagram
Tất cả xem trong **[Sequence Diagrams](08-SEQUENCE-DIAGRAMS.md)**:
1. Thiết kế và publish Form/Workflow.
2. Nhân viên tạo/gửi request.
3. Duyệt trên Web.
4. Duyệt trên Teams Bot.
5. Payment Request có IF số tiền.
6. Business Trip có IF quốc tế/nội địa.
7. Reject hoặc Return để sửa rồi gửi lại.
8. Duyệt xong → tạo PDF → lưu trữ/retry lỗi.

## 5. Các màn hình V1
Dashboard, New Request, My Requests, My Tasks, Request Detail/Timeline, Form Studio, Workflow Studio, Request Type Bindings, Administration, Finance Processing. Xem [UX](16-UX-INFORMATION-ARCHITECTURE.md).

## 6. An toàn và tính nhất quán
- Task và quyết định duyệt được lưu PostgreSQL, không lấy trạng thái Teams làm sự thật.
- Duyệt đồng thời phải có đúng **một quyết định hợp lệ**.
- Transaction ghi trạng thái + audit + outbox; Temporal nhận tín hiệu và retry.
- Request gửi đi phải khóa form version, workflow version và dữ liệu theo revision.
- Một request bị trả về phải tạo revision mới; mặc định duyệt lại từ đầu.
- Phân quyền kiểm tra tại API, tách theo role, request và từng trường; tránh lộ dữ liệu ngân hàng.
- PDF có hash, phiên bản dữ liệu và quyền tải về.

## 7. Lộ trình triển khai
P0 Nền tảng → P1 Form Studio → P2 Workflow/Temporal/IF-ELSE → P3 Web Task/API → P4 Payment+Trip → P5 Teams → P6 PDF → P7 UAT/Release. Xem [Roadmap](13-IMPLEMENTATION-ROADMAP.md).

## 8. Chưa chốt với nghiệp vụ
Ngưỡng duyệt bao nhiêu tiền, ai là HOD/CEO theo bộ phận, chính sách công tác trong/ngoài nước, thanh toán một phần, retention, gói Microsoft 365, quyền cài Teams App. Các số tiền trong tài liệu chỉ là **ví dụ**.

## 9. Cần Codex làm gì tiếp?
Đọc [AGENTS.md](../AGENTS.md), [Architecture](02-ARCHITECTURE.md), [POC Handoff](19-POC-HANDOFF.md) và [Acceptance Tests](14-ACCEPTANCE-TESTS.md), sau đó thực hiện một vertical slice thật trước: Form → Submit → IF/ELSE → Human Task → Web Approval với PostgreSQL + Temporal.


## 10. Tầng dữ liệu và phân quyền (bổ sung)
Tách `RBAC + quyền theo phạm vi + điều kiện theo task/trạng thái + Field-level Security + PostgreSQL RLS`. Manager không được xem mọi request chỉ vì là Manager: cần task đang được giao hoặc quyền đọc cấp riêng. Finance chỉ được xem thông tin nhạy cảm khi xử lý đúng nghiệp vụ; Tenant Admin không mặc định được xem dữ liệu ngân hàng. Dữ liệu request JSONB phải lọc trường ở backend trước khi trả về Web/Teams/export.

- [Thiết kế Authorization](20-AUTHORIZATION-ARCHITECTURE.md)
- [Ma trận phân quyền](21-PERMISSION-MATRIX.md)
- [Thiết kế tầng PostgreSQL](22-DATA-LAYER-PHYSICAL-DESIGN.md)
- [RLS & DB runtime](23-POSTGRESQL-RLS-OPERATIONS.md)
- [Bộ kiểm thử 28 tình huống](24-AUTHORIZATION-TEST-PLAN.md)
- [SQL schema/RLS tham chiếu](../db/design/)
- [Agent Skill dành cho Codex](../.agents/skills/authorization-design/SKILL.md)

**Chỉ là thiết kế**; chưa áp dụng migration/chạy test, nên không coi là đã bảo mật được production.

## 11. Master Data Hub — nguồn dữ liệu và đồng bộ
**Mới thiết kế, chưa tích hợp/chạy đồng bộ.** Nguồn dự kiến: Microsoft Entra Graph (định danh đăng nhập), HRIS/file HR được duyệt (mã nhân viên, phòng ban, người quản lý; chưa xác nhận nguồn thực tế), Epicor REST/BAQ hoặc SQL Server chỉ SELECT (Company, Vendor, Cost Center, mã Finance); các chính sách công tác do E-Request quản lý. Không để Form.io trực tiếp truy vấn ERP.

Luồng: Nguồn → Connector → Staging → Validate/Mapping → PostgreSQL canonical → API lookup → Form & Workflow. Incremental dùng Graph delta hoặc cursor đã được kiểm chứng; nếu không có thì full snapshot + diff + reconcile. Có retry, quarantine dữ liệu lỗi, quản lý token/checkpoint, bảo vệ dữ liệu nhân sự, ngăn vô hiệu hóa hàng loạt và không đổi lịch sử duyệt khi Manager đổi.

[Kiến trúc Master](25-MASTER-DATA-ARCHITECTURE.md) · [Sync](26-MASTER-DATA-SYNC-CONTRACTS.md) · [Governance](27-MASTER-DATA-GOVERNANCE.md) · [5 sơ đồ](28-MASTER-DATA-SEQUENCES.md) · [35 bài test](29-MASTER-DATA-TEST-PLAN.md) · [SQL](../db/design/003_master_data_schema.sql) · [Skill Codex](../.agents/skills/master-data-integration/SKILL.md).

## 12. Connections — màn hình IT cấu hình nguồn (bổ sung)
Connections khác Sync Pipeline: Connection chỉ lưu endpoint và secret vault reference có kiểm tra quyền đọc; Sync Pipeline mới quyết định nguồn bảng/danh mục, mapping và lịch chạy. Có **2 wizard**: 4 bước tạo connection (Select, Configure, Test, Save/Activate) và 5 bước tạo sync (Entity, Discover, Mapping, Schedule, Dry Run/Publish). Xem [Thiết kế thao tác tiếng Việt](33-CONNECTIONS-USER-FLOWS-VI.md), [chi tiết UX](30-CONNECTIONS-UX-FLOWS.md), [6 sequence diagrams](31-CONNECTIONS-SEQUENCE-DIAGRAMS.md), [API/data contract và 20 test](32-CONNECTIONS-API-DATA-CONTRACT.md), [DDL 005](../db/design/005_connections_extension.sql). Hiện là thiết kế, chưa có UI hay kết nối thật.

## 13. Flow Studio kéo thả node như n8n (thiết kế mới)
Mỗi Connection có thể tạo nhiều Sync Flow độc lập. Mỗi Sync Flow dùng React Flow: **Source → Parse JSON nếu cần → Split Items → RAW/Staging → Filter → Lookup/Join → Field Mapper kéo thả → Validate/Quarantine → Upsert Master**. Có màn JSON Input/Output Preview cho mỗi node, Dry Run không ghi DB, Publish phiên bản PAUSED rồi Run Initial Sync; bật lịch sau. Tách hẳn với Workflow phê duyệt nhân viên. Xem [màn hình tiếng Việt](38-SYNC-FLOW-STUDIO-VI.md) và [5 sequence diagram](36-SYNC-FLOW-SEQUENCES.md). Chưa code/chạy thực tế.

# FlowDocker Application Platform — Bộ vỏ dùng chung, chỉ làm ruột nghiệp vụ

**Trạng thái: ĐÃ THIẾT KẾ, CHƯA CODE/CHƯA TEST.** Ngày 28/10/2026.

## Tầm nhìn
Làm mới E-Request, IT Asset, Procurement hay HR Request thì **không viết lại** đăng nhập, sidebar/menu, danh mục Master Data, quản lý quyền, kết nối nguồn, đồng bộ, Form/Workflow Studio, audit và notification. Mỗi ứng dụng chỉ đăng ký module rồi tự xây các nghiệp vụ đặc thù.

```text
FLOWDOCKER PLATFORM (VỎ DÙNG CHUNG)
├── App Shell: Sidebar / Theme / Dashboard / i18n
├── Identity: Entra SSO / Users / Department / Manager
├── Permission Builder: role, action, data scope, field ACL, test quyền
├── Master Data Builder: tạo danh mục, thuộc tính, relationship, lookup, publish
├── Connection Manager: SQL / Epicor / Graph / HR / File
├── Data Flow Studio: Source → Raw → Map / Transform → Master
├── Form Studio / Workflow Studio
├── Audit / Notifications / Storage
└── FlowDocker UI/Graph/Mapper Component Library
         |
         +-- Ứng dụng 1: E-Request (Payment, Business Trip)
         +-- Ứng dụng 2: IT Asset (Asset Register/Assign/Transfer)
         +-- Ứng dụng 3: Procurement / HR Request (sau này)
```

## 1. Master Data Builder
Vào **Administration → Master Data → Entity Builder**.
- Tạo danh mục: Asset Category, Expense Type, Department, Vendor.
- Khai báo field: Code, Name, Active, Status, Number, Date, Enum, Reference; validation và unique key.
- Chọn chủ dữ liệu: tự nhập trong app hay đồng bộ HR/Entra/Epicor (nguồn nào sở hữu field nào).
- Phân quyền: ai xem, sửa, import, xóa mềm, trường nào phải che.
- Preview → Validate → Publish version.
- Hệ thống sinh **CRUD/list/lookup an toàn cho danh mục đơn giản**, không cần lập trình riêng mỗi màn.
- Finance transaction, Payment, Asset Transfer phải có service/transaction nghiệp vụ riêng, không dùng generic JSON CRUD để thay thế.

## 2. Permission Builder
Vào **Administration → Security → Permission Builder**.
- **App/Module Resource**: asset, request, master.vendor, sync.flow.
- **Actions**: READ, CREATE, EDIT, APPROVE, TRANSFER, EXPORT, PUBLISH...
- **Role Matrix**: phân quyền theo vai trò (Employee, Manager, Finance, IT, Admin).
- **Data Scope**: Tenant/Company/Department/Own/Assigned Task/Explicit Grant.
- **Field ACL**: READ, WRITE, MASK, DENY theo trạng thái, nghiệp vụ và loại dữ liệu.
- **Conditions**: IF role/cấp quản lý/task assignment/state → allow/deny. Điều kiện dạng typed rule, **không cho nhập SQL/JS tùy ý**.
- **Test Access**: giả lập xem user mẫu có quyền với record mẫu không; lý do ALLOW/DENY.
- **Publish**: version, diff, reviewer, audit và rollback bằng bản mới. Quản lý quyền ngay API/backend; nút UI ẩn không phải bảo mật.

## 3. Làm app mới IT Asset Management
1. Dùng **FlowDocker App Shell** để có menu, login, theme.
2. Tạo `AppManifest` cho `flowdocker.it-assets`, đăng ký module Inventory.
3. Qua Master Data Builder tạo `asset_category`, `location`, `asset_status` (hoặc chọn danh mục dùng chung đã cấp phép).
4. Qua Permission Builder đăng ký và cấu hình `asset:create`, `asset:assign`, `asset:transfer`, `asset:dispose`; phân phạm vi theo location/dept.
5. Developer **chỉ phải viết phần ruột**: asset registration, bàn giao, điều chuyển, thanh lý, báo cáo nghiệp vụ, validation và migrations chuyên biệt.
6. Chạy test 2 app, 2 tenant, role/scopes, dữ liệu nhạy cảm và trải nghiệm UI; chưa thể tuyên bố production khi chưa QA.

## 4. Ranh giới đúng để dùng lâu dài
- Tái sử dụng **giao diện + framework + service chuẩn hóa**, không copy toàn bộ E-Request qua repo mới.
- Thư viện base **không import** business code của Payment hay Asset.
- Flow Studio đồng bộ và Approval Studio cùng dùng canvas/component, nhưng **engine xử lý riêng**.
- Chia `tenant_id + app_id`, không tự cho admin app A xem dữ liệu app B.
- Master Data chung muốn share phải được owner cấp; dữ liệu ERP phải read-only.
- Không tự sinh quyền truy cập nhạy cảm chỉ vì tạo màn CRUD.
- Tách repo `flowdocker-platform` khi package API ổn, test có app thứ hai; hiện chưa tạo repo/package.

## Tài liệu kỹ thuật
- [Kiến trúc nền tảng](41-FLOWDOCKER-APPLICATION-PLATFORM.md)
- [Master Data Builder](42-REUSABLE-MASTER-DATA-BUILDER.md)
- [Permission Builder](43-REUSABLE-PERMISSION-BUILDER.md)
- [App Manifest và extension functions](44-APP-MODULE-CONTRACT.md)
- [Roadmap và QA nền tảng](45-PLATFORM-ACCEPTANCE-AND-ROADMAP.md)
- [SQL tham chiếu cấu trúc app/policy/catalog](../db/design/007_platform_foundation.sql)
- [Skill Codex nền tảng](../.agents/skills/flowdocker-app-platform/SKILL.md)

**Các file trên chỉ mô tả thiết kế mục tiêu; không phải code đã triển khai, migration đã chạy hay bảo mật đã nghiệm thu.**

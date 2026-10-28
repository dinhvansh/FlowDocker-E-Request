# PR 1 — Frontend Foundation: UX và ranh giới triển khai

**Phạm vi:** frontend React với dữ liệu tổng hợp. Đây là prototype có tương tác và package UI nội bộ. Không có API, xác thực, migration, ERP hoặc PDP/PEP/RLS đang chạy.

## 1. UX Research

Nguồn: docs/41–50, AGENTS.md và phản hồi owner được ghi trong docs/48. Đối tượng giả định: platform admin cấu hình app, data steward quản lý entity, security admin cấu hình vai trò. Chưa có phỏng vấn, quan sát hoặc đo thời gian hoàn thành tác vụ; các nhận định về hành vi người dùng **chưa xác minh**.

Tác vụ ưu tiên PR 1: tìm entity → sửa schema → kiểm tra lỗi; chọn role → đổi action/scope → thử ALLOW/DENY. Dữ liệu phải phân biệt catalog nội bộ và mirror từ nguồn ngoài. Chỉ cần thao tác demo cục bộ; phát hành quyền và schema cần backend/reviewer nên không khả dụng.

## 2. UI/UX Design

- Điều hướng theo Workspace / Dữ liệu / Bảo mật; header gọn với app và nhãn DEMO.
- Master Builder: entity explorer, schema/records/source/versions, inspector trường.
- Permission Builder: role explorer, capability matrix, data scope, field rules, Test Access liên kết với role.
- Màn hình PR 2/3 hiển thị trạng thái kế hoạch rõ ràng, không có CTA giả.
- Token riêng, nền trắng, đỏ là màu nhấn theo phản hồi owner; màu ngữ nghĩa cho success/warning vẫn tách biệt. Viền mỏng, không hero hay KPI trang trí. Responsive: dưới 980px inspector chuyển xuống dưới; điện thoại đặt danh sách lên trên editor.

**Chọn stack:** Vite + React + TypeScript cho frontend độc lập, nhanh và dễ đóng gói workspace. HTML control có ngữ nghĩa + CSS token làm nền; dropdown dùng một adapter `@flowdocker/ui` trên Radix Select để có menu tùy chỉnh, keyboard, focus và trạng thái disabled nhất quán, không dùng native `<select>`. Tabular data hiện nhỏ nên native table đủ; nếu scale/column state phát triển thì đánh giá TanStack Table. React Flow dành cho canvas PR 2. Lucide chỉ cung cấp icon; không coi là mã FlowDocker. Cần rà soát giấy phép chính xác tại phiên bản khóa trước phân phối.

## 3. Design Audit

| Phát hiện docs/48 | Cách xử lý PR 1 |
|---|---|
| A-01/A-02: hero, card, shadow | Workspace dạng quick links + bảng; editor phẳng, viền tách pane |
| A-03: header quá lớn | Page toolbar thấp, nội dung chiếm vùng còn lại |
| A-05: action mock dễ hiểu nhầm | Nhãn DEMO, publish bị disabled, Test Access ghi SIMULATED |
| A-06: scope tách xa matrix | Scope ngay dưới matrix, kết quả ở inspector cùng màn |
| A-07: schema/source/version chưa nổi | Metadata ở object header và tab riêng |
| A-08: chữ nhỏ | Body 15px, font Segoe UI; metadata 11–12px vẫn cần đánh giá với operator |
| A-09: drag thiếu keyboard | Không có drag trong PR 1; bảng có Enter/Space, các control là native |

P0 của quyền thật vẫn còn đến khi backend áp dụng policy. Không coi ma trận frontend là enforcement.

## 4. Interactive Prototype

Hash navigation, tìm entity/role, tạo entity/role, chỉnh trường, validate, chọn scope/action/field rule, mô phỏng ALLOW/DENY. Mock service typed lưu vào `localStorage`; dữ liệu tổng hợp. Không có sync sang server. Trạng thái empty/error/disabled được render qua các primitive UI. Keyboard: tab qua control, Enter/Space chọn dòng, Escape đóng modal. Cần browser QA và feedback owner trước khi chốt thiết kế.

## 5. Design to Code

`@flowdocker/ui`: button, badge, input, tabs, table, modal, notice, Select và theme token, có isolated examples. `@flowdocker/app-shell`: chrome và điều hướng. `@flowdocker/app-contracts`: entity/role/decision types và validator mô phỏng. `@flowdocker/master-builder`, `@flowdocker/permission-builder`: UI có typed props và service callback; không import E-Request API. Chỉ tạo các package đang có code. Contract service backend, audit, migration và một host thứ hai **chưa triển khai**, nên chưa gọi các module này là platform-ready.

## Impact map và ranh giới

| Thành phần | PR 1 |
|---|---|
| UI | Thêm app shell, 2 builder, token và primitive |
| API/schema/migration | Không đổi |
| Temporal/Teams/storage | Không đổi |
| Security | Mô phỏng deny-by-default; không bảo vệ dữ liệu thật |
| Test | Typecheck, lint, unit/interaction và browser QA |

**Reusable component impact:** các primitive đã được trích thành package và dùng ở hai builder. Catalog schema, role matrix và access fixture là domain của builder tương ứng. Không có import Temporal/Epicor trong package dùng chung.

## QA thực tế

- `npm run build`: PASS; bundle JS khoảng 263 KB trước gzip.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS, 2 file / 6 test.
- `npm audit --omit=dev`: 0 vulnerability; sau khi nâng Vitest, `npm install` cũng báo 0 vulnerability toàn workspace.
- Playwright CLI trên Chromium: tạo `Asset Site`, tự sinh `asset_site`, validate báo thiếu trường, thêm trường `field_1`; Manager + Approval Task/APPROVE trả **DENY** khi chưa có active task và **ALLOW** khi tick active task. Đây là kết quả mô phỏng frontend.
- Kiểm tra điều hướng trên mobile, light/dark, và viewport 1366×768, 1440×900, 1920×1080, 768×1024, 375×812. Console sau reload: 0 error/0 warning.
- Ở tablet, ma trận có cuộn ngang **bên trong bảng** để giữ ô checkbox đủ rộng. Trên điện thoại, entity/role explorer đứng trước editor và inspector; tác vụ cấu hình dài cần cuộn dọc.

### Ảnh để owner xem

- [Workspace 1366 sáng](../output/playwright/workspace-1366-light.png)
- [Master Builder 1440 sáng](../output/playwright/master-1440-light.png), [768 tối](../output/playwright/master-768-dark.png), [375 tối](../output/playwright/master-375-dark.png)
- [Master Builder với dropdown mới](../output/playwright/master-1440-dropdown.png)
- [Permission Builder 1440 sáng](../output/playwright/permissions-1440-light.png), [1920 sáng](../output/playwright/permissions-1920-light.png), [768 sáng](../output/playwright/permissions-768-light.png), [375 tối](../output/playwright/permissions-375-dark.png)
- [Dropdown tùy chỉnh ở 375px](../output/playwright/permissions-375-dropdown.png)

### Điều chỉnh theo phản hồi owner

Ngày 2026-10-28: loại bỏ toàn bộ native `<select>` trong app và examples; thay bằng FlowDocker Select trên Radix. Thay DM Sans/IBM Plex Mono tải ngoài bằng Segoe UI/Arial, tăng cỡ chữ ở nội dung chính và metadata, đổi shell và accent sang trắng–đỏ. Playwright Chromium xác nhận menu mở, chọn bằng ArrowDown/Enter, Test Access vẫn chạy; screenshot desktop, tablet, mobile và dark mode được chụp lại. Console: 0 error/0 warning.

`@radix-ui/react-select` được khóa tại bản giải quyết 2.4.1 trong `package-lock.json`, giấy phép MIT. Bộ dropdown tăng JS bundle khoảng 91 KB trước gzip so với bản HTML control trước đó; đổi lại có menu thống nhất và hỗ trợ bàn phím/focus. Chưa thực hiện đánh giá giấy phép toàn bộ dependency cho phân phối thương mại.

### Chưa xong / cần review

Chưa có nghiên cứu người dùng thực tế hoặc owner duyệt thiết kế; metadata 11–12px cần kiểm tra với người dùng ở zoom 125–150%. Chưa có Storybook, second independent host, API, kiểm thử phân quyền server hoặc CI. Isolated examples chỉ chứng minh UI primitives có thể render riêng, không chứng minh toàn platform tái sử dụng được. PR 1 chỉ bàn giao frontend prototype, không đại diện cho hệ thống production.

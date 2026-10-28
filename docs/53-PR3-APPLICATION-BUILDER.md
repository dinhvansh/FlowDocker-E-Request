# PR 3 — Application Builder frontend

## 1. UX Research
Desk research: README và docs/44–50; chưa có phỏng vấn operator. Tác vụ giả định: tạo ứng dụng → chọn module → kiểm tra cấu hình → lưu nháp → mở lại → xem manifest.

## 2. UI/UX Design
Dùng bảng ứng dụng và inspector manifest, modal tạo nháp. Tái sử dụng Button, Field, Input, Checkbox, DataTable, Modal, Notice của @flowdocker/ui. Module hiện có và module đang thiết kế phải phân biệt rõ. Không tự cấp quyền hoặc đăng ký backend handler.

## 3. Design Audit
P1: route applications hiện là placeholder; CTA tổng quan bị vô hiệu. Thay bằng danh sách và tạo nháp cục bộ. P0 khi production: manifest chưa có server registry/PDP nên publish luôn bị khóa. Kiểm tra ID trùng, module bắt buộc, version và lỗi lưu storage.

## 4. Interactive Prototype
Phạm vi PR3: synthetic E-Request/IT Assets fixtures, tìm kiếm, tạo nháp, chọn module, kiểm tra, lưu localStorage, chọn hàng xem manifest. Chưa chuyển workspace hay cách ly dữ liệu thật; link module chỉ mở màn hình demo dùng chung và ghi rõ ranh giới đó.

## 5. Design to Code / Impact map
Shared contracts: AppDraft, module catalog và validation thuần trong @flowdocker/app-contracts. Page adapter: applications.tsx; dùng lại UI và AppShell. Không thay schema DB/API/Temporal/Teams/storage server/security/migrations. Không thêm dependency. Chưa đạt platform-ready/production/second host/backend authorization. Chưa có owner design review hoặc operator UAT.

## Kiểm tra thực tế
Base SHA: c6bd7f7 (thay đổi PR3 chưa commit). `npm run typecheck`, `npm run lint`, `npm test` (5 files / 16 tests), `npm run build` đạt. Playwright mở #applications, tạo synthetic app, xác nhận inspector rồi reload và tìm lại App ID; đã xóa riêng dữ liệu QA ở browser automation sau kiểm tra. Chưa xác nhận UAT, screenshot visual review đủ mọi breakpoint hoặc lỗi storage trong trình duyệt thực.

## Bổ sung: chỉnh sửa và responsive
- Sửa tên/version/module của bản nháp; App ID khóa sau khi tạo. Update thay thế đúng hàng thay vì append.
- Mỗi module có mô tả mục đích bằng tiếng Việt theo phản hồi owner; không thay hợp đồng thực thi backend.
- QA browser: mở sửa E-Request, đổi tên synthetic, kiểm tra hợp lệ, lưu, reload tìm thấy tên mới và kiểm tra vẫn có 2 app. Đã xóa dữ liệu synthetic của browser QA.
- Phát hiện modal cao khiến footer ngoài viewport 375px; sửa @flowdocker/ui Modal bằng chiều cao tối đa + body cuộn. Phát hiện Notice tràn 5px; đặt margin phù hợp trong Application Builder. Đo lại viewport/document đều 375px. Chưa kiểm tra đầy đủ mọi breakpoint/UAT.
- Reusable component impact: bổ sung description trong shared module catalog; sửa layout Modal dùng chung, không thêm dependency hoặc API.

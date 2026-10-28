# PR 2 — Connections, Master Data Flow Studio và User Profile

**Trạng thái:** frontend prototype trên dữ liệu tổng hợp. Không có API, vault, Entra login, connector worker, RAW staging, PostgreSQL master upsert hay checkpoint chạy thật.

## 1. UX Research

Nguồn: phản hồi owner muốn tiếp tục PR 2 và bổ sung User Profile; docs/30–38, 47–50 và PR 1. Chưa có phỏng vấn hoặc quan sát operator. Tác vụ giả định: tạo bản nháp connection, xem yêu cầu test thật, thiết kế flow từ Source qua RAW/Mapping/Validate tới Master, xem dry run an toàn, mở hồ sơ từ avatar.

## 2. UI/UX Design

- Connections: danh sách và chi tiết trên desktop, wizard 4 bước chọn loại → metadata → trạng thái kiểm tra → lưu nháp. Không có ô mật khẩu/token/URL thật trên frontend.
- Flow Studio: palette node, canvas React Flow, inspector và Data Inspector. Node được kéo/nối; mapper chọn trường bằng dropdown shadcn/Radix; flow draft lưu localStorage. Dry run chỉ biến đổi 2 dòng mẫu. Publish bị vô hiệu.
- Profile: truy cập bằng avatar ở chân sidebar; trên mobile mở menu rồi bấm avatar ở chân menu. Hiển thị họ tên, email công việc, mã nhân viên, phòng ban, chức danh, quản lý, vai trò (đều là dữ liệu tổng hợp) và tùy chọn theme. Nút Đổi mật khẩu mở dialog có các trường chuẩn nhưng khóa nhập/lưu cho tới khi có dịch vụ xác thực; demo không nhận hoặc lưu mật khẩu. Không cho sửa tên, phòng ban, email hoặc vai trò khi chưa có nguồn danh tính tin cậy.
- Thiết kế tiếp tục dùng font Inter, nền trắng và điểm nhấn đỏ. Mobile chuyển các pane thành khối dọc.

## 3. Design Audit và giới hạn

| Mức | Phát hiện | Cách xử lý |
|---|---|---|
| P0 | Dễ hiểu nhầm Test Connection/Dry Run là chạy thật | Nút test/activate/publish bị khóa; nhãn demo ở đầu màn và trạng thái trong chi tiết |
| P0 | Profile có thể khiến người dùng tưởng đã đăng nhập | Ghi rõ tài khoản mẫu, Entra chưa kết nối và quyền chỉ mô phỏng |
| P1 | Flow có thể tạo cạnh sai thứ tự hoặc vòng lặp | Kiểm tra cấu trúc chặn dry run; compiler/backend thật vẫn chưa có |
| P1 | Preview có thể lộ dữ liệu nhạy cảm | Chỉ dùng hai bản ghi tổng hợp cố định; không có fetch nguồn ngoài |

## 4. Interactive Prototype

Connections: tạo và tìm bản nháp, chọn chi tiết, đi qua 4 bước; chỉ metadata công khai được lưu localStorage. Flow: thêm/chọn/xóa/kéo/nối node, ánh xạ trường bằng dropdown, lưu/reload draft và xem output mẫu; cấu trúc thiếu node, thiếu đường đi hoặc vòng lặp được báo lỗi. Profile: mở từ avatar ở góc trái dưới, xem trường nhân sự mẫu, mở/đóng dialog Đổi mật khẩu và đổi theme; chỉ theme được lưu localStorage. Theo phản hồi owner, bỏ nhóm “Tài khoản” trong menu và avatar ở góc phải trên; breadcrumb vẫn hiển thị “Hồ sơ cá nhân” khi mở trang.

Ảnh QA: [Connections desktop](../output/playwright/pr2-connections-desktop.png), [Connections mobile](../output/playwright/pr2-connections-mobile.png), [Flow Studio desktop](../output/playwright/pr2-flow-desktop.png), [Flow Studio mobile](../output/playwright/pr2-flow-mobile.png), [Profile desktop](../output/playwright/pr2-profile-desktop.png), [Profile mobile](../output/playwright/pr2-profile-mobile.png), [dialog mật khẩu desktop](../output/playwright/pr2-profile-password-dialog.png), [dialog mật khẩu mobile](../output/playwright/pr2-profile-password-mobile.png). Đã thử wizard lưu nháp, mở mapper, dry run mẫu, bấm avatar ở chân sidebar trên desktop/mobile, mở/đóng dialog bằng Escape, điều hướng mobile tự đóng và đổi theme trong Profile. Chromium console: 0 error, 0 warning. Trên mobile canvas là vùng pan/zoom ngang để tránh thu node xuống cỡ chữ không đọc được.

## 5. Design to Code / Impact map

`@flowdocker/flow-canvas` là visual primitive typed, không chứa Epicor/Temporal/API E-Request. `apps/e-request-web/src/connections.tsx`, `flow-studio.tsx`, `profile.tsx` là các adapter/page của host đầu tiên. Hồ sơ nhận typed props; fixture tổng hợp trong `demo-profile.ts` được dùng chung cho trang và avatar của `@flowdocker/app-shell`, để sau này thay bằng dữ liệu đã xác thực. `@xyflow/react` là MIT third-party; giữ attribution trên canvas. Chưa có Storybook hoặc host thứ hai nên không gọi package này là platform-ready.

| Lớp | Thay đổi |
|---|---|
| UI | 3 route và thành phần trên |
| Contract/schema/migration | Không đổi |
| API/worker/Temporal/Teams/storage | Không triển khai |
| Security | Không nhận credential; profile mẫu không phải xác thực hay cấp quyền |
| Test | Typecheck, lint, unit validation và browser QA frontend |

**Reusable component impact:** tái sử dụng `@flowdocker/ui` Button/Select/Notice/Badge; thêm `@flowdocker/flow-canvas` với props nodes/edges/callback typed. Connection wizard, dry run mẫu và profile vẫn thuộc app demo. Backend connection, real test, source discovery, graph compiler, mapper DSL, bounded preview, immutable publish, staging/checkpoint, RLS và worker recovery **NOT DONE**. Các gate CON-01–20 và FLOW-01–27 chưa đạt.

Kiểm tra frontend ở nhánh PR 2: `npm run lint`, `npm run typecheck`, `npm test` (4 file / 13 test), `npm run format:check`, `npm run build` đều đạt. Flow Studio tải theo route riêng; build tạo chunk Flow Studio khoảng 191 kB và chunk chính khoảng 430 kB trước gzip. Đây không phải bằng chứng về test tích hợp connector hoặc backend.

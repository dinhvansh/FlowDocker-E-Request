import { Moon, Shield, Sun, UserRound } from "lucide-react";
import { Badge, Button, Notice } from "@flowdocker/ui";

export function ProfilePage({
  theme,
  onThemeChange,
}: {
  theme: "light" | "dark";
  onThemeChange(): void;
}) {
  return (
    <section className="fd-screen fd-pr2-screen fd-profile-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">TÀI KHOẢN / HỒ SƠ</div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Thông tin hiển thị và tùy chọn giao diện cho phiên demo.</p>
        </div>
        <Badge tone="warning">Tài khoản mẫu</Badge>
      </div>
      <div className="fd-profile-layout">
        <div className="fd-profile-card">
          <div className="fd-profile-identity">
            <span className="fd-profile-large-avatar">VA</span>
            <div>
              <h2>Platform Admin</h2>
              <p>Vai trò minh họa · E-Request demo</p>
            </div>
          </div>
          <div className="fd-profile-rows">
            <div>
              <UserRound size={18} />
              <span>Danh tính</span>
              <strong>Chưa kết nối Entra ID</strong>
            </div>
            <div>
              <Shield size={18} />
              <span>Quyền truy cập</span>
              <strong>Chỉ mô phỏng trên frontend</strong>
            </div>
            <div>
              <span className="fd-profile-row-icon">E</span>
              <span>Ứng dụng hiện tại</span>
              <strong>E-Request</strong>
            </div>
          </div>
          <Notice tone="warning">
            Hồ sơ này dùng dữ liệu tổng hợp. Việc chỉnh tên, email, phòng ban và
            vai trò phải lấy từ nguồn danh tính được xác thực; demo không cho tự
            sửa các thông tin đó.
          </Notice>
        </div>
        <aside className="fd-profile-preferences">
          <h2>Tùy chọn giao diện</h2>
          <p>Được lưu trong trình duyệt này.</p>
          <div>
            <span>Chế độ hiển thị</span>
            <Badge tone="neutral">{theme === "light" ? "Sáng" : "Tối"}</Badge>
          </div>
          <Button onClick={onThemeChange}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />} Chuyển
            sang giao diện {theme === "light" ? "tối" : "sáng"}
          </Button>
        </aside>
      </div>
    </section>
  );
}

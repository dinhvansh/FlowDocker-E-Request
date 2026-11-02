import { useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  Fingerprint,
  KeyRound,
  Mail,
  Moon,
  Shield,
  Sun,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Badge, Button, Field, Input, Modal, Notice } from "@flowdocker/ui";
import type { UserProfile } from "./demo-profile";

export function ProfilePage({
  profile,
  theme,
  onThemeChange,
}: {
  profile: UserProfile;
  theme: "light" | "dark";
  onThemeChange(): void;
}) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  return (
    <section className="fd-screen fd-pr2-screen fd-profile-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">TÀI KHOẢN / HỒ SƠ</div>
          <h1>Hồ sơ cá nhân</h1>
          <p>Thông tin nhân sự, tài khoản và tùy chọn của bạn.</p>
        </div>
        <Badge tone="warning">Dữ liệu mẫu</Badge>
      </div>
      <div className="fd-profile-layout">
        <div className="fd-profile-card">
          <div className="fd-profile-identity">
            <span className="fd-profile-large-avatar">{profile.initials}</span>
            <div>
              <h2>{profile.name}</h2>
              <p>
                {profile.position} · {profile.department}
              </p>
            </div>
          </div>
          <div className="fd-profile-section-heading">
            <h3>Thông tin cá nhân</h3>
            <span>Chỉ xem · dữ liệu tổng hợp</span>
          </div>
          <div className="fd-profile-rows">
            <div>
              <UserRound size={18} />
              <span>Họ và tên</span>
              <strong>{profile.name}</strong>
            </div>
            <div>
              <Mail size={18} />
              <span>Email công việc</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <Fingerprint size={18} />
              <span>Mã nhân viên</span>
              <strong>{profile.employeeCode}</strong>
            </div>
            <div>
              <Building2 size={18} />
              <span>Phòng ban</span>
              <strong>{profile.department}</strong>
            </div>
            <div>
              <BriefcaseBusiness size={18} />
              <span>Chức danh</span>
              <strong>{profile.position}</strong>
            </div>
            <div>
              <UsersRound size={18} />
              <span>Quản lý trực tiếp</span>
              <strong>{profile.manager}</strong>
            </div>
            <div>
              <Shield size={18} />
              <span>Vai trò ứng dụng</span>
              <strong>{profile.role}</strong>
            </div>
          </div>
          <Notice tone="warning">
            Thông tin ở đây là dữ liệu mẫu. Khi có đăng nhập, tên và email sẽ
            lấy từ Entra ID; phòng ban, chức danh và quản lý cần nguồn HR đã
            được xác nhận. Người dùng không tự sửa các trường này trong bản
            demo.
          </Notice>
        </div>
        <div className="fd-profile-side">
          <aside className="fd-profile-security">
            <div className="fd-profile-side-title">
              <KeyRound size={19} />
              <h2>Bảo mật tài khoản</h2>
            </div>
            <p>
              Phương thức đăng nhập: <strong>Chưa kết nối</strong>
            </p>
            <p>Mật khẩu không được lưu trong ứng dụng hoặc trình duyệt demo.</p>
            <Button onClick={() => setPasswordOpen(true)}>
              <KeyRound size={16} /> Đổi mật khẩu
            </Button>
          </aside>
          <aside className="fd-profile-preferences">
            <h2>Tùy chọn giao diện</h2>
            <p>Được lưu trong trình duyệt này.</p>
            <div>
              <span>Chế độ hiển thị</span>
              <Badge tone="neutral">{theme === "light" ? "Sáng" : "Tối"}</Badge>
            </div>
            <Button onClick={onThemeChange}>
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}{" "}
              Chuyển sang giao diện {theme === "light" ? "tối" : "sáng"}
            </Button>
          </aside>
        </div>
      </div>
      {passwordOpen && (
        <Modal
          title="Đổi mật khẩu"
          onClose={() => setPasswordOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                disabled
                title="Cần dịch vụ xác thực thật"
              >
                Lưu mật khẩu mới
              </Button>
            </>
          }
        >
          <div className="fd-password-form">
            <Notice tone="warning">
              Chưa có dịch vụ đăng nhập nên bản demo không nhận mật khẩu. Khi
              tích hợp Entra ID, việc đổi mật khẩu sẽ thực hiện qua hệ thống
              danh tính của tổ chức.
            </Notice>
            <Field label="Mật khẩu hiện tại">
              <Input
                type="password"
                autoComplete="current-password"
                disabled
                placeholder="Chưa khả dụng"
              />
            </Field>
            <Field label="Mật khẩu mới">
              <Input
                type="password"
                autoComplete="new-password"
                disabled
                placeholder="Chưa khả dụng"
              />
            </Field>
            <Field label="Nhập lại mật khẩu mới">
              <Input
                type="password"
                autoComplete="new-password"
                disabled
                placeholder="Chưa khả dụng"
              />
            </Field>
          </div>
        </Modal>
      )}
    </section>
  );
}

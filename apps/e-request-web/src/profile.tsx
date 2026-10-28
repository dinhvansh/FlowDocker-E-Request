import { useI18n } from "@flowdocker/i18n";
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
  const { t } = useI18n();

  const [passwordOpen, setPasswordOpen] = useState(false);
  return (
    <section className="fd-screen fd-pr2-screen fd-profile-screen">
      <div className="fd-page-toolbar">
        <div>
          <div className="fd-overline">{t("TÀI KHOẢN / HỒ SƠ")}</div>
          <h1>{t("Hồ sơ cá nhân")}</h1>
          <p>{t("Thông tin nhân sự, tài khoản và tùy chọn của bạn.")}</p>
        </div>
        <Badge tone="warning">{t("Dữ liệu mẫu")}</Badge>
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
            <h3>{t("Thông tin cá nhân")}</h3>
            <span>{t("Chỉ xem · dữ liệu tổng hợp")}</span>
          </div>
          <div className="fd-profile-rows">
            <div>
              <UserRound size={18} />
              <span>{t("Họ và tên")}</span>
              <strong>{profile.name}</strong>
            </div>
            <div>
              <Mail size={18} />
              <span>{t("Email công việc")}</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <Fingerprint size={18} />
              <span>{t("Mã nhân viên")}</span>
              <strong>{profile.employeeCode}</strong>
            </div>
            <div>
              <Building2 size={18} />
              <span>{t("Phòng ban")}</span>
              <strong>{profile.department}</strong>
            </div>
            <div>
              <BriefcaseBusiness size={18} />
              <span>{t("Chức danh")}</span>
              <strong>{profile.position}</strong>
            </div>
            <div>
              <UsersRound size={18} />
              <span>{t("Quản lý trực tiếp")}</span>
              <strong>
                {profile.manager === "Chưa đồng bộ từ HR"
                  ? t("Chưa đồng bộ từ HR")
                  : profile.manager}
              </strong>
            </div>
            <div>
              <Shield size={18} />
              <span>{t("Vai trò ứng dụng")}</span>
              <strong>{profile.role}</strong>
            </div>
          </div>
          <Notice tone="warning">
            {t(
              "Thông tin ở đây là dữ liệu mẫu. Khi có đăng nhập, tên và email sẽ lấy từ Entra ID; phòng ban, chức danh và quản lý cần nguồn HR đã được xác nhận. Người dùng không tự sửa các trường này trong bản demo.",
            )}
          </Notice>
        </div>
        <div className="fd-profile-side">
          <aside className="fd-profile-security">
            <div className="fd-profile-side-title">
              <KeyRound size={19} />
              <h2>{t("Bảo mật tài khoản")}</h2>
            </div>
            <p>
              {t("Phương thức đăng nhập:")}
              <strong>{t("Chưa kết nối")}</strong>
            </p>
            <p>
              {t(
                "Mật khẩu không được lưu trong ứng dụng hoặc trình duyệt demo.",
              )}
            </p>
            <Button onClick={() => setPasswordOpen(true)}>
              <KeyRound size={16} />
              {t("Đổi mật khẩu")}
            </Button>
          </aside>
          <aside className="fd-profile-preferences">
            <h2>{t("Tùy chọn giao diện")}</h2>
            <p>{t("Được lưu trong trình duyệt này.")}</p>
            <div>
              <span>{t("Chế độ hiển thị")}</span>
              <Badge tone="neutral">
                {theme === "light" ? t("Sáng") : t("Tối")}
              </Badge>
            </div>
            <Button onClick={onThemeChange}>
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}{" "}
              {theme === "light"
                ? t("Bật giao diện tối")
                : t("Bật giao diện sáng")}
            </Button>
          </aside>
        </div>
      </div>
      {passwordOpen && (
        <Modal
          title={t("Đổi mật khẩu")}
          onClose={() => setPasswordOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
                {t("Đóng")}
              </Button>
              <Button
                variant="primary"
                disabled
                title={t("Cần dịch vụ xác thực thật")}
              >
                {t("Lưu mật khẩu mới")}
              </Button>
            </>
          }
        >
          <div className="fd-password-form">
            <Notice tone="warning">
              {t(
                "Chưa có dịch vụ đăng nhập nên bản demo không nhận mật khẩu. Khi tích hợp Entra ID, việc đổi mật khẩu sẽ thực hiện qua hệ thống danh tính của tổ chức.",
              )}
            </Notice>
            <Field label={t("Mật khẩu hiện tại")}>
              <Input
                type="password"
                autoComplete="current-password"
                disabled
                placeholder={t("Chưa khả dụng")}
              />
            </Field>
            <Field label={t("Mật khẩu mới")}>
              <Input
                type="password"
                autoComplete="new-password"
                disabled
                placeholder={t("Chưa khả dụng")}
              />
            </Field>
            <Field label={t("Nhập lại mật khẩu mới")}>
              <Input
                type="password"
                autoComplete="new-password"
                disabled
                placeholder={t("Chưa khả dụng")}
              />
            </Field>
          </div>
        </Modal>
      )}
    </section>
  );
}

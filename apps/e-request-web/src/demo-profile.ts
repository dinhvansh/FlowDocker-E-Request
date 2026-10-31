export type UserProfile = {
  name: string;
  initials: string;
  sidebarSubtitle: string;
  email: string;
  employeeCode: string;
  department: string;
  position: string;
  manager: string;
  role: string;
};

/** Synthetic fixture only; real identity and HR fields require verified APIs. */
export const demoCurrentPersonId = "demo_current_person";
export const demoProfile: UserProfile = {
  name: "Nguyễn Văn A",
  initials: "VA",
  sidebarSubtitle: "Phòng CNTT · Demo",
  email: "nguyen.van.a@example.com",
  employeeCode: "DEMO-001",
  department: "Phòng Công nghệ thông tin",
  position: "Chuyên viên quản trị nền tảng",
  manager: "Chưa đồng bộ từ HR",
  role: "Platform Admin (demo)",
};

/** Synthetic form context; unknown manager is deliberately omitted. */
export const demoFormRuntimeContext = {
  currentUserId: demoCurrentPersonId,
  currentUser: {
    name: demoProfile.name,
    email: demoProfile.email,
    employeeCode: demoProfile.employeeCode,
    department: demoProfile.department,
    position: demoProfile.position,
  },
};

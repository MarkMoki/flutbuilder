export type Role = "user" | "admin";
export function canDownloadApk(role: Role) { return true; }
export function canManageTemplates(role: Role) { return role === "admin"; }
export function isAdminEmail(email?: string | null) {
  const adminList = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);
  return !!email && adminList.includes(email);
}



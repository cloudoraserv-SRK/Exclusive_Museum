import { requireAdminSession } from "./auth-guard.js";

const user = await requireAdminSession();
console.log("Admin logged in:", user.email);

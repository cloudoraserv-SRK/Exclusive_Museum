import { requireAdminSession } from "./auth-guard.js";
import { initLocaleExperience } from "../locale.js";

const user = await requireAdminSession();
initLocaleExperience({ scope: "admin", containerSelector: ".admin-header" });
console.log("Admin logged in:", user.email);

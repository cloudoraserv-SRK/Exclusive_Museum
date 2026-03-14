import { getFavoriteCount, getWishlistSyncMode, updateFavoritesCount } from "./favorites.js";
import { initAccountSessionSync, signInWithGoogle, signOutUser, updateAccountUI } from "./user-auth.js";

const accountHeading = document.getElementById("accountHeading");
const accountLead = document.getElementById("accountLead");
const accountMeta = document.getElementById("accountMeta");
const accountMessage = document.getElementById("accountMessage");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const signOutBtn = document.getElementById("signOutBtn");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init().catch(console.error);
  });
} else {
  init().catch(console.error);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function initHeader() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav-links");
  hamburger?.addEventListener("click", () => nav?.classList.toggle("active"));
}

async function renderAccount() {
  const user = await updateAccountUI();
  const favoriteCount = getFavoriteCount();
  const syncMode = await getWishlistSyncMode(user?.id || "guest");
  const syncLabel = syncMode === "cloud" ? "Cloud synced" : "This device";

  if (!user) {
    accountHeading.textContent = "Guest Session";
    accountLead.textContent = "Sign in with Google to unlock a cleaner repeat-visit experience.";
    accountMeta.innerHTML = `
      <div>
        <span>Saved Items On This Device</span>
        <strong>${favoriteCount} pieces ready</strong>
      </div>
      <div>
        <span>Checkout Readiness</span>
        <strong>Guest browsing active</strong>
      </div>
      <div>
        <span>Wishlist Sync</span>
        <strong>This device only</strong>
      </div>
    `;
    googleLoginBtn.hidden = false;
    signOutBtn.hidden = true;
    return;
  }

  accountHeading.textContent = user.user_metadata?.full_name || user.email || "Signed In";
  accountLead.textContent = "Your account session is active and ready for future wishlist sync, order history, and faster return visits.";
  accountMeta.innerHTML = `
    <div>
      <span>Email</span>
      <strong>${user.email || "-"}</strong>
    </div>
    <div>
      <span>Saved Items</span>
      <strong>${favoriteCount} pieces ready</strong>
    </div>
    <div>
      <span>Provider</span>
      <strong>${user.app_metadata?.provider || "google"}</strong>
    </div>
    <div>
      <span>Wishlist Sync</span>
      <strong>${syncLabel}</strong>
    </div>
  `;
  googleLoginBtn.hidden = true;
  signOutBtn.hidden = false;
}

async function init() {
  initHeader();
  updateCartCount();
  initAccountSessionSync();
  updateFavoritesCount();
  await renderAccount();
  window.addEventListener("favorites:updated", async () => {
    updateFavoritesCount();
    await renderAccount();
  });
  window.addEventListener("account:updated", async () => {
    updateFavoritesCount();
    await renderAccount();
  });
}

googleLoginBtn?.addEventListener("click", async () => {
  accountMessage.textContent = "Redirecting to Google...";
  const { error } = await signInWithGoogle("./account.html");
  if (error) {
    accountMessage.textContent = error.message;
  }
});

signOutBtn?.addEventListener("click", async () => {
  await signOutUser();
  accountMessage.textContent = "Signed out.";
  await renderAccount();
});

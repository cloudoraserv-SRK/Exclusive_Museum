import { supabase } from "../admin/supabaseClient.js";
import { hydrateFavoritesForIdentity, setFavoritesIdentity } from "./favorites.js";
import { t } from "../locale.js";

let authListenerInitialized = false;
let cachedUser = undefined;
let accountRefreshPromise = null;
const ACCOUNT_SNAPSHOT_KEY = "em_account_snapshot";

function readAccountSnapshot() {
  try {
    const raw = localStorage.getItem(ACCOUNT_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAccountSnapshot(user) {
  if (!user) {
    localStorage.removeItem(ACCOUNT_SNAPSHOT_KEY);
    return;
  }

  localStorage.setItem(ACCOUNT_SNAPSHOT_KEY, JSON.stringify({
    id: user.id,
    email: user.email || "",
    label: user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || t("account")
  }));
}

function applyAccountSnapshot(snapshot) {
  const label = snapshot?.label || t("account");
  const state = snapshot ? "Signed In" : t("guest");

  document.querySelectorAll("[data-account-label]").forEach(element => {
    element.textContent = label;
  });

  document.querySelectorAll("[data-account-state]").forEach(element => {
    element.textContent = state;
  });
}

async function fetchCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data?.session?.user || null;
}

async function resolveCurrentUser(force = false) {
  if (!force && cachedUser !== undefined) {
    return cachedUser;
  }

  if (!accountRefreshPromise) {
    accountRefreshPromise = (async () => {
      const user = await fetchCurrentUser();
      cachedUser = user || null;
      return cachedUser;
    })().finally(() => {
      accountRefreshPromise = null;
    });
  }

  return accountRefreshPromise;
}

export async function getCurrentUser(force = false) {
  return resolveCurrentUser(force);
}

export async function signInWithGoogle(redirectPath = "./account.html") {
  const redirectTo = new URL(redirectPath, window.location.href).href;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export function hydrateAccountUIFromSnapshot() {
  applyAccountSnapshot(readAccountSnapshot());
}

async function applyAccountIdentity(user) {
  if (user?.id) {
    await hydrateFavoritesForIdentity(user.id);
    return;
  }

  setFavoritesIdentity("guest");
}

export async function updateAccountUI() {
  hydrateAccountUIFromSnapshot();
  const user = await getCurrentUser();
  const label = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || t("account");

  await applyAccountIdentity(user);
  writeAccountSnapshot(user);

  document.querySelectorAll("[data-account-label]").forEach(element => {
    element.textContent = label;
  });

  document.querySelectorAll("[data-account-state]").forEach(element => {
    element.textContent = user ? "Signed In" : t("guest");
  });

  return user;
}

export function initAccountSessionSync() {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  hydrateAccountUIFromSnapshot();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    cachedUser = session?.user || null;
    await applyAccountIdentity(session?.user || null);
    writeAccountSnapshot(session?.user || null);

    const label = session?.user?.user_metadata?.full_name?.split(" ")[0]
      || session?.user?.email?.split("@")[0]
      || t("account");

    document.querySelectorAll("[data-account-label]").forEach(element => {
      element.textContent = label;
    });

    document.querySelectorAll("[data-account-state]").forEach(element => {
      element.textContent = session?.user ? "Signed In" : t("guest");
    });

    window.dispatchEvent(new CustomEvent("account:updated", {
      detail: { user: session?.user || null }
    }));
  });
}

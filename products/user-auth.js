import { supabase } from "../admin/supabaseClient.js";
import { hydrateFavoritesForIdentity, setFavoritesIdentity } from "./favorites.js";

let authListenerInitialized = false;
let cachedUser = undefined;
let accountRefreshPromise = null;

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

async function applyAccountIdentity(user) {
  if (user?.id) {
    await hydrateFavoritesForIdentity(user.id);
    return;
  }

  setFavoritesIdentity("guest");
}

export async function updateAccountUI() {
  const user = await getCurrentUser();
  const label = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";

  await applyAccountIdentity(user);

  document.querySelectorAll("[data-account-label]").forEach(element => {
    element.textContent = label;
  });

  document.querySelectorAll("[data-account-state]").forEach(element => {
    element.textContent = user ? "Signed In" : "Guest";
  });

  return user;
}

export function initAccountSessionSync() {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    cachedUser = session?.user || null;
    await applyAccountIdentity(session?.user || null);

    const label = session?.user?.user_metadata?.full_name?.split(" ")[0]
      || session?.user?.email?.split("@")[0]
      || "Account";

    document.querySelectorAll("[data-account-label]").forEach(element => {
      element.textContent = label;
    });

    document.querySelectorAll("[data-account-state]").forEach(element => {
      element.textContent = session?.user ? "Signed In" : "Guest";
    });

    window.dispatchEvent(new CustomEvent("account:updated", {
      detail: { user: session?.user || null }
    }));
  });
}

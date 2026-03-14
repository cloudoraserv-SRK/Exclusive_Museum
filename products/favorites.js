import { supabase } from "../admin/supabaseClient.js";

const FAVORITES_KEY_PREFIX = "favorites::";
const ACCOUNT_IDENTITY_KEY = "account_identity";

let wishlistTableAvailable = null;
let wishlistSyncIdentity = null;

function getIdentityKey() {
  return localStorage.getItem(ACCOUNT_IDENTITY_KEY) || "guest";
}

function getFavoritesStorageKey(identity = getIdentityKey()) {
  return `${FAVORITES_KEY_PREFIX}${identity}`;
}

function dispatchFavoritesUpdate(items, identity = getIdentityKey()) {
  window.dispatchEvent(new CustomEvent("favorites:updated", {
    detail: { count: items.length, identity }
  }));
}

function readFavorites(identity = getIdentityKey()) {
  try {
    const stored = JSON.parse(localStorage.getItem(getFavoritesStorageKey(identity)) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeFavorites(items, identity = getIdentityKey()) {
  localStorage.setItem(getFavoritesStorageKey(identity), JSON.stringify(items));
  dispatchFavoritesUpdate(items, identity);
  if (identity !== "guest") {
    persistCloudFavorites(identity, items);
  }
}

function mergeFavoritesLists(primary, secondary) {
  const map = new Map();

  [...secondary, ...primary].forEach(item => {
    if (!item?.id) return;
    map.set(item.id, item);
  });

  return [...map.values()];
}

async function canUseWishlistTable() {
  if (wishlistTableAvailable !== null) return wishlistTableAvailable;

  const { error } = await supabase
    .from("wishlist_items")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  wishlistTableAvailable = !error;
  return wishlistTableAvailable;
}

function mapCloudFavorite(row) {
  return buildFavoriteProduct({
    id: row.product_id,
    slug: row.product_slug,
    name: row.product_name,
    price: row.product_price,
    image: row.product_image,
    brand: row.product_brand,
    description: row.product_description
  });
}

async function fetchCloudFavorites(identity) {
  const enabled = await canUseWishlistTable();
  if (!enabled) return null;

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id,product_slug,product_name,product_price,product_image,product_brand,product_description,created_at")
    .eq("user_id", identity)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Unable to fetch wishlist_items", error.message);
    return null;
  }

  return (data || []).map(mapCloudFavorite);
}

async function persistCloudFavorites(identity, items) {
  const enabled = await canUseWishlistTable();
  if (!enabled) return false;

  const payload = items.map(item => ({
    user_id: identity,
    product_id: item.id,
    product_slug: item.slug,
    product_name: item.name,
    product_price: item.price,
    product_image: item.image,
    product_brand: item.brand,
    product_description: item.description
  }));

  const { error: deleteError } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", identity);

  if (deleteError) {
    console.warn("Unable to clear wishlist_items", deleteError.message);
    return false;
  }

  if (!payload.length) return true;

  const { error: insertError } = await supabase
    .from("wishlist_items")
    .insert(payload);

  if (insertError) {
    console.warn("Unable to save wishlist_items", insertError.message);
    return false;
  }

  return true;
}

function storeFavoritesForIdentity(identity, items) {
  localStorage.setItem(getFavoritesStorageKey(identity), JSON.stringify(items));
}

export function setFavoritesIdentity(identity = "guest") {
  localStorage.setItem(ACCOUNT_IDENTITY_KEY, identity);
  dispatchFavoritesUpdate(readFavorites(identity), identity);
}

export function syncFavoritesForIdentity(identity) {
  if (!identity || identity === "guest") {
    setFavoritesIdentity("guest");
    return readFavorites("guest");
  }

  const guestFavorites = readFavorites("guest");
  const accountFavorites = readFavorites(identity);
  const merged = mergeFavoritesLists(accountFavorites, guestFavorites);

  localStorage.setItem(getFavoritesStorageKey(identity), JSON.stringify(merged));
  localStorage.removeItem(getFavoritesStorageKey("guest"));
  setFavoritesIdentity(identity);
  dispatchFavoritesUpdate(merged, identity);
  return merged;
}

export async function hydrateFavoritesForIdentity(identity) {
  if (!identity || identity === "guest") {
    wishlistSyncIdentity = "guest";
    setFavoritesIdentity("guest");
    return readFavorites("guest");
  }

  const mergedLocal = syncFavoritesForIdentity(identity);

  if (wishlistSyncIdentity === identity) {
    return mergedLocal;
  }

  const cloudFavorites = await fetchCloudFavorites(identity);
  if (!cloudFavorites) {
    wishlistSyncIdentity = identity;
    return mergedLocal;
  }

  const merged = mergeFavoritesLists(cloudFavorites, mergedLocal);
  storeFavoritesForIdentity(identity, merged);
  await persistCloudFavorites(identity, merged);
  wishlistSyncIdentity = identity;
  dispatchFavoritesUpdate(merged, identity);
  return merged;
}

export function getFavorites() {
  return readFavorites();
}

export function getFavoriteCount() {
  return readFavorites().length;
}

export function isFavorite(productId) {
  return readFavorites().some(item => item.id === productId);
}

export function buildFavoriteProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price || 0),
    image: product.image || "../assets/images/placeholder.png",
    brand: product.brand || "Exclusive Museum",
    description: product.description || "Collector-grade handcrafted piece."
  };
}

export function toggleFavorite(product) {
  const items = readFavorites();
  const exists = items.some(item => item.id === product.id);

  if (exists) {
    const next = items.filter(item => item.id !== product.id);
    writeFavorites(next);
    return false;
  }

  writeFavorites([buildFavoriteProduct(product), ...items]);
  return true;
}

export function updateFavoritesCount() {
  const count = getFavoriteCount();
  document.querySelectorAll("[data-favorites-count]").forEach(element => {
    element.textContent = count;
  });
}

export async function getWishlistSyncMode(identity = getIdentityKey()) {
  if (!identity || identity === "guest") return "device";
  return (await canUseWishlistTable()) ? "cloud" : "device";
}

export function syncFavoriteButton(button, active) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", active ? "true" : "false");
  button.setAttribute("title", active ? "Remove from saved items" : "Save this item");

  const label = button.querySelector("[data-favorite-label]");
  if (label) {
    label.textContent = active ? "Saved" : "Save";
  }

  const icon = button.querySelector(".favorite-icon, .favorite-cta-icon");
  if (icon) {
    icon.textContent = active ? "✓" : "+";
  }
}

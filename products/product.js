import { supabase } from "../admin/supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { formatMoney, initLocaleExperience, t } from "../locale.js";

const params = new URLSearchParams(location.search);
const slug = params.get("slug");
const productIdParam = params.get("id");

const productName = document.getElementById("productName");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productMrp = document.getElementById("productMrp");
const productBrand = document.getElementById("productBrand");
const longDesc = document.getElementById("longDesc");
const productSku = document.getElementById("productSku");
const stockStatus = document.getElementById("stockStatus");
const galleryMain = document.getElementById("galleryMain");
const thumbs = document.getElementById("thumbs");
const colorsBlock = document.getElementById("colorsBlock");
const sizesBlock = document.getElementById("sizesBlock");
const specGrid = document.getElementById("specGrid");
const materialsGrid = document.getElementById("materialsGrid");
const customGrid = document.getElementById("customGrid");
const reviewsList = document.getElementById("reviewsList");
const faqList = document.getElementById("faqList");
const addToCartBtn = document.getElementById("addToCartBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const seoDescription = document.getElementById("seoDescription");

let productRecord = null;
let currentImages = [];
let favoritesApi = null;
let bootStarted = false;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    boot().catch(handleProductError);
  });
} else {
  boot().catch(handleProductError);
}

window.addEventListener("load", () => {
  if (!bootStarted) {
    boot().catch(handleProductError);
  }
});

window.addEventListener("em:locale-changed", () => {
  if (!productRecord) return;
  productPrice.textContent = formatMoney(productRecord.price ?? 0);
  productMrp.textContent = productRecord.mrp ? formatMoney(productRecord.mrp) : "";
  if (favoritesApi) {
    applyFavoriteState(favoritesApi.isFavorite(productRecord.id));
  }
});

async function boot() {
  if (bootStarted) return;
  bootStarted = true;
  initHeader();
  updateCartCount();
  initLocaleExperience();
  await loadProduct();
  initCartAction();
  await initEnhancements();
}

function initHeader() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav-links");
  hamburger?.addEventListener("click", () => nav?.classList.toggle("active"));
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function getImageList(product) {
  return getNormalizedProductImages(product);
}

function getImageUrl(path) {
  if (!path) return "../assets/images/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderImages(images) {
  galleryMain.innerHTML = "";
  thumbs.innerHTML = "";

  const resolved = images.length ? images : ["../assets/images/placeholder.png"];
  galleryMain.innerHTML = `<img src="${getImageUrl(resolved[0])}" alt="${productRecord?.name || "Product"}">`;

  resolved.forEach((path, index) => {
    const image = document.createElement("img");
    image.src = getImageUrl(path);
    image.alt = `${productRecord?.name || "Product"} ${index + 1}`;
    image.className = index === 0 ? "active" : "";
    image.onclick = () => {
      galleryMain.innerHTML = `<img src="${getImageUrl(path)}" alt="${productRecord?.name || "Product"}">`;
      thumbs.querySelectorAll("img").forEach(img => img.classList.remove("active"));
      image.classList.add("active");
    };
    thumbs.appendChild(image);
  });
}

async function loadMaterials(productId) {
  const { data } = await supabase
    .from("product_materials")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  if (!data) {
    materialsGrid.innerHTML = "<p>No materials info available.</p>";
    return;
  }

  const rows = [
    ["Gold Type", data.gold_type],
    ["Gold Weight", data.gold_weight ? `${data.gold_weight} g` : null],
    ["Diamond Carat", data.diamond_carat],
    ["Diamond Count", data.diamond_count],
    ["Wood Type", data.wood_type]
  ].filter(([, value]) => value);

  materialsGrid.innerHTML = rows.map(([label, value]) => `
    <div class="spec-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

async function loadCustomization(productId) {
  const { data = [] } = await supabase
    .from("product_customization")
    .select("custom_option")
    .eq("product_id", productId);

  if (!data.length) {
    customGrid.innerHTML = "<p>No customization options available.</p>";
    return;
  }

  customGrid.innerHTML = data.map(item => `
    <div class="custom-box">
      <span>${item.custom_option}</span>
    </div>
  `).join("");
}

async function loadSpecs(productId, product) {
  const rows = [
    ["Case Size", product.case_size],
    ["Movement", product.movement],
    ["Glass", product.glass],
    ["Water Resistance", product.water_resistance],
    ["Crafting Time", product.crafting_time]
  ].filter(([, value]) => value);

  const { data = [] } = await supabase
    .from("product_specs")
    .select("spec_name,spec_value")
    .eq("product_id", productId);

  const allRows = [
    ...rows,
    ...data.map(item => [item.spec_name, item.spec_value])
  ];

  specGrid.innerHTML = allRows.length
    ? allRows.map(([label, value]) => `
        <div class="spec-item">
          <span>${label}</span>
          <strong>${value}</strong>
        </div>
      `).join("")
    : "<p>No product specifications available.</p>";
}

async function loadReviews(productId) {
  const { data = [] } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  reviewsList.innerHTML = data.length
    ? data.map(review => `
        <div class="review">
          <strong>${review.name}</strong>
          <div>⭐ ${review.rating || "-"}/5</div>
          <p>${review.review}</p>
        </div>
      `).join("")
    : "<p>No reviews yet.</p>";
}

async function loadFAQ(productId) {
  const { data = [] } = await supabase
    .from("product_faq")
    .select("*")
    .eq("product_id", productId);

  faqList.innerHTML = data.length
    ? data.map(item => `
        <div class="faq-item">
          <h4>${item.question}</h4>
          <p>${item.answer}</p>
        </div>
      `).join("")
    : "<p>No FAQs available.</p>";
}

async function loadProduct() {
  if (!slug && !productIdParam) {
    throw new Error("Missing product identifier");
  }

  const selectFields = `
    id,name,slug,price,mrp,short_description,long_description,description,case_size,movement,glass,water_resistance,crafting_time,active,thumbnail_url,images,gallery_urls,brand_id,category_id
  `;

  let data = null;
  let error = null;

  if (productIdParam) {
    const response = await supabase
      .from("products")
      .select(selectFields)
      .eq("id", productIdParam)
      .eq("active", true)
      .maybeSingle();

    data = response.data;
    error = response.error;
  }

  if (!data && slug) {
    const response = await supabase
      .from("products")
      .select(selectFields)
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    data = response.data;
    error = response.error;
  }

  if (!data && slug) {
    const response = await supabase
      .from("products")
      .select(selectFields)
      .eq("active", true)
      .order("created_at", { ascending: false });

    error = response.error;
    data = (response.data || []).find(product => {
      return normalizeSlug(product.slug) === normalizeSlug(slug)
        || normalizeSlug(product.name) === normalizeSlug(slug);
    }) || null;
  }

  if (error || !data) {
    console.error(error);
    if (galleryMain) {
      galleryMain.innerHTML = `<img src="../assets/images/placeholder.png" alt="Product placeholder">`;
    }
    throw error || new Error("Product not found");
  }

  const [brandResponse, categoryResponse] = await Promise.all([
    data.brand_id
      ? supabase.from("brands").select("name").eq("id", data.brand_id).maybeSingle()
      : Promise.resolve({ data: null }),
    data.category_id
      ? supabase.from("categories").select("name").eq("id", data.category_id).maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  productRecord = data;
  productRecord.brand_name = brandResponse.data?.name || null;
  productRecord.category_name = categoryResponse.data?.name || null;
  currentImages = getImageList(data);

  productName.textContent = data.name || "";
  productDesc.textContent = data.short_description || data.description || "";
  productPrice.textContent = formatMoney(data.price ?? 0);
  productMrp.textContent = data.mrp ? formatMoney(data.mrp) : "";
  productBrand.textContent = productRecord.brand_name || "Exclusive Museum";
  longDesc.textContent = data.long_description || data.description || "A premium Exclusive Museum piece crafted with collector-level detail.";
  productSku.textContent = data.slug || data.id;
  stockStatus.textContent = data.active ? "Available" : "Unavailable";
  seoDescription.textContent = data.long_description || data.description || data.short_description || "";

  colorsBlock.style.display = "none";
  sizesBlock.style.display = "none";

  renderImages(currentImages);
  await loadSpecs(data.id, data);
  await loadMaterials(data.id);
  await loadCustomization(data.id);
  await loadReviews(data.id);
  await loadFAQ(data.id);
}

function initCartAction() {
  addToCartBtn?.addEventListener("click", () => {
    if (!productRecord) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item.product_id === productRecord.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        product_id: productRecord.id,
        name: productRecord.name,
        price: Number(productRecord.price || 0),
        image: getImageUrl(currentImages[0]),
        qty: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert(t("addToCart"));
  });
}

function applyFavoriteState(active) {
  if (!favoriteBtn) return;

  favoriteBtn.classList.toggle("is-active", active);
  favoriteBtn.setAttribute("aria-pressed", active ? "true" : "false");

  const label = favoriteBtn.querySelector("[data-favorite-label]");
  const icon = favoriteBtn.querySelector(".favorite-cta-icon");

  if (label) label.textContent = t(active ? "savedState" : "save");
  if (icon) icon.textContent = active ? "✓" : "+";
}

function wireFavoriteAction() {
  if (!favoriteBtn || !productRecord || !favoritesApi) return;

  applyFavoriteState(favoritesApi.isFavorite(productRecord.id));

  favoriteBtn.onclick = () => {
    const saved = favoritesApi.toggleFavorite({
      id: productRecord.id,
      slug: productRecord.slug,
      name: productRecord.name,
      price: productRecord.price,
      image: getImageUrl(currentImages[0]),
      brand: productRecord.brand_name || "Exclusive Museum",
      description: productRecord.short_description || productRecord.description
    });

    applyFavoriteState(saved);
  };
}

async function initEnhancements() {
  try {
    const [{ initAccountSessionSync, updateAccountUI }, favoritesModule] = await Promise.all([
      import("./user-auth.js"),
      import("./favorites.js")
    ]);

    favoritesApi = {
      isFavorite: favoritesModule.isFavorite,
      toggleFavorite: favoritesModule.toggleFavorite
    };

    initAccountSessionSync();
    await updateAccountUI();
    favoritesModule.updateFavoritesCount();
    window.addEventListener("favorites:updated", favoritesModule.updateFavoritesCount);
    wireFavoriteAction();

    import("./related-product.js").catch(error => {
      console.warn("Related products unavailable", error);
    });
  } catch (error) {
    console.warn("Optional account/wishlist enhancements unavailable", error);
  }
}

function handleProductError(error) {
  console.error(error);
  if (productName) productName.textContent = "Product unavailable";
  if (productDesc) productDesc.textContent = "We could not load this product right now.";
  if (galleryMain) {
    galleryMain.innerHTML = `<img src="../assets/images/placeholder.png" alt="Product placeholder">`;
  }
}

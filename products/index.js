import { supabase } from "../admin/supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { formatMoney, initLocaleExperience, t } from "../locale.js";

const grid = document.getElementById("productsGrid");
const pageTitle = document.getElementById("collectionTitle");
const pageLead = document.getElementById("collectionLead");

let favoritesApi = null;

boot();
window.addEventListener("em:locale-changed", () => {
  loadProducts();
});

async function boot() {
  initHeader();
  updateCartCount();
  initLocaleExperience();
  await loadProducts();
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

function getImagePath(product) {
  const images = getNormalizedProductImages(product);
  return images[0] || product.thumbnail_url || "../assets/images/placeholder.png";
}

function getImageUrl(path) {
  if (!path) return "../assets/images/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

function normalizeFilterValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFilterCandidates(entity) {
  const slug = normalizeFilterValue(entity?.slug || "");
  const name = normalizeFilterValue(entity?.name || "");
  const compactName = name.replace(/-+/g, "");
  const values = new Set([slug, name, compactName].filter(Boolean));

  if (values.has("watch") || values.has("watches") || values.has("gold-diamond-watches")) {
    values.add("watch");
    values.add("watches");
    values.add("gold-diamond-watches");
  }

  return values;
}

function matchesFilter(entity, filterValue) {
  const normalized = normalizeFilterValue(filterValue);
  if (!normalized) return true;

  const candidates = getFilterCandidates(entity);
  if (candidates.has(normalized)) return true;

  for (const candidate of candidates) {
    if (candidate.includes(normalized) || normalized.includes(candidate)) {
      return true;
    }
  }

  return false;
}

async function loadProducts() {
  const params = new URLSearchParams(window.location.search);
  const categorySlug = normalizeFilterValue(params.get("category"));
  const brandSlug = normalizeFilterValue(params.get("brand"));

  const { data, error } = await supabase
    .from("products")
    .select(`
      id,name,slug,price,mrp,short_description,long_description,active,limited_edition,luxury_flag,thumbnail_url,images,gallery_urls,
      brands:brand_id(id,name,slug),
      categories:category_id(id,name,slug)
    `)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Unable to load collection right now.</p>";
    return;
  }

  const products = (data || []).filter(product => {
    const categoryMatch = !categorySlug || matchesFilter(product.categories, categorySlug);
    const brandMatch = !brandSlug || matchesFilter(product.brands, brandSlug);
    return categoryMatch && brandMatch;
  });

  updateCollectionIntro(products, { brandSlug, categorySlug });
  renderProducts(products);
}

function updateCollectionIntro(products, filters) {
  if (!pageTitle || !pageLead) return;

  const first = products[0];
  if (filters.categorySlug && first?.categories?.name) {
    pageTitle.textContent = first.categories.name;
    pageLead.textContent = `A focused edit of ${first.categories.name.toLowerCase()} pieces crafted for collectors and gifting.`;
    return;
  }

  if (filters.brandSlug && first?.brands?.name) {
    pageTitle.textContent = first.brands.name;
    pageLead.textContent = `Explore the ${first.brands.name} collection with premium presentation, crafted details, and limited pieces.`;
    return;
  }

  pageTitle.textContent = "Curated Collection";
  pageLead.textContent = "Discover Exclusive Museum pieces with handcrafted character, premium materials, and collector-led detailing.";
}

function renderProducts(products) {
  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No products found for this collection.</p>";
    return;
  }

  products.forEach(product => {
    const imageUrl = getImageUrl(getImagePath(product));
    const description = product.short_description || product.long_description || "Handcrafted luxury piece from Exclusive Museum.";
    const badge = product.limited_edition
      ? "Limited Edition"
      : product.luxury_flag
        ? "Luxury Pick"
        : product.categories?.name || "Curated";

    grid.insertAdjacentHTML("beforeend", `
      <article class="product-card">
        <a href="product.html?id=${encodeURIComponent(product.id)}&slug=${encodeURIComponent(product.slug || "")}" class="product-link">
          <div class="product-media">
            <img src="${imageUrl}" alt="${product.name}">
            <span class="product-badge">${badge}</span>
          </div>
          <div class="product-copy">
            <p class="brand">${product.brands?.name || "Exclusive Museum"}</p>
            <h3>${product.name}</h3>
            <p class="desc">${description}</p>
            <div class="price-row">
              ${product.mrp ? `<span class="mrp">${formatMoney(product.mrp)}</span>` : ""}
              <span class="price">${formatMoney(product.price ?? 0)}</span>
            </div>
          </div>
        </a>
        <button
          class="favorite-btn"
          type="button"
          data-favorite-button
          data-id="${product.id}"
          data-slug="${product.slug}"
          data-name="${product.name}"
          data-price="${product.price ?? 0}"
          data-image="${imageUrl}"
          data-brand="${product.brands?.name || "Exclusive Museum"}"
          data-description="${description.replace(/"/g, "&quot;")}"
        >
          <span class="favorite-icon">+</span>
          <span data-favorite-label>${t("save")}</span>
        </button>
        <button
          class="add-btn"
          data-id="${product.id}"
          data-name="${product.name}"
          data-price="${product.price ?? 0}"
          data-image="${imageUrl}"
        >
          ${t("addToCart")}
        </button>
      </article>
    `);
  });

  initCartButtons();
  initFavoriteButtons();
}

function initCartButtons() {
  document.querySelectorAll(".add-btn").forEach(button => {
    button.onclick = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const productId = button.dataset.id;
      const existing = cart.find(item => item.product_id === productId);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          product_id: productId,
          name: button.dataset.name,
          price: Number(button.dataset.price),
          image: button.dataset.image,
          qty: 1
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      alert(t("addToCart"));
    };
  });
}

function initFavoriteButtons() {
  document.querySelectorAll("[data-favorite-button]").forEach(button => {
    const product = {
      id: button.dataset.id,
      slug: button.dataset.slug,
      name: button.dataset.name,
      price: button.dataset.price,
      image: button.dataset.image,
      brand: button.dataset.brand,
      description: button.dataset.description
    };

    const active = favoritesApi?.isFavorite ? favoritesApi.isFavorite(product.id) : false;
    applyFavoriteState(button, active);

    button.onclick = event => {
      event.preventDefault();
      if (!favoritesApi?.toggleFavorite) return;
      const saved = favoritesApi.toggleFavorite(product);
      applyFavoriteState(button, saved);
    };
  });
}

function applyFavoriteState(button, active) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", active ? "true" : "false");
  const label = button.querySelector("[data-favorite-label]");
  const icon = button.querySelector(".favorite-icon");
  if (label) label.textContent = t(active ? "savedState" : "save");
  if (icon) icon.textContent = active ? "✓" : "+";
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
    initFavoriteButtons();
  } catch (error) {
    console.warn("Optional account/wishlist enhancements unavailable", error);
  }
}

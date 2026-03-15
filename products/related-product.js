import { supabase } from "../admin/supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { buildFavoriteProduct, isFavorite, syncFavoriteButton, toggleFavorite } from "./favorites.js";
import { formatMoney, t } from "../locale.js";

const relatedGrid = document.getElementById("relatedGrid");
const loadMoreBtn = document.getElementById("loadMoreRelated");
const slug = new URLSearchParams(location.search).get("slug");

if (relatedGrid && slug) {
  let page = 0;
  const limit = 4;
  let currentProduct = null;

  init();

  async function init() {
    const { data } = await supabase
      .from("products")
      .select("id,brand_id,category_id")
      .eq("slug", slug)
      .single();

    if (!data) return;

    currentProduct = data;
    await loadRelated();

    loadMoreBtn?.addEventListener("click", async () => {
      page += 1;
      await loadRelated();
    });
  }

  function getImagePath(product) {
    const images = getNormalizedProductImages(product);
    return images[0] || product.thumbnail_url || "../assets/images/placeholder.png";
  }

  function getImageUrl(path) {
    if (!path) return "../assets/images/placeholder.png";
    if (/^https?:\/\//i.test(path)) return path;

    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  async function loadRelated() {
    const from = page * limit;

    let query = supabase
      .from("products")
      .select(`
        id,name,slug,price,short_description,thumbnail_url,images,gallery_urls,
        brand_id,category_id,
        brands:brand_id(name),
        categories:category_id(name)
      `)
      .neq("id", currentProduct.id)
      .eq("active", true)
      .or(`brand_id.eq.${currentProduct.brand_id},category_id.eq.${currentProduct.category_id}`);

    const { data: products, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      console.error(error);
      return;
    }

    if (!products?.length) {
      if (page === 0) relatedGrid.innerHTML = "<p>No related products.</p>";
      if (loadMoreBtn) loadMoreBtn.style.display = "none";
      return;
    }

    products.forEach(renderCard);
  }

  function renderCard(product) {
    relatedGrid.insertAdjacentHTML("beforeend", `
      <article class="related-card" data-id="${product.id}" data-slug="${product.slug}">
        <button
          class="favorite-btn related-favorite"
          type="button"
          data-favorite-button
          data-id="${product.id}"
          data-slug="${product.slug}"
          data-name="${product.name}"
          data-price="${product.price ?? 0}"
          data-image="${getImageUrl(getImagePath(product))}"
          data-brand="${product.brands?.name || "Exclusive Museum"}"
          data-description="${(product.short_description || "Premium collector piece.").replace(/"/g, "&quot;")}"
        >
          <span class="favorite-icon">+</span>
          <span data-favorite-label>${t("save")}</span>
        </button>
        <img src="${getImageUrl(getImagePath(product))}" alt="${product.name}">
        <div class="card-body">
          <small class="brand">${product.brands?.name || "Exclusive Museum"}</small>
          <h4>${product.name}</h4>
          <p class="category">${product.categories?.name || "Curated"}</p>
          <p class="desc">${product.short_description || "Premium collector piece."}</p>
          <span class="price">${formatMoney(product.price ?? 0)}</span>
        </div>
      </article>
    `);

    const favoriteButton = relatedGrid.lastElementChild?.querySelector("[data-favorite-button]");
    if (!favoriteButton) return;

    const favoriteProduct = buildFavoriteProduct({
      id: favoriteButton.dataset.id,
      slug: favoriteButton.dataset.slug,
      name: favoriteButton.dataset.name,
      price: favoriteButton.dataset.price,
      image: favoriteButton.dataset.image,
      brand: favoriteButton.dataset.brand,
      description: favoriteButton.dataset.description
    });

    syncFavoriteButton(favoriteButton, isFavorite(favoriteProduct.id));
    favoriteButton.addEventListener("click", event => {
      event.stopPropagation();
      const saved = toggleFavorite(favoriteProduct);
      syncFavoriteButton(favoriteButton, saved);
    });
  }

  relatedGrid.addEventListener("click", event => {
    const card = event.target.closest(".related-card");
    if (!card) return;
    location.href = `product.html?id=${encodeURIComponent(card.dataset.id)}&slug=${encodeURIComponent(card.dataset.slug || "")}`;
  });
}

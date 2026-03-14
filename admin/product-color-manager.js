import { supabase } from "./supabaseClient.js";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

const container = document.getElementById("colorContainer");

function getGallery(product) {
  if (Array.isArray(product.images) && product.images.length) return product.images;
  if (Array.isArray(product.gallery_urls) && product.gallery_urls.length) return product.gallery_urls;
  return [];
}

function toPublicUrl(path) {
  if (!path) return "assets/images/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

async function setThumbnail(productId, path) {
  const { error } = await supabase
    .from("products")
    .update({ thumbnail_url: toPublicUrl(path) })
    .eq("id", productId);

  if (error) {
    alert(error.message);
    return;
  }

  loadProducts();
}

async function loadProducts() {
  const { data: products = [] } = await supabase
    .from("products")
    .select("id,name,thumbnail_url,images,gallery_urls")
    .order("created_at", { ascending: false });

  container.innerHTML = `
    <div class="product-block">
      <div class="product-title">Media Review</div>
      <p class="old-color">
        Variant tables are not present in the current schema, so this page now manages product thumbnails.
      </p>
    </div>
  `;

  for (const product of products) {
    const gallery = getGallery(product);
    if (!gallery.length) continue;

    const cards = gallery.map(path => `
      <div class="image-card">
        <img src="${toPublicUrl(path)}" alt="${product.name}">
        <div class="old-color">
          ${product.thumbnail_url === toPublicUrl(path) ? "<strong>Current Thumbnail</strong>" : "Gallery Image"}
        </div>
        <button class="btn update-btn" data-product="${product.id}" data-path="${path}">
          Set As Thumbnail
        </button>
      </div>
    `).join("");

    container.insertAdjacentHTML("beforeend", `
      <div class="product-block">
        <div class="product-title">${product.name}</div>
        <div class="image-row">${cards}</div>
      </div>
    `);
  }

  document.querySelectorAll("[data-product]").forEach(button => {
    button.onclick = () => setThumbnail(button.dataset.product, button.dataset.path);
  });
}

loadProducts();

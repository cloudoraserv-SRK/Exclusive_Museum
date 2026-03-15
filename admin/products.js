import { supabase } from "./supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { requireAdminSession } from "./auth-guard.js";
import { formatMoney, initLocaleExperience } from "../locale.js";

await requireAdminSession();
initLocaleExperience({ scope: "admin", containerSelector: ".admin-header" });

const list = document.getElementById("productsList");

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

async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,price,thumbnail_url,images,gallery_urls")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Failed to load products");
    return;
  }

  list.innerHTML = "";

  for (const product of products || []) {
    list.insertAdjacentHTML("beforeend", `
      <div class="product-card">
        <img src="${getImageUrl(getImagePath(product))}" class="product-thumb" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${formatMoney(product.price ?? 0)}</p>
          <button onclick="editProduct('${product.id}')">Edit</button>
          <button class="danger" onclick="deleteProduct('${product.id}')">Delete</button>
        </div>
      </div>
    `);
  }
}

window.editProduct = id => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async id => {
  if (!confirm("Delete product?")) return;
  await supabase.from("products").delete().eq("id", id);
  loadProducts();
};

loadProducts();
window.addEventListener("em:locale-changed", loadProducts);

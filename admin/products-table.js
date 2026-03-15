import { supabase } from "./supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { requireAdminSession } from "./auth-guard.js";
import { formatMoney, initLocaleExperience } from "../locale.js";

await requireAdminSession();
initLocaleExperience({ scope: "admin", containerSelector: ".admin-header" });

const tbody = document.getElementById("productsBody");

function getImagePath(product) {
  const images = getNormalizedProductImages(product);
  return images[0] || product.thumbnail_url || "assets/images/placeholder.png";
}

function getImageUrl(path) {
  if (!path) return "assets/images/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,name,price,mrp,active,thumbnail_url,images,gallery_urls,
      brands!products_brand_id_fkey(name),
      categories!products_category_id_fkey(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  tbody.innerHTML = "";

  for (const product of products || []) {
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td><img src="${getImageUrl(getImagePath(product))}" width="50" alt="${product.name}"></td>
        <td>${product.name}</td>
        <td>${product.brands?.name ?? "-"}</td>
        <td>${product.categories?.name ?? "-"}</td>
        <td>${formatMoney(product.price ?? 0)}</td>
        <td>${product.mrp ? formatMoney(product.mrp) : "-"}</td>
        <td>${product.active ? "✅" : "❌"}</td>
        <td>
          <button onclick="editProduct('${product.id}')">Edit</button>
          <button class="danger" onclick="deleteProduct('${product.id}')">Delete</button>
        </td>
      </tr>
    `);
  }
}

async function deleteRelatedData(productId) {
  await supabase.from("product_customization").delete().eq("product_id", productId);
  await supabase.from("product_faq").delete().eq("product_id", productId);
  await supabase.from("product_features").delete().eq("product_id", productId);
  await supabase.from("product_materials").delete().eq("product_id", productId);
  await supabase.from("product_reviews").delete().eq("product_id", productId);
  await supabase.from("product_specs").delete().eq("product_id", productId);
  await supabase.from("product_warranty").delete().eq("product_id", productId);
}

window.editProduct = id => {
  location.href = `product-edit.html?id=${id}`;
};

window.deleteProduct = async id => {
  if (!confirm("Delete product?")) return;

  const { data: product } = await supabase
    .from("products")
    .select("images,gallery_urls")
    .eq("id", id)
    .single();

  const paths = [
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.gallery_urls) ? product.gallery_urls : [])
  ].filter(path => path && !/^https?:\/\//i.test(path));

  if (paths.length) {
    await supabase.storage.from("product-images").remove(paths);
  }

  await deleteRelatedData(id);
  await supabase.from("products").delete().eq("id", id);
  loadProducts();
};

loadProducts();
window.addEventListener("em:locale-changed", loadProducts);

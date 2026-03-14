import { supabase } from "./supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

const tbody = document.getElementById("editorBody");
const updateAllBtn = document.getElementById("updateAllBtn");

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
  const { data: brands = [] } = await supabase.from("brands").select("id,name").order("name");
  const { data: categories = [] } = await supabase.from("categories").select("id,name").order("name");

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,brand_id,category_id,price,mrp,active,thumbnail_url,images,gallery_urls")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  tbody.innerHTML = "";

  for (const product of products || []) {
    tbody.insertAdjacentHTML("beforeend", `
      <tr data-id="${product.id}">
        <td><img src="${getImageUrl(getImagePath(product))}" width="50" alt="${product.name}"></td>
        <td><input value="${product.name || ""}" class="edit-name"></td>
        <td>
          <select class="edit-brand">
            ${brands.map(brand => `
              <option value="${brand.id}" ${brand.id === product.brand_id ? "selected" : ""}>${brand.name}</option>
            `).join("")}
          </select>
        </td>
        <td>
          <select class="edit-category">
            ${categories.map(category => `
              <option value="${category.id}" ${category.id === product.category_id ? "selected" : ""}>${category.name}</option>
            `).join("")}
          </select>
        </td>
        <td><input type="number" value="${product.price ?? ""}" class="edit-price"></td>
        <td><input type="number" value="${product.mrp ?? ""}" class="edit-mrp"></td>
        <td><input type="checkbox" class="edit-active" ${product.active ? "checked" : ""}></td>
        <td><button class="save-btn">Update</button></td>
      </tr>
    `);
  }

  document.querySelectorAll(".save-btn").forEach(button => {
    button.onclick = () => updateRow(button.closest("tr"));
  });
}

async function updateRow(row) {
  const id = row.dataset.id;
  const payload = {
    name: row.querySelector(".edit-name").value.trim(),
    brand_id: row.querySelector(".edit-brand").value,
    category_id: row.querySelector(".edit-category").value,
    price: Number(row.querySelector(".edit-price").value) || null,
    mrp: Number(row.querySelector(".edit-mrp").value) || null,
    active: row.querySelector(".edit-active").checked
  };

  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) alert(error.message);
}

updateAllBtn.onclick = async () => {
  const rows = [...document.querySelectorAll("#editorBody tr")];

  for (const row of rows) {
    await updateRow(row);
  }

  alert("All products updated successfully");
};

loadProducts();

import { supabase } from "./supabaseClient.js";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

const qs = new URLSearchParams(location.search);
let productId = qs.get("product_id");

const productSelect = document.getElementById("productSelect");
const imageFiles = document.getElementById("imageFiles");
const uploadBtn = document.getElementById("addColorBtn");
const galleryList = document.getElementById("colorList");
const table = document.getElementById("variantsTable");
const note = document.getElementById("selectedColorNote");

let currentImages = [];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toPublicUrl(path) {
  if (!path) return "assets/images/placeholder.png";
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

async function saveGallery() {
  await supabase
    .from("products")
    .update({
      images: currentImages,
      gallery_urls: currentImages,
      thumbnail_url: currentImages[0] ? toPublicUrl(currentImages[0]) : null
    })
    .eq("id", productId);
}

async function loadProducts() {
  const { data = [] } = await supabase
    .from("products")
    .select("id,name")
    .order("name");

  productSelect.innerHTML = data.map(product => `
    <option value="${product.id}">${product.name}</option>
  `).join("");

  if (!productId) productId = data[0]?.id || null;
  productSelect.value = productId || "";

  if (productId) {
    await loadGallery();
  }
}

async function loadGallery() {
  const { data } = await supabase
    .from("products")
    .select("name,images,gallery_urls")
    .eq("id", productId)
    .single();

  currentImages = safeArray(data?.images).length ? safeArray(data.images) : safeArray(data?.gallery_urls);

  note.textContent = data?.name
    ? `Managing gallery for: ${data.name}`
    : "Select a product to manage its gallery.";

  galleryList.innerHTML = currentImages.length
    ? currentImages.map((path, index) => `<li>Image ${index + 1}: ${path}</li>`).join("")
    : "<li>No gallery images uploaded yet.</li>";

  renderTable();
}

function renderTable() {
  if (!currentImages.length) {
    table.innerHTML = `<tr><td colspan="4">No images uploaded</td></tr>`;
    return;
  }

  table.innerHTML = currentImages.map((path, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><img src="${toPublicUrl(path)}" alt="Gallery ${index + 1}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;"></td>
      <td>${path}</td>
      <td><button data-remove="${index}">Remove</button></td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-remove]").forEach(button => {
    button.onclick = () => removeImage(Number(button.dataset.remove));
  });
}

async function removeImage(index) {
  const path = currentImages[index];
  if (!confirm("Remove this image?")) return;

  if (path && !/^https?:\/\//i.test(path)) {
    await supabase.storage.from("product-images").remove([path]);
  }

  currentImages.splice(index, 1);
  await saveGallery();
  await loadGallery();
}

productSelect.onchange = async () => {
  productId = productSelect.value;
  await loadGallery();
};

uploadBtn.onclick = async () => {
  const files = [...(imageFiles.files || [])];
  if (!files.length || !productId) return;

  for (const file of files) {
    const path = `${productId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (!error) currentImages.push(path);
  }

  await saveGallery();
  imageFiles.value = "";
  await loadGallery();
};

loadProducts();

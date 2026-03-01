import { supabase } from "./supabaseClient.js";

/* ===== ELEMENTS ===== */
const nameInput = document.getElementById("name");
const slugInput = document.getElementById("slug");
const mrpInput = document.getElementById("mrp");
const priceInput = document.getElementById("price");
const shortDescInput = document.getElementById("shortDesc");
const longDescInput = document.getElementById("longDesc");
const activeInput = document.getElementById("active");

const brandSelect = document.getElementById("brand");
const categorySelect = document.getElementById("category");
const saveBtn = document.getElementById("saveProduct");

/* ===== LOAD BRANDS ===== */
async function loadBrands() {
  const { data } = await supabase
    .from("brands")
    .select("id,name")
    .order("name");

  brandSelect.innerHTML =
    `<option value="">Select Brand</option>` +
    (data || []).map(b =>
      `<option value="${b.id}">${b.name}</option>`
    ).join("");
}

/* ===== LOAD CATEGORIES ===== */
async function loadCategories() {
  const { data } = await supabase
    .from("categories")
    .select("id,name")
    .order("name");

  categorySelect.innerHTML =
    `<option value="">Select Category</option>` +
    (data || []).map(c =>
      `<option value="${c.id}">${c.name}</option>`
    ).join("");
}

/* ===== SAVE PRODUCT ===== */
saveBtn.onclick = async () => {

  if (!nameInput.value.trim()) return alert("Name required");
  if (!slugInput.value.trim()) return alert("Slug required");
  if (!brandSelect.value) return alert("Select brand");
  if (!categorySelect.value) return alert("Select category");

  const payload = {
    name: nameInput.value.trim(),
    slug: slugInput.value.trim(),
    mrp: Number(mrpInput.value) || null,
    price: Number(priceInput.value) || null,
    short_description: shortDescInput.value || null,
    long_description: longDescInput.value || null,
    brand_id: brandSelect.value,
    category_id: categorySelect.value,
    active: activeInput.checked
  };

  const { data: product, error } = await supabase
    .from("products")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  alert("✅ Product created (Base)");
  
  // Variant insert logic will go here next step

};

/* ===== INIT ===== */
loadBrands();
loadCategories();
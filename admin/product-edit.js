import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {

  const id = new URLSearchParams(location.search).get("id");
  if (!id) return location.href = "products.html";

  /* ========= ELEMENTS ========= */
  const name = document.getElementById("name");
  const slug = document.getElementById("slug");
  const mrp = document.getElementById("mrp");
  const price = document.getElementById("price");
  const shortDesc = document.getElementById("shortDesc");
  const longDesc = document.getElementById("longDesc");
  const active = document.getElementById("active");
  const saveBtn = document.getElementById("saveProduct");

  const brand = document.getElementById("brand");
  const category = document.getElementById("category");

  const colorSelect = document.getElementById("colorSelect");
  const sizeList = document.getElementById("sizeList");

  const imageInput = document.getElementById("images");
  const imageGallery = document.getElementById("imageGallery");

  let variants = [];
  let currentVariant = null;

  /* ========= LOAD PRODUCT ========= */

  async function loadProduct() {

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return;

    name.value = data.name ?? "";
    slug.value = data.slug ?? "";
    mrp.value = data.mrp ?? "";
    price.value = data.price ?? "";
    shortDesc.value = data.short_description ?? "";
    longDesc.value = data.long_description ?? "";
    active.checked = !!data.active;

    await loadBrands(data.brand_id);
    await loadCategories(data.category_id);
    await loadVariants();
  }

  async function loadBrands(selected) {
    const { data } = await supabase.from("brands").select("id,name");
    brand.innerHTML = data.map(b =>
      `<option value="${b.id}" ${b.id === selected ? "selected" : ""}>${b.name}</option>`
    ).join("");
  }

  async function loadCategories(selected) {
    const { data } = await supabase.from("categories").select("id,name");
    category.innerHTML = data.map(c =>
      `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`
    ).join("");
  }

  /* ========= VARIANTS ========= */

  async function loadVariants() {

    const { data } = await supabase
      .from("variants")
      .select(`
        id,
        color,
        image_gallery,
        variant_stock ( size, stock )
      `)
      .eq("product_id", id);

    variants = data || [];

    if (!variants.length) {
      colorSelect.innerHTML = `<option>No variants</option>`;
      colorSelect.disabled = true;
      sizeList.innerHTML = "";
      imageGallery.innerHTML = "";
      return;
    }

    colorSelect.disabled = false;

    colorSelect.innerHTML = variants
      .map((v, i) =>
        `<option value="${i}">${v.color || "Default"}</option>`
      ).join("");

    colorSelect.value = 0;
    selectVariant();
  }

  function selectVariant() {
    currentVariant = variants[Number(colorSelect.value)];
    if (!currentVariant) return;

    renderImages();
    renderSizes();
  }

  colorSelect.onchange = selectVariant;

  /* ========= IMAGES ========= */

  function renderImages() {

    imageGallery.innerHTML = "";

    if (!currentVariant.image_gallery?.length) return;

    currentVariant.image_gallery.forEach((path, i) => {

      const url = supabase.storage
        .from("products")
        .getPublicUrl(path).data.publicUrl;

      imageGallery.innerHTML += `
        <div class="img-box">
          <img src="${url}" width="100">
          <button data-i="${i}" class="remove-img">✕</button>
        </div>`;
    });

    imageGallery.querySelectorAll(".remove-img").forEach(btn => {
      btn.onclick = () => removeImage(+btn.dataset.i);
    });
  }

  imageInput.onchange = async () => {

    if (!currentVariant) return alert("No variant selected");

    const gallery = [...(currentVariant.image_gallery || [])];

    for (const file of imageInput.files) {

      const safe = file.name.replace(/\s+/g, "-").toLowerCase();
      const path = `${slug.value}/${Date.now()}-${safe}`;

      await supabase.storage
        .from("products")
        .upload(path, file, { upsert: true });

      gallery.push(path);
    }

    await supabase
      .from("variants")
      .update({ image_gallery: gallery })
      .eq("id", currentVariant.id);

    currentVariant.image_gallery = gallery;
    imageInput.value = "";
    renderImages();
  };

  async function removeImage(i) {

    const path = currentVariant.image_gallery[i];

    await supabase.storage
      .from("products")
      .remove([path]);

    const updated = currentVariant.image_gallery
      .filter((_, idx) => idx !== i);

    await supabase
      .from("variants")
      .update({ image_gallery: updated })
      .eq("id", currentVariant.id);

    currentVariant.image_gallery = updated;
    renderImages();
  }

  /* ========= SIZES ========= */

  function renderSizes() {

    sizeList.innerHTML = "";

    const stockData = currentVariant.variant_stock || [];

    if (!stockData.length) {
      sizeList.innerHTML = `<div>No sizes</div>`;
      return;
    }

    stockData.forEach(s => {
      sizeList.innerHTML +=
        `<div>Size ${s.size} | Stock ${s.stock}</div>`;
    });
  }

  /* ========= SAVE PRODUCT ========= */

  saveBtn.onclick = async () => {

    await supabase.from("products")
      .update({
        name: name.value,
        slug: slug.value,
        mrp: mrp.value || null,
        price: price.value || null,
        short_description: shortDesc.value,
        long_description: longDesc.value,
        active: active.checked,
        brand_id: brand.value,
        category_id: category.value
      })
      .eq("id", id);

    alert("✅ Product updated");
  };

  loadProduct();
});
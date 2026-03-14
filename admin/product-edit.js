import { supabase } from "./supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { requireAdminSession } from "./auth-guard.js";

document.addEventListener("DOMContentLoaded", async () => {
  await requireAdminSession();
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    location.href = "products.html";
    return;
  }

  const name = document.getElementById("name");
  const slug = document.getElementById("slug");
  const mrp = document.getElementById("mrp");
  const price = document.getElementById("price");
  const shortDesc = document.getElementById("shortDesc");
  const longDesc = document.getElementById("longDesc");
  const active = document.getElementById("active");
  const brand = document.getElementById("brand");
  const category = document.getElementById("category");
  const caseSize = document.getElementById("caseSize");
  const movement = document.getElementById("movement");
  const glass = document.getElementById("glass");
  const waterResistance = document.getElementById("waterResistance");
  const craftingTime = document.getElementById("craftingTime");
  const goldType = document.getElementById("goldType");
  const goldWeight = document.getElementById("goldWeight");
  const diamondCarat = document.getElementById("diamondCarat");
  const diamondCount = document.getElementById("diamondCount");
  const woodType = document.getElementById("woodType");
  const colorSelect = document.getElementById("colorSelect");
  const sizeList = document.getElementById("sizeList");
  const variantsBtn = document.getElementById("variantsBtn");
  const imageGallery = document.getElementById("imageGallery");
  const imageInput = document.getElementById("images");
  const dropZone = document.getElementById("dropZone");
  const specList = document.getElementById("specList");
  const reviewList = document.getElementById("reviewList");
  const faqAdmin = document.getElementById("faqAdmin");
  const saveBtn = document.getElementById("saveProduct");
  const customizationInputs = [...document.querySelectorAll(".customOpt")];

  let currentImages = [];

  function toPublicUrl(path) {
    if (!path) return "../assets/images/placeholder.png";
    if (/^https?:\/\//i.test(path)) return path;

    return supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;
  }

  async function persistImages() {
    await supabase
      .from("products")
      .update({
        images: currentImages,
        gallery_urls: currentImages,
        thumbnail_url: currentImages[0] ? toPublicUrl(currentImages[0]) : null
      })
      .eq("id", id);
  }

  name.addEventListener("input", () => {
    slug.value = name.value.toLowerCase().replace(/\s+/g, "-");
  });

  async function loadBrands() {
    const { data = [] } = await supabase.from("brands").select("id,name").order("name");
    brand.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
  }

  async function loadCategories() {
    const { data = [] } = await supabase.from("categories").select("id,name").order("name");
    category.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
  }

  async function loadMaterials() {
    const { data } = await supabase
      .from("product_materials")
      .select("*")
      .eq("product_id", id)
      .maybeSingle();

    goldType.value = data?.gold_type || "";
    goldWeight.value = data?.gold_weight || "";
    diamondCarat.value = data?.diamond_carat || "";
    diamondCount.value = data?.diamond_count || "";
    woodType.value = data?.wood_type || "";
  }

  async function loadSpecs() {
    const { data = [] } = await supabase
      .from("product_specs")
      .select("*")
      .eq("product_id", id);

    specList.innerHTML = "";
    data.forEach(spec => {
      specList.innerHTML += `
        <div class="spec-row">
          <input class="spec-name" value="${spec.spec_name || ""}">
          <input class="spec-value" value="${spec.spec_value || ""}">
        </div>
      `;
    });
  }

  async function loadReviews() {
    const { data = [] } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", id);

    reviewList.innerHTML = "";
    data.forEach(review => {
      reviewList.innerHTML += `
        <div class="review-row">
          <input class="review-name" value="${review.name || ""}">
          <input class="review-rating" value="${review.rating ?? ""}">
          <textarea class="review-text">${review.review || ""}</textarea>
        </div>
      `;
    });
  }

  async function loadFAQ() {
    const { data = [] } = await supabase
      .from("product_faq")
      .select("*")
      .eq("product_id", id);

    faqAdmin.innerHTML = "";
    data.forEach(item => {
      faqAdmin.innerHTML += `
        <div class="faq-row">
          <input class="faq-q" value="${item.question || ""}">
          <textarea class="faq-a">${item.answer || ""}</textarea>
        </div>
      `;
    });
  }

  async function loadCustomization() {
    const { data = [] } = await supabase
      .from("product_customization")
      .select("custom_option")
      .eq("product_id", id);

    const selected = new Set(data.map(item => item.custom_option));
    customizationInputs.forEach(input => {
      input.checked = selected.has(input.value);
    });
  }

  function renderImages() {
    imageGallery.innerHTML = "";

    currentImages.forEach((path, index) => {
      imageGallery.innerHTML += `
        <div class="img-box">
          <img src="${toPublicUrl(path)}" alt="Product image ${index + 1}">
          <button data-index="${index}" class="remove-img">✕</button>
        </div>
      `;
    });

    document.querySelectorAll(".remove-img").forEach(button => {
      button.onclick = () => removeImage(Number(button.dataset.index));
    });
  }

  async function removeImage(index) {
    const path = currentImages[index];

    if (path && !/^https?:\/\//i.test(path)) {
      await supabase.storage.from("product-images").remove([path]);
    }

    currentImages.splice(index, 1);
    await persistImages();
    renderImages();
  }

  async function uploadImages(files) {
    for (const file of files) {
      const path = `${id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });

      if (!error) {
        currentImages.push(path);
      }
    }

    await persistImages();
    renderImages();
    imageInput.value = "";
  }

  async function loadProduct() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!data) return;

    name.value = data.name || "";
    slug.value = data.slug || "";
    mrp.value = data.mrp ?? "";
    price.value = data.price ?? "";
    shortDesc.value = data.short_description || "";
    longDesc.value = data.long_description || "";
    caseSize.value = data.case_size || "";
    movement.value = data.movement || "";
    glass.value = data.glass || "";
    waterResistance.value = data.water_resistance || "";
    craftingTime.value = data.crafting_time || "";
    active.checked = Boolean(data.active);
    brand.value = data.brand_id || "";
    category.value = data.category_id || "";
    currentImages = getNormalizedProductImages(data);

    variantsBtn.href = `variants.html?product_id=${id}`;
    colorSelect.innerHTML = `<option value="gallery">Product gallery</option>`;
    colorSelect.disabled = true;
    sizeList.innerHTML = `<div>No variant table found in current schema.</div>`;

    await loadMaterials();
    await loadSpecs();
    await loadReviews();
    await loadFAQ();
    await loadCustomization();
    renderImages();
  }

  document.getElementById("addSpec").onclick = () => {
    specList.innerHTML += `
      <div class="spec-row">
        <input class="spec-name" placeholder="Spec name">
        <input class="spec-value" placeholder="Value">
      </div>
    `;
  };

  document.getElementById("addReview").onclick = () => {
    reviewList.innerHTML += `
      <div class="review-row">
        <input class="review-name" placeholder="Customer name">
        <input class="review-rating" placeholder="Rating (1-5)">
        <textarea class="review-text" placeholder="Review"></textarea>
      </div>
    `;
  };

  document.getElementById("addFaq").onclick = () => {
    faqAdmin.innerHTML += `
      <div class="faq-row">
        <input class="faq-q" placeholder="Question">
        <textarea class="faq-a" placeholder="Answer"></textarea>
      </div>
    `;
  };

  imageInput.addEventListener("change", event => {
    uploadImages([...event.target.files]);
  });

  dropZone.ondragover = event => event.preventDefault();
  dropZone.ondrop = event => {
    event.preventDefault();
    uploadImages([...event.dataTransfer.files]);
  };

  saveBtn.onclick = async () => {
    await supabase
      .from("products")
      .update({
        name: name.value.trim(),
        slug: slug.value.trim(),
        mrp: Number(mrp.value) || null,
        price: Number(price.value) || null,
        base_price: Number(price.value) || null,
        short_description: shortDesc.value.trim() || null,
        long_description: longDesc.value.trim() || null,
        brand_id: brand.value || null,
        category_id: category.value || null,
        case_size: caseSize.value.trim() || null,
        movement: movement.value.trim() || null,
        glass: glass.value.trim() || null,
        water_resistance: waterResistance.value.trim() || null,
        crafting_time: craftingTime.value.trim() || null,
        active: active.checked
      })
      .eq("id", id);

    const { data: existingMaterial } = await supabase
      .from("product_materials")
      .select("id")
      .eq("product_id", id)
      .maybeSingle();

    const materialsPayload = {
      product_id: id,
      gold_type: goldType.value.trim() || null,
      gold_weight: goldWeight.value.trim() || null,
      diamond_carat: diamondCarat.value.trim() || null,
      diamond_count: diamondCount.value.trim() || null,
      wood_type: woodType.value.trim() || null
    };

    if (existingMaterial?.id) {
      await supabase.from("product_materials").update(materialsPayload).eq("id", existingMaterial.id);
    } else {
      await supabase.from("product_materials").insert(materialsPayload);
    }

    const specsPayload = [...document.querySelectorAll(".spec-row")]
      .map(row => ({
        product_id: id,
        spec_name: row.querySelector(".spec-name")?.value?.trim(),
        spec_value: row.querySelector(".spec-value")?.value?.trim()
      }))
      .filter(item => item.spec_name && item.spec_value);

    await supabase.from("product_specs").delete().eq("product_id", id);
    if (specsPayload.length) await supabase.from("product_specs").insert(specsPayload);

    const reviewsPayload = [...document.querySelectorAll(".review-row")]
      .map(row => ({
        product_id: id,
        name: row.querySelector(".review-name")?.value?.trim(),
        rating: Number(row.querySelector(".review-rating")?.value) || null,
        review: row.querySelector(".review-text")?.value?.trim()
      }))
      .filter(item => item.name && item.review);

    await supabase.from("product_reviews").delete().eq("product_id", id);
    if (reviewsPayload.length) await supabase.from("product_reviews").insert(reviewsPayload);

    const faqPayload = [...document.querySelectorAll(".faq-row")]
      .map(row => ({
        product_id: id,
        question: row.querySelector(".faq-q")?.value?.trim(),
        answer: row.querySelector(".faq-a")?.value?.trim()
      }))
      .filter(item => item.question && item.answer);

    await supabase.from("product_faq").delete().eq("product_id", id);
    if (faqPayload.length) await supabase.from("product_faq").insert(faqPayload);

    const customizationPayload = customizationInputs
      .filter(input => input.checked)
      .map(input => ({
        product_id: id,
        custom_option: input.value
      }));

    await supabase.from("product_customization").delete().eq("product_id", id);
    if (customizationPayload.length) await supabase.from("product_customization").insert(customizationPayload);

    alert("Product updated");
  };

  await loadBrands();
  await loadCategories();
  await loadProduct();
});

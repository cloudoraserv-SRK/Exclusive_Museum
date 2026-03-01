import { supabase } from "../admin/supabaseClient.js";

/* ELEMENTS */
const colorsEl = document.getElementById("colors");
const sizesEl = document.getElementById("sizes");
const galleryMain = document.getElementById("galleryMain");
const thumbs = document.getElementById("thumbs");
const addToCartBtn = document.getElementById("addToCartBtn");

const productName = document.getElementById("productName");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productMrp = document.getElementById("productMrp");
const longDesc = document.getElementById("longDesc");
const productBrand = document.getElementById("productBrand");

const slug = new URLSearchParams(location.search).get("slug");
if (!slug) throw new Error("Slug missing");

let productId = null;
let variants = [];
let currentVariant = null;
let selectedSize = null;

let hasColor = false;
let hasSize = false;

/* ================= LOAD PRODUCT ================= */

async function loadProduct() {

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      short_description,
      long_description,
      price,
      mrp,
      brands:brand_id ( name )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!product) return;

  productId = product.id;

  productName.textContent = product.name || "";
  productBrand.textContent = product.brands?.name || "";
  productDesc.textContent = product.short_description || "";
  productPrice.textContent = `₹${product.price}`;
  productMrp.textContent = product.mrp ? `₹${product.mrp}` : "";
  longDesc.textContent = product.long_description || "";

  await loadVariants();
  updateCartCount();

  addToCartBtn?.addEventListener("click", addToCart);
}

loadProduct();

/* ================= VARIANTS ================= */

async function loadVariants() {

  const { data } = await supabase
    .from("variants")
    .select(`
      id,
      color,
      image_gallery,
      variant_stock ( size, stock )
    `)
    .eq("product_id", productId);

  variants = data || [];

  /* AUTO DETECT */
  hasColor = variants.length > 0;
  hasSize = variants.some(v => v.variant_stock?.length > 0);

  if (!hasColor && colorsEl) colorsEl.style.display = "none";
  if (!hasSize && sizesEl) sizesEl.style.display = "none";

  if (!variants.length) return;

  renderColors();

  setVariant(variants[0]);
}

/* ================= COLORS ================= */

function renderColors() {

  if (!hasColor || !colorsEl) return;

  colorsEl.innerHTML = "";

  variants.forEach((v, i) => {

    const el = document.createElement("span");
    el.className = "color";
    el.style.background = mapColor(v.color);

    el.onclick = () => {
      document.querySelectorAll(".color")
        .forEach(c => c.classList.remove("active"));
      el.classList.add("active");
      setVariant(v);
    };

    if (i === 0) el.classList.add("active");
    colorsEl.appendChild(el);
  });
}

function setVariant(v) {
  currentVariant = v;
  renderImages(v.image_gallery || []);
  renderSizes(v.variant_stock || []);
}

/* ================= IMAGES ================= */

function renderImages(images) {

  galleryMain.innerHTML = "";
  thumbs.innerHTML = "";

  if (!images.length) {
    galleryMain.innerHTML =
      `<img src="../assets/images/placeholder.png">`;
    return;
  }

  images.forEach((path, i) => {

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(path);

    const url = data.publicUrl;

    if (i === 0) galleryMain.innerHTML = `<img src="${url}">`;

    const img = document.createElement("img");
    img.src = url;
    img.onclick = () =>
      galleryMain.innerHTML = `<img src="${url}">`;

    thumbs.appendChild(img);
  });
}

/* ================= SIZES ================= */

function renderSizes(stockData) {

  if (!hasSize || !sizesEl) return;

  sizesEl.innerHTML = "";
  selectedSize = null;

  stockData.forEach(s => {

    if (s.stock <= 0) return;

    const btn = document.createElement("button");
    btn.className = "size";
    btn.textContent = s.size;

    btn.onclick = () => {
      document.querySelectorAll(".size")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = s.size;
    };

    sizesEl.appendChild(btn);
  });
}

/* ================= CART ================= */

function addToCart() {

  if (hasColor && !currentVariant)
    return alert("Select color");

  if (hasSize && !selectedSize)
    return alert("Select size");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const key = `${productId}_${currentVariant?.id || "default"}_${selectedSize || "nosize"}`;

  const found = cart.find(i => i.key === key);

  if (found) found.qty++;
  else {
    cart.push({
      key,
      product_id: productId,
      variant_id: currentVariant?.id || null,
      name: productName.textContent,
      brand: productBrand.textContent,
      color: currentVariant?.color || null,
      size: selectedSize || null,
      price: Number(productPrice.textContent.replace("₹", "")),
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert("Added to cart");
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent =
    cart.reduce((s, i) => s + i.qty, 0);
}

/* COLOR MAP */
function mapColor(c) {
  return {
    black: "#000",
    brown: "#8B4513",
    tan: "#D2B48C",
    white: "#fff",
    beige: "#f5f5dc",
    grey: "#999",
    gold: "#d4af37",
    silver: "#c0c0c0"
  }[c?.toLowerCase()] || "#ccc";
}
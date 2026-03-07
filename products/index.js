import { supabase } from "../admin/supabaseClient.js";

const grid = document.getElementById("productsGrid");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadProducts();
  updateCartCount();
}

/* ================= LOAD PRODUCTS ================= */

async function loadProducts() {

  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const categorySlug = params.get("category");
  const styleSlug = params.get("style");
  const brandSlug = params.get("brand");

  let query = supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      price,
      mrp,
      short_description,
      active,
      brands:brand_id ( id, name, slug ),
      styles:style_id ( id, name, slug ),
      categories:category_id ( id, name, slug ),
      variants (
        id,
        image_gallery,
        variant_stock (
          size,
          stock
        )
      )
    `)
    .eq("active", true);

  if (brandSlug) query = query.eq("brands.slug", brandSlug);
  if (categorySlug) query = query.eq("categories.slug", categorySlug);
  if (styleSlug) query = query.eq("styles.slug", styleSlug);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.innerHTML = "<p>Error loading products</p>";
    return;
  }

  renderProducts(data || []);
}

/* ================= RENDER PRODUCTS ================= */

function renderProducts(products) {

  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(p => {

    /* IMAGE */

    let imageUrl = "../assets/images/placeholder.png";

    const variant = p.variants?.[0];

    if (variant?.image_gallery?.length) {

      const { data } = supabase.storage
        .from("product-images")   // ✅ correct bucket
        .getPublicUrl(variant.image_gallery[0]);

      imageUrl = data.publicUrl;

    }

    /* SIZES */

    let sizes = [];

    p.variants?.forEach(v => {
      v.variant_stock?.forEach(s => {
        if (s.stock > 0) sizes.push(s.size);
      });
    });

    sizes = [...new Set(sizes)];

    grid.insertAdjacentHTML("beforeend", `

      <div class="product-card">

        <a href="product.html?slug=${p.slug}" class="product-link">

          <img src="${imageUrl}" alt="${p.name}">

          <div class="product-info">

            <h4 class="brand">${p.brands?.name || ""}</h4>

            <h3>${p.name}</h3>

            <div class="price-row">

              ${p.mrp ? `<span class="mrp">$${p.mrp}</span>` : ""}

              <span class="price">$${p.price}</span>

            </div>

            <p class="desc">${p.short_description || ""}</p>

          </div>

        </a>

        <select class="size-select">

          <option value="">Select Size</option>

          ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}

        </select>

        <button class="add-btn"

          data-id="${p.id}"

          data-name="${p.name}"

          data-price="${p.price}"

        >

          Add to Cart

        </button>

      </div>

    `);

  });

  initCartButtons();
}

/* ================= CART ================= */

function initCartButtons() {

  document.querySelectorAll(".add-btn").forEach(btn => {

    btn.onclick = () => {

      const card = btn.closest(".product-card");

      const size = card.querySelector(".size-select").value;

      if (!size) {
        alert("Select size first");
        return;
      }

      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price);

      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      const existing = cart.find(i => i.id === id && i.size === size);

      if (existing) existing.qty++;

      else cart.push({
        product_id:id,
        name,
        price,
        size,
        qty:1
      });

      localStorage.setItem("cart", JSON.stringify(cart));

      updateCartCount();

      alert("Added to cart");

    };

  });

}

/* ================= CART COUNT ================= */

function updateCartCount() {

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const el = document.getElementById("cartCount");

  if (el) {

    const count = cart.reduce((a,b)=>a + b.qty,0);

    el.textContent = count;

  }

}

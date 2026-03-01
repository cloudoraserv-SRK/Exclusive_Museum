import { supabase } from "./admin/supabaseClient.js";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  initHamburger();
});

/* ================= CART ================= */

function addToCart(id, name, price, size) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(i => i.id === id && i.size === size);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price, size, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");

  if (el) {
    el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
  }
}

/* ================= HAMBURGER ================= */

function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav-links");

  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}
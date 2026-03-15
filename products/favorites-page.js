import { getFavorites, toggleFavorite, updateFavoritesCount } from "./favorites.js";
import { initAccountSessionSync, updateAccountUI } from "./user-auth.js";
import { formatMoney, initLocaleExperience } from "../locale.js";

const favoritesGrid = document.getElementById("favoritesGrid");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const favoritesTotal = document.getElementById("favoritesTotal");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const el = document.getElementById("cartCount");
  if (el) el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function initHeader() {
  const hamburger = document.getElementById("hamburger");
  const nav = document.querySelector(".nav-links");
  hamburger?.addEventListener("click", () => nav?.classList.toggle("active"));
}

function init() {
  initHeader();
  updateCartCount();
  initLocaleExperience();
  initAccountSessionSync();
  updateFavoritesCount();
  updateAccountUI();
  window.addEventListener("favorites:updated", () => {
    updateFavoritesCount();
    renderFavorites();
  });
  window.addEventListener("em:locale-changed", renderFavorites);
  renderFavorites();
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesGrid.innerHTML = "";

  if (favoritesTotal) {
    favoritesTotal.textContent = `${favorites.length} ${favorites.length === 1 ? "piece" : "pieces"} selected`;
  }

  const empty = favorites.length === 0;
  favoritesEmpty.hidden = !empty;
  favoritesGrid.hidden = empty;

  if (empty) return;

  favorites.forEach(item => {
    favoritesGrid.insertAdjacentHTML("beforeend", `
      <article class="favorite-card">
        <a href="./product.html?id=${encodeURIComponent(item.id)}&slug=${encodeURIComponent(item.slug || "")}">
          <img src="${item.image}" alt="${item.name}">
        </a>
        <div class="favorite-copy">
          <span class="favorite-brand">${item.brand || "Exclusive Museum"}</span>
          <h3>${item.name}</h3>
          <p>${item.description || "Collector-grade handcrafted piece."}</p>
          <div class="favorite-footer">
            <span class="favorite-price">${formatMoney(item.price ?? 0)}</span>
          </div>
          <div class="favorite-actions">
            <a class="favorite-action" href="./product.html?id=${encodeURIComponent(item.id)}&slug=${encodeURIComponent(item.slug || "")}">View Piece</a>
            <button class="favorite-remove" type="button" data-remove-id="${item.id}">Remove</button>
          </div>
        </div>
      </article>
    `);
  });

  favoritesGrid.querySelectorAll("[data-remove-id]").forEach(button => {
    button.addEventListener("click", () => {
      const current = favorites.find(item => item.id === button.dataset.removeId);
      if (!current) return;
      toggleFavorite(current);
    });
  });
}

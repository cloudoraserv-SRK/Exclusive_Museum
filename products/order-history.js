import { supabase } from "../admin/supabaseClient.js";
import { updateFavoritesCount } from "./favorites.js";
import { getCurrentUser, initAccountSessionSync, updateAccountUI } from "./user-auth.js";

const historyGrid = document.getElementById("historyGrid");
const historyEmpty = document.getElementById("historyEmpty");
const historyPrompt = document.getElementById("historyPrompt");
const historyTotal = document.getElementById("historyTotal");

const statusToneMap = {
  payment_in_progress: "pending",
  payment_verified: "success",
  pending: "pending",
  processing: "pending",
  shipped: "success",
  delivered: "success",
  cancelled: "failed",
  failed: "failed"
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init().catch(handleHistoryError);
  });
} else {
  init().catch(handleHistoryError);
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

function formatStatusLabel(status) {
  return (status || "pending")
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderItems(items = []) {
  if (!items.length) {
    return `<div class="history-item"><div><strong>Order items unavailable</strong><small>Item details were not returned for this order.</small></div></div>`;
  }

  return items.map(item => {
    const quantity = item.qty || item.quantity || 1;
    return `
      <div class="history-item">
        <div>
          <strong>${item.product_name || "Exclusive Museum Piece"}</strong>
          <small>Qty ${quantity}${item.size ? ` • ${item.size}` : ""}</small>
        </div>
        <span class="history-price">$${Number(item.price || 0).toFixed(2)}</span>
      </div>
    `;
  }).join("");
}

function renderOrders(orders) {
  historyGrid.innerHTML = "";

  orders.forEach(order => {
    const orderTone = statusToneMap[order.order_status] || "pending";
    const paymentTone = statusToneMap[order.payment_status] || "pending";

    historyGrid.insertAdjacentHTML("beforeend", `
      <article class="history-card">
        <div class="history-top">
          <div>
            <span class="detail-label">Order Reference</span>
            <h2>${order.order_id || "Order"}</h2>
            <p class="history-sub">Placed ${formatDate(order.created_at)}</p>
          </div>
          <div class="status-stack">
            <span class="status-pill ${paymentTone}">Payment ${formatStatusLabel(order.payment_status)}</span>
            <span class="status-pill ${orderTone}">${formatStatusLabel(order.order_status)}</span>
          </div>
        </div>

        <div class="history-meta">
          <div>
            <span>Total</span>
            <strong>$${Number(order.total_amount || 0).toFixed(2)}</strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>${formatStatusLabel(order.payment_method || "manual review")}</strong>
          </div>
          <div>
            <span>Delivery City</span>
            <strong>${order.city || order.country || "Not provided"}</strong>
          </div>
          <div>
            <span>Address</span>
            <strong>${order.address || "Available in checkout record"}</strong>
          </div>
        </div>

        <div class="history-items">
          ${renderItems(order.order_items)}
        </div>
      </article>
    `);
  });
}

async function loadOrderHistory() {
  historyGrid.innerHTML = "";
  historyEmpty.hidden = true;
  historyPrompt.hidden = true;

  const user = await getCurrentUser();
  if (!user?.email) {
    historyTotal.textContent = "Sign in required";
    historyPrompt.hidden = false;
    return;
  }

  historyTotal.textContent = "Loading your order archive...";

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,order_id,total_amount,payment_method,payment_status,order_status,created_at,address,city,country,email,user_email,
      order_items(product_name,price,qty,quantity,size)
    `)
    .or(`email.eq.${user.email},user_email.eq.${user.email}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    historyTotal.textContent = "Unable to load order history right now";
    historyEmpty.hidden = false;
    historyEmpty.innerHTML = `
      <h2>We could not load your orders</h2>
      <p>Please try again shortly, or use the order tracking page with your Order ID and phone number.</p>
    `;
    return;
  }

  const orders = data || [];
  historyTotal.textContent = `${orders.length} ${orders.length === 1 ? "order" : "orders"} linked to ${user.email}`;

  if (!orders.length) {
    historyEmpty.hidden = false;
    return;
  }

  renderOrders(orders);
}

async function init() {
  initHeader();
  updateCartCount();
  initAccountSessionSync();
  updateFavoritesCount();
  await updateAccountUI();
  await loadOrderHistory();

  window.addEventListener("account:updated", async () => {
    await updateAccountUI();
    await loadOrderHistory();
  });
}

function handleHistoryError(error) {
  console.error(error);
  if (historyTotal) {
    historyTotal.textContent = "Unable to load order history right now";
  }
}

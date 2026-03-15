import { supabase } from "../admin/supabaseClient.js";
import { formatDateTime, formatMoney, initLocaleExperience } from "../locale.js";

const trackBtn = document.getElementById("trackBtn");
const orderIdInput = document.getElementById("orderId");
const phoneInput = document.getElementById("phone");
const statusBox = document.getElementById("status");
const hamburger = document.getElementById("hamburger");
const navLinks = document.querySelector(".nav-links");

const statusToneMap = {
  payment_in_progress: "pending",
  payment_verified: "success",
  processing: "pending",
  shipped: "success",
  delivered: "success"
};

function formatStatusLabel(status) {
  return (status || "pending")
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const params = new URLSearchParams(window.location.search);
orderIdInput.value = params.get("order_id") || "";
phoneInput.value = params.get("phone") || "";

initLocaleExperience();

hamburger?.addEventListener("click", () => {
  navLinks?.classList.toggle("active");
});

trackBtn?.addEventListener("click", async () => {
  const orderId = orderIdInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!orderId || !phone) {
    statusBox.style.display = "block";
    statusBox.innerHTML = "Please enter your Order ID and phone number.";
    return;
  }

  statusBox.style.display = "block";
  statusBox.innerHTML = "Checking your order...";

  const { data, error } = await supabase.functions.invoke("track-order", {
    body: {
      order_id: orderId,
      phone
    }
  });

  if (error || !data?.order) {
    statusBox.innerHTML = "Order not found. Please check the Order ID and phone number.";
    return;
  }

  const order = data.order;
  const tone = statusToneMap[order.order_status] || "pending";
  const createdAt = order.created_at ? formatDateTime(order.created_at) : "Not available";

  statusBox.innerHTML = `
    <strong>Order ID:</strong> ${order.order_id}<br>
    <strong>Name:</strong> ${order.customer_name}<br>
    <strong>Total:</strong> ${formatMoney(order.total_amount || 0)}<br>
    <strong>Placed:</strong> ${createdAt}<br>
    <strong>Payment:</strong> ${formatStatusLabel(order.payment_status)}<br>
    <strong>Order Status:</strong> <span class="${tone}">${formatStatusLabel(order.order_status)}</span>
  `;
});

if (orderIdInput.value && phoneInput.value) {
  trackBtn?.click();
}

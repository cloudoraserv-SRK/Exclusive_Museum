import { supabase } from "./admin/supabaseClient.js";
import { hydrateAccountUIFromSnapshot, initAccountSessionSync, updateAccountUI } from "./products/user-auth.js";
import { initLocaleExperience } from "./locale.js";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  initHamburger();
  initLocaleExperience();
  hydrateAccountUIFromSnapshot();
  initAccountSessionSync();
  updateAccountUI();
});

window.addEventListener("pageshow", () => {
  updateCartCount();
  hydrateAccountUIFromSnapshot();
  updateAccountUI();
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

const reveals=document.querySelectorAll(".reveal");

window.addEventListener("scroll",()=>{
const trigger=window.innerHeight*0.85;

reveals.forEach(el=>{
const top=el.getBoundingClientRect().top;

if(top<trigger){
el.classList.add("active");
}
});
});

function animateCart(){
const cart=document.querySelector(".cart-icon");

cart.classList.add("cart-animate");

setTimeout(()=>{
cart.classList.remove("cart-animate");
},600);
}

document.querySelectorAll(".btn-luxury").forEach(btn => {

btn.addEventListener("mousemove", e => {

const rect=btn.getBoundingClientRect();

const x=e.clientX-rect.left;
const y=e.clientY-rect.top;

btn.style.transform=`translate(${(x-rect.width/2)/6}px, ${(y-rect.height/2)/6}px)`;

});

btn.addEventListener("mouseleave", ()=>{
btn.style.transform="translate(0,0)";
});

});


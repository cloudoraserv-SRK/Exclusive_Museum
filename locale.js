const LANGUAGE_KEY = "em_language";
const CURRENCY_KEY = "em_currency";

const DEFAULT_LANGUAGE = "en";
const DEFAULT_CURRENCY = "USD";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" }
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "INR", label: "INR" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AED", label: "AED" }
];

const USD_EXCHANGE_RATES = {
  USD: 1,
  INR: 83.1,
  EUR: 0.92,
  GBP: 0.78,
  AED: 3.67
};

const LANGUAGE_COPY = {
  en: {
    account: "Account",
    guest: "Guest",
    saved: "Saved",
    home: "Home",
    collections: "Collections",
    trackOrder: "Track Order",
    contact: "Contact",
    savedItems: "Saved Items",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    shipping: "Shipping & Returns",
    shop: "Shop",
    story: "Story",
    collection: "Collection",
    proceedToCheckout: "Proceed to Checkout",
    total: "Total",
    yourExclusiveCart: "Your Exclusive Cart",
    continueShopping: "Continue Shopping",
    emptyCart: "Your cart is empty",
    addSomethingAmazing: "Add something amazing to get started",
    addToCart: "Add to Cart",
    save: "Save",
    savedState: "Saved",
    orderReference: "Order Reference",
    paymentMethod: "Payment Method",
    deliveryCity: "Delivery City",
    address: "Address",
    language: "Language",
    currency: "Currency",
    admin: "Admin",
    products: "Products",
    orders: "Orders"
  },
  hi: {
    account: "Akaunt",
    guest: "Mehman",
    saved: "Saved",
    home: "Home",
    collections: "Collections",
    trackOrder: "Order Track Karein",
    contact: "Sampark",
    savedItems: "Saved Items",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    shipping: "Shipping & Returns",
    shop: "Shop",
    story: "Story",
    collection: "Collection",
    proceedToCheckout: "Checkout Karein",
    total: "Kul",
    yourExclusiveCart: "Aapka Exclusive Cart",
    continueShopping: "Shopping Jaari Rakhein",
    emptyCart: "Aapka cart khaali hai",
    addSomethingAmazing: "Shuruaat ke liye koi khaas piece add karein",
    addToCart: "Cart Mein Add Karein",
    save: "Save Karein",
    savedState: "Saved",
    orderReference: "Order Reference",
    paymentMethod: "Payment Method",
    deliveryCity: "Delivery City",
    address: "Address",
    language: "Bhasha",
    currency: "Currency",
    admin: "Admin",
    products: "Products",
    orders: "Orders"
  },
  ar: {
    account: "الحساب",
    guest: "زائر",
    saved: "المحفوظة",
    home: "الرئيسية",
    collections: "المجموعات",
    trackOrder: "تتبع الطلب",
    contact: "اتصل بنا",
    savedItems: "العناصر المحفوظة",
    legal: "قانوني",
    privacy: "سياسة الخصوصية",
    terms: "الشروط والأحكام",
    shipping: "الشحن والإرجاع",
    shop: "تسوق",
    story: "القصة",
    collection: "المجموعة",
    proceedToCheckout: "المتابعة للدفع",
    total: "الإجمالي",
    yourExclusiveCart: "سلة التسوق الخاصة بك",
    continueShopping: "متابعة التسوق",
    emptyCart: "سلة التسوق فارغة",
    addSomethingAmazing: "أضف قطعة مميزة للبدء",
    addToCart: "أضف إلى السلة",
    save: "حفظ",
    savedState: "محفوظ",
    orderReference: "مرجع الطلب",
    paymentMethod: "طريقة الدفع",
    deliveryCity: "مدينة التسليم",
    address: "العنوان",
    language: "اللغة",
    currency: "العملة",
    admin: "الإدارة",
    products: "المنتجات",
    orders: "الطلبات"
  },
  fr: {
    account: "Compte",
    guest: "Invité",
    saved: "Enregistrés",
    home: "Accueil",
    collections: "Collections",
    trackOrder: "Suivi de commande",
    contact: "Contact",
    savedItems: "Articles enregistrés",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    terms: "Conditions",
    shipping: "Livraison et retours",
    shop: "Boutique",
    story: "Histoire",
    collection: "Collection",
    proceedToCheckout: "Passer au paiement",
    total: "Total",
    yourExclusiveCart: "Votre panier exclusif",
    continueShopping: "Continuer vos achats",
    emptyCart: "Votre panier est vide",
    addSomethingAmazing: "Ajoutez une pièce exceptionnelle pour commencer",
    addToCart: "Ajouter au panier",
    save: "Enregistrer",
    savedState: "Enregistré",
    orderReference: "Référence de commande",
    paymentMethod: "Mode de paiement",
    deliveryCity: "Ville de livraison",
    address: "Adresse",
    language: "Langue",
    currency: "Devise",
    admin: "Admin",
    products: "Produits",
    orders: "Commandes"
  },
  es: {
    account: "Cuenta",
    guest: "Invitado",
    saved: "Guardados",
    home: "Inicio",
    collections: "Colecciones",
    trackOrder: "Rastrear pedido",
    contact: "Contacto",
    savedItems: "Guardados",
    legal: "Legal",
    privacy: "Privacidad",
    terms: "Términos",
    shipping: "Envíos y devoluciones",
    shop: "Tienda",
    story: "Historia",
    collection: "Colección",
    proceedToCheckout: "Ir al pago",
    total: "Total",
    yourExclusiveCart: "Tu carrito exclusivo",
    continueShopping: "Seguir comprando",
    emptyCart: "Tu carrito está vacío",
    addSomethingAmazing: "Agrega una pieza especial para comenzar",
    addToCart: "Agregar al carrito",
    save: "Guardar",
    savedState: "Guardado",
    orderReference: "Referencia del pedido",
    paymentMethod: "Método de pago",
    deliveryCity: "Ciudad de entrega",
    address: "Dirección",
    language: "Idioma",
    currency: "Moneda",
    admin: "Admin",
    products: "Productos",
    orders: "Pedidos"
  }
};

function normalizeLanguage(value) {
  return String(value || DEFAULT_LANGUAGE).toLowerCase().split("-")[0];
}

function detectLanguage() {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && LANGUAGE_COPY[stored]) return stored;

  const browser = normalizeLanguage(navigator.language);
  return LANGUAGE_COPY[browser] ? browser : DEFAULT_LANGUAGE;
}

function detectCurrency(language) {
  const stored = localStorage.getItem(CURRENCY_KEY);
  if (stored && USD_EXCHANGE_RATES[stored]) return stored;

  const locale = String(navigator.language || "").toLowerCase();
  if (locale.includes("en-in") || locale.includes("-in") || language === "hi") return "INR";
  if (locale.includes("ar-ae") || locale.includes("-ae")) return "AED";
  if (locale.includes("en-gb") || locale.includes("-gb")) return "GBP";
  if (locale.includes("fr") || locale.includes("de") || locale.includes("es") || locale.includes("it")) return "EUR";
  return DEFAULT_CURRENCY;
}

let currentLanguage = detectLanguage();
let currentCurrency = detectCurrency(currentLanguage);

export function getLocaleState() {
  return {
    language: currentLanguage,
    currency: currentCurrency
  };
}

export function t(key) {
  return LANGUAGE_COPY[currentLanguage]?.[key] || LANGUAGE_COPY.en[key] || key;
}

export function setLanguage(language) {
  currentLanguage = LANGUAGE_COPY[language] ? language : DEFAULT_LANGUAGE;
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  window.dispatchEvent(new CustomEvent("em:locale-changed", {
    detail: getLocaleState()
  }));
}

export function setCurrency(currency) {
  currentCurrency = USD_EXCHANGE_RATES[currency] ? currency : DEFAULT_CURRENCY;
  localStorage.setItem(CURRENCY_KEY, currentCurrency);
  window.dispatchEvent(new CustomEvent("em:locale-changed", {
    detail: getLocaleState()
  }));
}

export function convertUsdAmount(amount) {
  const numeric = Number(amount || 0);
  return numeric * (USD_EXCHANGE_RATES[currentCurrency] || 1);
}

export function formatMoney(amount, options = {}) {
  const currency = options.currency || currentCurrency;
  const language = options.language || currentLanguage;
  const numeric = Number(amount || 0);
  const converted = currency === "USD"
    ? numeric
    : numeric * (USD_EXCHANGE_RATES[currency] || 1);

  try {
    return new Intl.NumberFormat(`${language}-${language.toUpperCase()}`, {
      style: "currency",
      currency,
      maximumFractionDigits: converted >= 100 ? 0 : 2
    }).format(converted);
  } catch {
    const symbol = currency === "USD" ? "$" : `${currency} `;
    return `${symbol}${converted.toFixed(2)}`;
  }
}

export function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(navigator.language || "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function setText(selector, value, root = document) {
  const node = root.querySelector(selector);
  if (node && value) node.textContent = value;
}

export function applyCommonTranslations(root = document) {
  setText('[data-favorites-label]', t("saved"), root);
  root.querySelectorAll(".favorites-link > span:first-child").forEach(node => {
    node.textContent = t("saved");
  });

  root.querySelectorAll("[data-account-label]").forEach(node => {
    if (!node.textContent || node.textContent.trim().toLowerCase() === "account") {
      node.textContent = t("account");
    }
  });

  root.querySelectorAll("[data-account-state]").forEach(node => {
    if (!node.textContent || node.textContent.trim().toLowerCase() === "guest") {
      node.textContent = t("guest");
    }
  });

  root.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href") || "";
    if (href.includes("index.html") && !href.includes("products")) link.textContent = t("home");
    if (href.includes("products/index.html")) link.textContent = t("collections");
    if (href.includes("track.html")) link.textContent = t("trackOrder");
    if (href === "#contact") link.textContent = t("contact");
    if (href.includes("favorites.html")) link.textContent = t("savedItems");
    if (href.includes("privacy.html")) link.textContent = t("privacy");
    if (href.includes("terms.html")) link.textContent = t("terms");
    if (href.includes("shipping.html")) link.textContent = t("shipping");
  });
}

export function initLocaleControls(options = {}) {
  const scope = options.scope || "public";
  const container = document.querySelector(options.containerSelector || (scope === "admin" ? ".admin-header" : ".nav"));
  if (!container || container.querySelector(".locale-controls")) return;

  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

  const wrapper = document.createElement("div");
  wrapper.className = `locale-controls locale-controls-${scope}`;
  wrapper.innerHTML = `
    <label class="locale-chip">
      <span>${t("language")}</span>
      <select data-locale-language>
        ${LANGUAGE_OPTIONS.map(option => `<option value="${option.value}" ${option.value === currentLanguage ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </label>
    <label class="locale-chip">
      <span>${t("currency")}</span>
      <select data-locale-currency>
        ${CURRENCY_OPTIONS.map(option => `<option value="${option.value}" ${option.value === currentCurrency ? "selected" : ""}>${option.label}</option>`).join("")}
      </select>
    </label>
  `;

  container.appendChild(wrapper);

  wrapper.querySelector("[data-locale-language]")?.addEventListener("change", event => {
    setLanguage(event.target.value);
    applyCommonTranslations();
    wrapper.remove();
    initLocaleControls(options);
  });

  wrapper.querySelector("[data-locale-currency]")?.addEventListener("change", event => {
    setCurrency(event.target.value);
  });
}

export function initLocaleExperience(options = {}) {
  initLocaleControls(options);
  applyCommonTranslations(document);
}

import { supabase } from "./supabaseClient.js";
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

/* helpers */
const toInt = v => Math.round(Number(v) || 0);
const splitSafe = v => String(v || "").split("|").map(x => x.trim()).filter(Boolean);

async function getIdByName(table, name) {
  if (!name) return null;
  const { data } = await supabase
    .from(table)
    .select("id")
    .ilike("name", name)
    .limit(1)
    .single();
  return data?.id || null;
}

/* elements */
const fileInput = document.getElementById("excelFile");
const previewBtn = document.getElementById("previewBtn");
const uploadBtn = document.getElementById("uploadBtn");
const table = document.getElementById("previewTable");
const log = document.getElementById("log");
const progress = document.getElementById("progress");

let rows = [];

/* PREVIEW */
previewBtn.onclick = async () => {
  const buf = await fileInput.files[0].arrayBuffer();
  const wb = XLSX.read(buf);
  rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  render(rows);
};

function render(data) {
  table.querySelector("thead").innerHTML =
    `<tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.querySelector("tbody").innerHTML = data.map(r => `
    <tr>${Object.keys(r).map(k =>
      `<td contenteditable data-k="${k}">${r[k] ?? ""}</td>`
    ).join("")}</tr>
  `).join("");
}

function getRows() {
  return [...table.querySelectorAll("tbody tr")].map(tr => {
    const r = {};
    tr.querySelectorAll("td").forEach(td => r[td.dataset.k] = td.innerText.trim());
    return r;
  });
}

/* UPLOAD */
uploadBtn.onclick = async () => {
  const data = getRows();
  progress.max = data.length;
  progress.value = 0;
  log.textContent = "";

  for (const r of data) {
    try {
      const brand_id = await getIdByName("brands", r.brand);
      const category_id = await getIdByName("categories", r.category);

      const mrp = toInt(r.mrp);
      const price = toInt(r.price);
      const discount = mrp - price;

     const { data: product, error: pErr } = await supabase
  .from("products")
  .upsert({
    slug: r.slug,
    name: r.name,
    brand_id,
    category_id,
    mrp,
    price,
    base_price: price,
    discount,
short_description: r.short_description || null,
  long_description: r.long_description || null,
  active: ["1","true","yes"].includes(String(r.active).toLowerCase()),
  thumbnail_url: r.thumbnail_url || null
}, { onConflict: "slug" })
  .select("id")
  .single();

      if (pErr) throw pErr;

      const gallery = splitSafe(r.images || r.gallery_urls || r.image_urls);
      if (gallery.length) {
        await supabase
          .from("products")
          .update({
            images: gallery,
            gallery_urls: gallery,
            thumbnail_url: r.thumbnail_url || gallery[0]
          })
          .eq("id", product.id);
      }

      log.textContent += `✅ ${r.slug}\n`;
    } catch (e) {
      log.textContent += `❌ ${r.slug} → ${e.message}\n`;
    }
    progress.value++;
  }

  log.textContent += "\nDONE 🎉";
};

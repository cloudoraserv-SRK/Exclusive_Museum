import { supabase } from "./supabaseClient.js";
import { getNormalizedProductImages } from "../image-utils.js";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

const repairBtn = document.getElementById("repairBtn");
const log = document.getElementById("repairLog");

function toPublicUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("product-images")
    .getPublicUrl(path).data.publicUrl;
}

repairBtn.onclick = async () => {
  log.textContent = "Scanning products...\n";

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,images,gallery_urls,thumbnail_url")
    .order("created_at", { ascending: false });

  if (error) {
    log.textContent += `Error: ${error.message}`;
    return;
  }

  for (const product of products || []) {
    const images = getNormalizedProductImages(product);
    if (!images.length) {
      log.textContent += `Skipped: ${product.name} (no usable images found)\n`;
      continue;
    }

    const payload = {
      images,
      gallery_urls: images,
      thumbnail_url: toPublicUrl(images[0])
    };

    const { error: updateError } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.id);

    if (updateError) {
      log.textContent += `Failed: ${product.name} -> ${updateError.message}\n`;
    } else {
      log.textContent += `Updated: ${product.name}\n`;
    }
  }

  log.textContent += "\nDone.";
};

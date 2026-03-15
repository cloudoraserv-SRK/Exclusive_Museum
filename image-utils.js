export function normalizeImageList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    }

    if (trimmed.includes("|")) return trimmed.split("|").map(item => item.trim()).filter(Boolean);
    if (trimmed.includes(",")) return trimmed.split(",").map(item => item.trim()).filter(Boolean);

    return [trimmed];
  }

  return [];
}

export function extractStoragePath(value) {
  if (!value || typeof value !== "string") return value;

  const marker = "/storage/v1/object/public/product-images/";
  const index = value.indexOf(marker);

  if (index === -1) return value;

  return decodeURIComponent(value.slice(index + marker.length));
}

export function getNormalizedProductImages(product) {
  const direct = normalizeImageList(product?.images).map(extractStoragePath);
  if (direct.length) return direct;

  const gallery = normalizeImageList(product?.gallery_urls).map(extractStoragePath);
  if (gallery.length) return gallery;

  if (product?.thumbnail_url) return [extractStoragePath(product.thumbnail_url)];
  return [];
}

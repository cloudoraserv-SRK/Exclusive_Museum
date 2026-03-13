import { supabase } from "./supabaseClient.js";

const list = document.getElementById("productsList");

async function loadProducts() {

 const { data: products, error } = await supabase
  .from("products")
  .select("id,name,price,mrp,images")
  .order("created_at", { ascending: false });

  if (error) {
    alert("Failed to load products");
    return;
  }

  list.innerHTML = "";

  for (let p of products) {

    /* GET IMAGE */

let imageUrl = "../assets/images/placeholder.png";

if (p.images && p.images.length) {
  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(p.images[0]);

  imageUrl = data.publicUrl;
}
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `

      <img src="${imageUrl}" class="product-thumb">

      <div class="product-info">

        <h3>${p.name}</h3>

        <p>₹${p.price}</p>

        <button onclick="editProduct('${p.id}')">
          Edit
        </button>

        <button class="danger" onclick="deleteProduct('${p.id}')">
          Delete
        </button>

      </div>
    `;

    list.appendChild(div);
  }

}

/* EDIT */

window.editProduct = (id) => {
  location.href = `product-edit.html?id=${id}`;
};

/* DELETE */

window.deleteProduct = async (id) => {

  if (!confirm("Delete product?")) return;

  const { data: vars } = await supabase
    .from("variants")
    .select("id")
    .eq("product_id", id);

  for (let v of vars || []) {

    await supabase
      .from("variant_stock")
      .delete()
      .eq("variant_id", v.id);

  }

  await supabase
    .from("variants")
    .delete()
    .eq("product_id", id);

  await supabase
    .from("products")
    .delete()
    .eq("id", id);

  loadProducts();

};

loadProducts();

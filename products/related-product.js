import { supabase } from "../admin/supabaseClient.js";

document.addEventListener("DOMContentLoaded",()=>{

const relatedGrid=document.getElementById("relatedGrid");
const loadMoreBtn=document.getElementById("loadMoreRelated");

const slug=new URLSearchParams(location.search).get("slug");

if(!relatedGrid || !slug) return;

let page=0;
const limit=4;

let currentProduct=null;

init();

/* ================= INIT ================= */

async function init(){

const {data,error}=await supabase
.from("products")
.select("id,brand_id,category_id")
.eq("slug",slug)
.single();

if(error || !data) return;

currentProduct=data;

loadRelated();

loadMoreBtn?.addEventListener("click",()=>{

page++;
loadRelated();

});

}

/* ================= LOAD RELATED ================= */

async function loadRelated(){

const from=page*limit;

let query=supabase
.from("products")
.select(`
id,
name,
slug,
price,
short_description,
brand_id,
category_id,
brands:brand_id(name),
categories:category_id(name),
variants(
id,
color,
image_gallery,
variant_stock(size,stock)
)
`)
.neq("id",currentProduct.id)
.eq("active",true);

/* related logic */

query=query.or(
`brand_id.eq.${currentProduct.brand_id},category_id.eq.${currentProduct.category_id}`
);

const {data:products,error}=await query
.order("created_at",{ascending:false})
.range(from,from+limit-1);

if(error){

console.error(error);
return;

}

if(!products?.length){

if(page===0){

relatedGrid.innerHTML="<p>No related products</p>";

}

loadMoreBtn && (loadMoreBtn.style.display="none");

return;

}

products.forEach(renderCard);

}

/* ================= CARD ================= */

function renderCard(p){

const variant=p.variants?.[0];

let img="../assets/images/placeholder.png";

if(variant?.image_gallery?.length){

const {data}=supabase.storage
.from("product-images")
.getPublicUrl(variant.image_gallery[0]);

img=data.publicUrl;

}

/* COLORS */

const colors=[...new Set(

p.variants?.map(v=>v.color)

)].filter(Boolean).join(", ");

/* SIZES */

const sizes=[...new Set(

p.variants?.flatMap(v=>

v.variant_stock
?.filter(s=>s.stock>0)
.map(s=>s.size)

)

)].filter(Boolean).join(", ");

/* CARD */

relatedGrid.insertAdjacentHTML("beforeend",`

<div class="related-card" data-slug="${p.slug}">

<img src="${img}" alt="${p.name}">

<div class="card-body">

<small class="brand">${p.brands?.name || ""}</small>

<h4>${p.name}</h4>

<p class="category">${p.categories?.name || ""}</p>

<p class="desc">${p.short_description || ""}</p>

<p class="meta"><b>Colors:</b> ${colors || "N/A"}</p>

<p class="meta"><b>Sizes:</b> ${sizes || "N/A"}</p>

<span class="price">$${p.price}</span>

</div>

</div>

`);

}

/* ================= CLICK ================= */

relatedGrid.addEventListener("click",(e)=>{

const card=e.target.closest(".related-card");

if(!card) return;

location.href=`product.html?slug=${card.dataset.slug}`;

});

});

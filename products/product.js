import { supabase } from "../admin/supabaseClient.js";

const slug = new URLSearchParams(location.search).get("slug");

/* ELEMENTS */

const productName=document.getElementById("productName");
const productDesc=document.getElementById("productDesc");
const productPrice=document.getElementById("productPrice");
const productMrp=document.getElementById("productMrp");
const productBrand=document.getElementById("productBrand");
const longDesc=document.getElementById("longDesc");

const productSku=document.getElementById("productSku");
const stockStatus=document.getElementById("stockStatus");

const galleryMain=document.getElementById("galleryMain");
const thumbs=document.getElementById("thumbs");

const colorsEl=document.getElementById("colors");
const sizesEl=document.getElementById("sizes");

const specGrid=document.getElementById("specGrid");
const materialsGrid=document.getElementById("materialsGrid");
const customGrid=document.getElementById("customGrid");

const reviewsList=document.getElementById("reviewsList");
const faqList=document.getElementById("faqList");

const addToCartBtn=document.getElementById("addToCartBtn");

let productId=null;
let variants=[];
let currentVariant=null;
let selectedSize=null;


/* ================= PRODUCT ================= */

async function loadProduct(){

const {data}=await supabase
.from("products")
.select(`
id,
name,
price,
mrp,
short_description,
long_description,
case_size,
movement,
glass,
water_resistance,
crafting_time,
brands:brand_id(name)
`)
.eq("slug",slug)
.eq("active",true)
.single();

if(!data) return;

productId=data.id;

productName.textContent=data.name;
productDesc.textContent=data.short_description;
productPrice.textContent="$"+data.price;
productMrp.textContent=data.mrp ? "$"+data.mrp : "";
productBrand.textContent=data.brands?.name || "";

longDesc.textContent=data.long_description;


/* WATCH SPECS */

specGrid.innerHTML=`

<div class="spec-item">
<span>Case Size</span>
<strong>${data.case_size||"-"}</strong>
</div>

<div class="spec-item">
<span>Movement</span>
<strong>${data.movement||"-"}</strong>
</div>

<div class="spec-item">
<span>Glass</span>
<strong>${data.glass||"-"}</strong>
</div>

<div class="spec-item">
<span>Water Resistance</span>
<strong>${data.water_resistance||"-"}</strong>
</div>

<div class="spec-item">
<span>Crafting Time</span>
<strong>${data.crafting_time||"-"}</strong>
</div>

`;

await loadMaterials();
await loadCustomization();
await loadVariants();
await loadReviews();
await loadFAQ();

}

loadProduct();


/* ================= MATERIALS ================= */

async function loadMaterials(){

const {data}=await supabase
.from("product_materials")
.select("*")
.eq("product_id",productId)
.maybeSingle();

if(!data){
materialsGrid.innerHTML="<p>No materials info</p>";
return;
}

materialsGrid.innerHTML=`

<div class="spec-item">
<span>Gold Type</span>
<strong>${data.gold_type}</strong>
</div>

<div class="spec-item">
<span>Gold Weight</span>
<strong>${data.gold_weight} g</strong>
</div>

<div class="spec-item">
<span>Diamond Carat</span>
<strong>${data.diamond_carat}</strong>
</div>

<div class="spec-item">
<span>Diamond Count</span>
<strong>${data.diamond_count}</strong>
</div>

<div class="spec-item">
<span>Wood Type</span>
<strong>${data.wood_type}</strong>
</div>

`;

}


/* ================= CUSTOMIZATION ================= */

async function loadCustomization(){

const {data}=await supabase
.from("product_customization")
.select("*")
.eq("product_id",productId);

customGrid.innerHTML="";

(data||[]).forEach(c=>{

customGrid.innerHTML+=`

<label class="custom-box">

<input type="checkbox" class="custom-check" value="${c.custom_option}">

<span>${c.custom_option}</span>

<input class="engrave-input" placeholder="Enter engraving text">

</label>

`;

});

}


/* ================= VARIANTS ================= */

async function loadVariants(){

const {data}=await supabase
.from("variants")
.select(`
id,
sku,
color,
image_gallery,
variant_stock(size,stock)
`)
.eq("product_id",productId);

variants=data||[];

renderColors();

if(variants.length) setVariant(variants[0]);

}


/* ================= COLORS ================= */

function renderColors(){

colorsEl.innerHTML="";

variants.forEach((v,i)=>{

const btn=document.createElement("span");

btn.className="color";

btn.style.background=mapColor(v.color);

btn.onclick=()=>{

document.querySelectorAll(".color")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

setVariant(v);

};

if(i===0) btn.classList.add("active");

colorsEl.appendChild(btn);

});

}


/* ================= SET VARIANT ================= */

function setVariant(v){

currentVariant=v;

productSku.textContent=v.sku || "-";

renderImages(v.image_gallery||[]);

renderSizes(v.variant_stock||[]);

}


/* ================= IMAGES ================= */

function renderImages(images){

galleryMain.innerHTML="";
thumbs.innerHTML="";

images.forEach((path,i)=>{

const {data}=supabase.storage
.from("product-images")
.getPublicUrl(path);

const url=data.publicUrl;

if(i===0)
galleryMain.innerHTML=`<img src="${url}">`;

const img=document.createElement("img");

img.src=url;

img.onclick=()=>{
galleryMain.innerHTML=`<img src="${url}">`;
};

thumbs.appendChild(img);

});

}


/* ================= SIZES ================= */

function renderSizes(stock){

sizesEl.innerHTML="";

let totalStock=0;

stock.forEach(s=>{

totalStock+=s.stock;

if(s.stock<=0) return;

const btn=document.createElement("button");

btn.className="size";

btn.textContent=s.size;

btn.onclick=()=>{

document.querySelectorAll(".size")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

selectedSize=s.size;

};

sizesEl.appendChild(btn);

});

stockStatus.textContent=totalStock>0 ? "In Stock" : "Out of Stock";

}


/* ================= REVIEWS ================= */

async function loadReviews(){

const {data}=await supabase
.from("product_reviews")
.select("*")
.eq("product_id",productId);

reviewsList.innerHTML="";

(data||[]).forEach(r=>{

reviewsList.innerHTML+=`

<div class="review">

<strong>${r.name}</strong>

<div>⭐ ${r.rating}/5</div>

<p>${r.review}</p>

</div>

`;

});

}


/* ================= FAQ ================= */

async function loadFAQ(){

const {data}=await supabase
.from("product_faq")
.select("*")
.eq("product_id",productId);

faqList.innerHTML="";

(data||[]).forEach(f=>{

faqList.innerHTML+=`

<div class="faq-item">

<h4>${f.question}</h4>

<p>${f.answer}</p>

</div>

`;

});

}


/* ================= CART ================= */

addToCartBtn.onclick=()=>{

if(!currentVariant)
return alert("Select variant");

const cart=JSON.parse(localStorage.getItem("cart")||"[]");

cart.push({

product_id:productId,
variant_id:currentVariant.id,
size:selectedSize,
name:productName.textContent,
price:Number(productPrice.textContent.replace("$","")),
qty:1

});

localStorage.setItem("cart",JSON.stringify(cart));

alert("Added to cart");

};


/* ================= COLOR MAP ================= */

function mapColor(c){

return{

black:"#000",
brown:"#8B4513",
gold:"#d4af37",
silver:"#c0c0c0",
red:"#8b0000"

}[c?.toLowerCase()]||"#ccc";

          }

async function loadDescription() {
  const { data } = await supabase
    .from("products")
    .select("seo_description")
    .eq("slug","royal-sandalwood-watch")
    .single();

  document.getElementById("seoDescription").innerHTML = data.seo_description;
}

loadDescription();

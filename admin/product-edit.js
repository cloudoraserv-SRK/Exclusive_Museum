import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {

const id = new URLSearchParams(location.search).get("id");
if(!id) location.href="products.html";

/* ELEMENTS */

const name=document.getElementById("name");
const slug=document.getElementById("slug");
const mrp=document.getElementById("mrp");
const price=document.getElementById("price");
const shortDesc=document.getElementById("shortDesc");
const longDesc=document.getElementById("longDesc");
const active=document.getElementById("active");

const brand=document.getElementById("brand");
const category=document.getElementById("category");

const caseSize=document.getElementById("caseSize");
const movement=document.getElementById("movement");
const glass=document.getElementById("glass");
const waterResistance=document.getElementById("waterResistance");
const craftingTime=document.getElementById("craftingTime");

const goldType=document.getElementById("goldType");
const goldWeight=document.getElementById("goldWeight");
const diamondCarat=document.getElementById("diamondCarat");
const diamondCount=document.getElementById("diamondCount");
const woodType=document.getElementById("woodType");

const colorSelect=document.getElementById("colorSelect");
const sizeList=document.getElementById("sizeList");

const imageGallery=document.getElementById("imageGallery");

const specList=document.getElementById("specList");
const reviewList=document.getElementById("reviewList");
const faqAdmin=document.getElementById("faqAdmin");

const saveBtn=document.getElementById("saveProduct");

let variants=[];
let currentVariant=null;


/* AUTO SLUG */

name.addEventListener("input",()=>{
slug.value=name.value.toLowerCase().replace(/\s+/g,"-");
});


/* LOAD DROPDOWNS */

async function loadBrands(){

const {data}=await supabase.from("brands").select("id,name");

brand.innerHTML=data.map(b=>
`<option value="${b.id}">${b.name}</option>`
).join("");

}

async function loadCategories(){

const {data}=await supabase.from("categories").select("id,name");

category.innerHTML=data.map(c=>
`<option value="${c.id}">${c.name}</option>`
).join("");

}


/* LOAD PRODUCT */

async function loadProduct(){

const {data}=await supabase
.from("products")
.select("*")
.eq("id",id)
.single();

if(!data) return;

name.value=data.name||"";
slug.value=data.slug||"";
mrp.value=data.mrp||"";
price.value=data.price||"";
shortDesc.value=data.short_description||"";
longDesc.value=data.long_description||"";

caseSize.value=data.case_size||"";
movement.value=data.movement||"";
glass.value=data.glass||"";
waterResistance.value=data.water_resistance||"";
craftingTime.value=data.crafting_time||"";

active.checked=data.active;

brand.value=data.brand_id;
category.value=data.category_id;

await loadMaterials();
await loadVariants();
await loadSpecs();
await loadReviews();
await loadFAQ();

}


/* MATERIALS */

async function loadMaterials(){

let {data}=await supabase
.from("product_materials")
.select("*")
.eq("product_id",id)
.maybeSingle();

if(!data){

await supabase
.from("product_materials")
.insert({product_id:id});

data={};

}

goldType.value=data.gold_type || "";
goldWeight.value=data.gold_weight || "";
diamondCarat.value=data.diamond_carat || "";
diamondCount.value=data.diamond_count || "";
woodType.value=data.wood_type || "";

}


/* VARIANTS */

async function loadVariants(){

const {data}=await supabase
.from("variants")
.select(`
id,
color,
image_gallery,
variant_stock(size,stock)
`)
.eq("product_id",id);

variants=data||[];

colorSelect.innerHTML=variants.map(v=>
`<option value="${v.id}">${v.color}</option>`
).join("");

selectVariant();

}

function selectVariant(){

currentVariant=variants.find(v=>v.id==colorSelect.value);

renderImages();
renderSizes();

}

colorSelect.onchange=selectVariant;


/* IMAGES */

function renderImages(){

imageGallery.innerHTML="";

(currentVariant?.image_gallery||[]).forEach((path,i)=>{

const {data}=supabase.storage
.from("product-images")
.getPublicUrl(path);

imageGallery.innerHTML+=`
<div class="img-box">
<img src="${data.publicUrl}">
<button data-i="${i}" class="remove-img">✕</button>
</div>
`;

});

document.querySelectorAll(".remove-img").forEach(btn=>{
btn.onclick=()=>removeImage(btn.dataset.i);
});

}

async function removeImage(i){

const path=currentVariant.image_gallery[i];

await supabase.storage
.from("product-images")
.remove([path]);

currentVariant.image_gallery.splice(i,1);

await supabase
.from("variants")
.update({image_gallery:currentVariant.image_gallery})
.eq("id",currentVariant.id);

renderImages();

}

const imageInput = document.getElementById("images");

imageInput.addEventListener("change", uploadImages);

async function uploadImages(e){

if(!currentVariant) return;

const files=[...e.target.files];

for(const file of files){

const path=`${id}/${Date.now()}_${file.name}`;

await supabase.storage
.from("product-images")
.upload(path,file);

currentVariant.image_gallery=currentVariant.image_gallery||[];
currentVariant.image_gallery.push(path);

}

await supabase
.from("variants")
.update({
image_gallery:currentVariant.image_gallery
})
.eq("id",currentVariant.id);

renderImages();

}
/* SIZES */

function renderSizes(){

sizeList.innerHTML="";

(currentVariant?.variant_stock||[]).forEach(s=>{
sizeList.innerHTML+=`<div>Size ${s.size} | Stock ${s.stock}</div>`;
});

}


/* SPECS */

async function loadSpecs(){

const {data}=await supabase
.from("product_specs")
.select("*")
.eq("product_id",id);

specList.innerHTML="";

(data||[]).forEach(s=>{

specList.innerHTML+=`

<div class="spec-row">

<input class="spec-name" value="${s.spec_name}">
<input class="spec-value" value="${s.spec_value}">

</div>

`;

});

}

document.getElementById("addSpec").onclick=()=>{

specList.innerHTML+=`

<div class="spec-row">

<input class="spec-name" placeholder="Spec name">
<input class="spec-value" placeholder="Value">

</div>

`;

};


/* REVIEWS */

async function loadReviews(){

const {data}=await supabase
.from("product_reviews")
.select("*")
.eq("product_id",id);

reviewList.innerHTML="";

(data||[]).forEach(r=>{

reviewList.innerHTML+=`

<div class="review-row">

<input class="review-name" value="${r.name}">
<input class="review-rating" value="${r.rating}">
<textarea class="review-text">${r.review}</textarea>

</div>

`;

});

}

document.getElementById("addReview").onclick=()=>{

reviewList.innerHTML+=`

<div class="review-row">

<input class="review-name" placeholder="Customer name">
<input class="review-rating" placeholder="Rating (1-5)">
<textarea class="review-text" placeholder="Review"></textarea>

</div>

`;

};


/* FAQ */

async function loadFAQ(){

const {data}=await supabase
.from("product_faq")
.select("*")
.eq("product_id",id);

faqAdmin.innerHTML="";

(data||[]).forEach(f=>{

faqAdmin.innerHTML+=`

<div class="faq-row">

<input class="faq-q" value="${f.question}">
<textarea class="faq-a">${f.answer}</textarea>

</div>

`;

});

}

document.getElementById("addFaq").onclick=()=>{

faqAdmin.innerHTML+=`

<div class="faq-row">

<input class="faq-q" placeholder="Question">
<textarea class="faq-a" placeholder="Answer"></textarea>

</div>

`;

};


/* SAVE */

saveBtn.onclick=async()=>{

/* PRODUCT */

await supabase
.from("products")
.update({
name:name.value,
slug:slug.value,
mrp:mrp.value||null,
price:price.value||null,
short_description:shortDesc.value,
long_description:longDesc.value,
brand_id:brand.value,
category_id:category.value,
case_size:caseSize.value,
movement:movement.value,
glass:glass.value,
water_resistance:waterResistance.value,
crafting_time:craftingTime.value,
active:active.checked
})
.eq("id",id);


/* MATERIALS */

await supabase
.from("product_materials")
.upsert({
product_id:id,
gold_type:goldType.value,
gold_weight:goldWeight.value,
diamond_carat:diamondCarat.value,
diamond_count:diamondCount.value,
wood_type:woodType.value
},{
onConflict:"product_id"
});


/* SPECS */

await supabase
.from("product_specs")
.delete()
.eq("product_id",id);

const specRows=[...document.querySelectorAll(".spec-row")];

for(const row of specRows){

const n=row.querySelector(".spec-name").value;
const v=row.querySelector(".spec-value").value;

if(!n||!v) continue;

await supabase
.from("product_specs")
.insert({
product_id:id,
spec_name:n,
spec_value:v
});

}


/* CUSTOMIZATION */

await supabase
.from("product_customization")
.delete()
.eq("product_id",id);

const options=[...document.querySelectorAll(".customOpt:checked")]
.map(o=>o.value);

for(const opt of options){

await supabase
.from("product_customization")
.insert({
product_id:id,
custom_option:opt
});

}


/* REVIEWS */

await supabase
.from("product_reviews")
.delete()
.eq("product_id",id);

const reviews=[...document.querySelectorAll(".review-row")];

for(const r of reviews){

const name=r.querySelector(".review-name").value;
const rating=r.querySelector(".review-rating").value;
const review=r.querySelector(".review-text").value;

if(!name||!review) continue;

await supabase
.from("product_reviews")
.insert({
product_id:id,
name:name,
rating:rating,
review:review
});

}


/* FAQ */

await supabase
.from("product_faq")
.delete()
.eq("product_id",id);

const faqs=[...document.querySelectorAll(".faq-row")];

for(const f of faqs){

const q=f.querySelector(".faq-q").value;
const a=f.querySelector(".faq-a").value;

if(!q||!a) continue;

await supabase
.from("product_faq")
.insert({
product_id:id,
question:q,
answer:a
});

}

alert("Product updated");

};


/* INIT */

await loadBrands();
await loadCategories();
await loadProduct();

});



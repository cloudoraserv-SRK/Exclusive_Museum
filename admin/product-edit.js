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

const imageInput=document.getElementById("images");
const imageGallery=document.getElementById("imageGallery");

const specList=document.getElementById("specList");

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

brand.innerHTML=data.map(b=>`
<option value="${b.id}">${b.name}</option>
`).join("");

}

async function loadCategories(){

const {data}=await supabase.from("categories").select("id,name");

category.innerHTML=data.map(c=>`
<option value="${c.id}">${c.name}</option>
`).join("");

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

}

/* MATERIALS */

async function loadMaterials(){

let {data,error}=await supabase
.from("product_materials")
.select("*")
.eq("product_id",id)
.maybeSingle();

if(!data){

/* AUTO CREATE ROW */

await supabase
.from("product_materials")
.insert({
product_id:id
});

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

/* SIZES */

function renderSizes(){

sizeList.innerHTML="";

(currentVariant.variant_stock||[]).forEach(s=>{
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
</div>`;
});

}

document.getElementById("addSpec").onclick=()=>{
specList.innerHTML+=`
<div class="spec-row">
<input class="spec-name" placeholder="Spec name">
<input class="spec-value" placeholder="Value">
</div>`;
};

/* SAVE */

saveBtn.onclick=async()=>{

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
});

/* SPECS */

await supabase
.from("product_specs")
.delete()
.eq("product_id",id);

document.querySelectorAll(".spec-row").forEach(async row=>{

const n=row.querySelector(".spec-name").value;
const v=row.querySelector(".spec-value").value;

if(!n||!v) return;

await supabase
.from("product_specs")
.insert({
product_id:id,
spec_name:n,
spec_value:v
});

});

alert("Product updated");

};

/* INIT */

await loadBrands();
await loadCategories();
await loadProduct();

});


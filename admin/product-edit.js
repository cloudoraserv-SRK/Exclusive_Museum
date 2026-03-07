import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", async () => {

const id = new URLSearchParams(location.search).get("id");
if(!id) location.href="products.html";

/* elements */

const name=document.getElementById("name");
const slug=document.getElementById("slug");
const mrp=document.getElementById("mrp");
const price=document.getElementById("price");
const shortDesc=document.getElementById("shortDesc");
const longDesc=document.getElementById("longDesc");
const active=document.getElementById("active");

const brand=document.getElementById("brand");
const category=document.getElementById("category");

const colorSelect=document.getElementById("colorSelect");
const sizeList=document.getElementById("sizeList");

const imageInput=document.getElementById("images");
const dropZone=document.getElementById("dropZone");
const imageGallery=document.getElementById("imageGallery");

const specList=document.getElementById("specList");

const goldType=document.getElementById("goldType");
const goldWeight=document.getElementById("goldWeight");
const diamondCarat=document.getElementById("diamondCarat");
const diamondCount=document.getElementById("diamondCount");
const woodType=document.getElementById("woodType");

const saveBtn=document.getElementById("saveProduct");

let variants=[];
let currentVariant=null;

/* slug auto */

name.addEventListener("input",()=>{

slug.value=name.value
.toLowerCase()
.trim()
.replace(/[^\w\s-]/g,"")
.replace(/\s+/g,"-");

});

/* load product */

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
active.checked=!!data.active;

brand.value=data.brand_id || "";
category.value=data.category_id || "";

await loadMaterials();
await loadVariants();
await loadSpecs();

}

/* load materials */

async function loadMaterials(){

const {data}=await supabase
.from("product_materials")
.select("*")
.eq("product_id",id)
.single();

if(!data) return;

goldType.value=data.gold_type||"";
goldWeight.value=data.gold_weight||"";
diamondCarat.value=data.diamond_carat||"";
diamondCount.value=data.diamond_count||"";
woodType.value=data.wood_type||"";

}

/* variants */

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

if(!variants.length){
colorSelect.innerHTML=`<option>No variants</option>`;
return;
}

colorSelect.innerHTML=variants.map(v=>
`<option value="${v.id}">${v.color||"Default"}</option>`
).join("");

selectVariant();

}

function selectVariant(){

const vid=colorSelect.value;

currentVariant=variants.find(v=>v.id==vid);

renderImages();
renderSizes();

}

colorSelect.onchange=selectVariant;

/* render images */

function renderImages(){

imageGallery.innerHTML="";

if(!currentVariant?.image_gallery) return;

currentVariant.image_gallery.forEach((path,i)=>{

const {data}=supabase.storage
.from("product-images")
.getPublicUrl(path);

const url=data.publicUrl;

imageGallery.innerHTML+=`
<div class="img-box" data-i="${i}">
<img src="${url}">
<button class="remove-img" data-i="${i}">✕</button>
</div>
`;

});

document.querySelectorAll(".remove-img").forEach(btn=>{
btn.onclick=()=>removeImage(btn.dataset.i);
});

}

/* delete image */

async function removeImage(i){

const path=currentVariant.image_gallery[i];

await supabase.storage
.from("product-images")
.remove([path]);

const gallery=currentVariant.image_gallery.filter((_,idx)=>idx!=i);

await updateGallery(gallery);

}

/* update gallery */

async function updateGallery(gallery){

await supabase
.from("variants")
.update({image_gallery:gallery})
.eq("id",currentVariant.id);

currentVariant.image_gallery=gallery;

renderImages();

}

/* sizes */

function renderSizes(){

sizeList.innerHTML="";

(currentVariant.variant_stock||[]).forEach(s=>{
sizeList.innerHTML+=`<div>Size ${s.size} | Stock ${s.stock}</div>`;
});

}

/* specs */

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

/* save product */

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
brand_id:brand.value||null,
category_id:category.value||null,
active:active.checked
})
.eq("id",id);

/* materials */

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

/* specs save */

await supabase
.from("product_specs")
.delete()
.eq("product_id",id);

const specs=[...document.querySelectorAll(".spec-row")];

for(const row of specs){

const name=row.querySelector(".spec-name").value;
const value=row.querySelector(".spec-value").value;

if(!name || !value) continue;

await supabase
.from("product_specs")
.insert({
product_id:id,
spec_name:name,
spec_value:value
});

}

alert("Product updated");

};

loadProduct();

});

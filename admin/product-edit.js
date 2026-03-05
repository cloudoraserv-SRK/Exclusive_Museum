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

/* image optimizer */

async function optimizeImage(file){

const img=await createImageBitmap(file);

const canvas=document.createElement("canvas");

const max=1600;

const scale=Math.min(max/img.width,max/img.height,1);

canvas.width=img.width*scale;
canvas.height=img.height*scale;

const ctx=canvas.getContext("2d");

ctx.drawImage(img,0,0,canvas.width,canvas.height);

return new Promise(res=>canvas.toBlob(blob=>res(blob),"image/webp",0.85));

}

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

await loadVariants();
await loadSpecs();

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

colorSelect.innerHTML=variants.map((v,i)=>
`<option value="${i}">${v.color||"Default"}</option>`
).join("");

selectVariant();

}

function selectVariant(){

currentVariant=variants[colorSelect.value];

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
.getPublicUrl(path,{
transform:{width:300,quality:80}
});

const url=data.publicUrl;

const hero=i===0 ? "hero-img" : "";

imageGallery.innerHTML+=`
<div class="img-box ${hero}" draggable="true" data-i="${i}">
<img src="${url}">
<button class="remove-img" data-i="${i}">✕</button>
</div>
`;

});

initDrag();

document.querySelectorAll(".remove-img").forEach(btn=>{
btn.onclick=()=>removeImage(btn.dataset.i);
});

}

/* upload images */

async function uploadImages(files){

if(!currentVariant) return alert("Select variant");

let gallery=[...(currentVariant.image_gallery||[])];

for(const file of files){

const optimized=await optimizeImage(file);

const clean=file.name
.replace(/\.[^/.]+$/,"")
.replace(/[^a-z0-9]/gi,"-")
.toLowerCase();

const path=`${slug.value}/${Date.now()}-${clean}.webp`;

const {error}=await supabase.storage
.from("product-images")
.upload(path,optimized,{
contentType:"image/webp",
upsert:true
});

if(error){
console.error(error);
continue;
}

gallery.push(path);

}

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

/* drag reorder */

function initDrag(){

let dragIndex;

document.querySelectorAll(".img-box").forEach(box=>{

box.ondragstart=e=>{
dragIndex=box.dataset.i;
};

box.ondragover=e=>e.preventDefault();

box.ondrop=e=>{

const dropIndex=box.dataset.i;

const gallery=[...currentVariant.image_gallery];

const dragged=gallery.splice(dragIndex,1)[0];

gallery.splice(dropIndex,0,dragged);

updateGallery(gallery);

};

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

/* drag drop */

dropZone.ondragover=e=>{
e.preventDefault();
dropZone.classList.add("drag");
};

dropZone.ondragleave=()=>{
dropZone.classList.remove("drag");
};

dropZone.ondrop=e=>{
e.preventDefault();
dropZone.classList.remove("drag");

uploadImages([...e.dataTransfer.files]);

};

imageInput.onchange=e=>{
uploadImages([...e.target.files]);
};

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
<input value="${s.spec_name}">
<input value="${s.spec_value}">
</div>
`;

});

}

document.getElementById("addSpec").onclick=()=>{

specList.innerHTML+=`
<div class="spec-row">
<input placeholder="Spec name">
<input placeholder="Value">
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

/* customization */

const options=[...document.querySelectorAll(".customOpt:checked")]
.map(o=>o.value);

await supabase
.from("product_customization")
.delete()
.eq("product_id",id);

for(const opt of options){

await supabase
.from("product_customization")
.insert({
product_id:id,
option_name:opt
});

}

alert("Product updated");

};

loadProduct();

});
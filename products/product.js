import { supabase } from "../admin/supabaseClient.js";

const slug = new URLSearchParams(location.search).get("slug");

const productName=document.getElementById("productName");
const productDesc=document.getElementById("productDesc");
const productPrice=document.getElementById("productPrice");
const productMrp=document.getElementById("productMrp");
const productBrand=document.getElementById("productBrand");
const longDesc=document.getElementById("longDesc");

const galleryMain=document.getElementById("galleryMain");
const thumbs=document.getElementById("thumbs");

const colorsEl=document.getElementById("colors");
const sizesEl=document.getElementById("sizes");

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

await loadVariants();

}

loadProduct();

/* ================= VARIANTS ================= */

async function loadVariants(){

const {data}=await supabase
.from("variants")
.select(`
id,
color,
image_gallery,
variant_stock(size,stock)
`)
.eq("product_id",productId);

variants=data||[];

renderColors();

setVariant(variants[0]);

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
.getPublicUrl(path,{transform:{width:1200}});

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

stock.forEach(s=>{

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

/* COLOR MAP */

function mapColor(c){

return{

black:"#000",
brown:"#8B4513",
gold:"#d4af37",
silver:"#c0c0c0",
red:"#8b0000"

}[c?.toLowerCase()]||"#ccc";

}
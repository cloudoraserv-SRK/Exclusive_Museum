import { supabase } from "./supabaseClient.js";
import { requireAdminSession } from "./auth-guard.js";

await requireAdminSession();

const table=document.getElementById("ordersTable");

async function loadOrders(){

const {data}=await supabase
.from("orders")
.select("*")
.order("created_at",{ascending:false});

table.innerHTML="";

data.forEach(o=>{

const tr=document.createElement("tr");

tr.innerHTML=`

<td>${o.order_id}</td>

<td>${o.customer_name}</td>

<td>${o.email}</td>

<td>$${o.total_amount}</td>

<td>${o.payment_method}</td>

<td>

<select class="status-select" data-id="${o.id}">

<option ${o.order_status=="payment_in_progress"?"selected":""}>
payment_in_progress
</option>

<option ${o.order_status=="payment_verified"?"selected":""}>
payment_verified
</option>

<option ${o.order_status=="processing"?"selected":""}>
processing
</option>

<option ${o.order_status=="shipped"?"selected":""}>
shipped
</option>

<option ${o.order_status=="delivered"?"selected":""}>
delivered
</option>

</select>

</td>

<td>

<button class="update-btn" data-id="${o.id}">
Update
</button>

</td>

`;

table.appendChild(tr);

});

}

/* UPDATE STATUS */

document.addEventListener("click",async(e)=>{

if(e.target.classList.contains("update-btn")){

const id=e.target.dataset.id;

const status=document.querySelector(
`select[data-id="${id}"]`
).value;

await supabase
.from("orders")
.update({
order_status:status,
status
})
.eq("id",id);

alert("Status updated");

}

});

loadOrders();

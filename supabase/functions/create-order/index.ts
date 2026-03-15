import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function formatPaymentStatus(method: string, reference: string) {
  if (method === "gift" && reference) return "pending_review";
  if (reference) return "pending_review";
  return "pending";
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = request.headers.get("Authorization") || "";
    const client = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    });

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const { data: userData, error: userError } = await client.auth.getUser(token);
    const user = userData?.user;

    if (userError || !user?.email) {
      return jsonResponse({ error: "Invalid session" }, 401);
    }

    const payload = await request.json();
    const customerName = String(payload.customer_name || "").trim();
    const phone = String(payload.phone || "").trim();
    const address = String(payload.address || "").trim();
    const city = String(payload.city || "").trim();
    const zip = String(payload.zip || "").trim();
    const paymentMethod = String(payload.payment_method || "").trim();
    const paymentReference = String(payload.payment_reference || "").trim();
    const cartItems = Array.isArray(payload.items) ? payload.items : [];
    const orderCode = `EM-${Date.now()}`;

    if (!customerName || !phone || !address || !paymentMethod || !cartItems.length) {
      return jsonResponse({ error: "Missing required checkout data" }, 400);
    }

    const productIds = [...new Set(cartItems.map(item => item.product_id).filter(Boolean))];
    if (!productIds.length) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }

    const { data: products, error: productError } = await client
      .from("products")
      .select("id,name,price,active")
      .in("id", productIds);

    if (productError) {
      return jsonResponse({ error: "Unable to validate products" }, 400);
    }

    const productMap = new Map((products || []).map(product => [product.id, product]));
    const validatedItems = cartItems
      .map(item => {
        const product = productMap.get(item.product_id);
        if (!product || !product.active) return null;

        return {
          product_id: product.id,
          product_name: product.name,
          price: Number(product.price || 0),
          qty: Math.max(1, Number(item.qty) || 1),
          quantity: Math.max(1, Number(item.qty) || 1),
          size: item.size || null
        };
      })
      .filter(Boolean);

    if (!validatedItems.length) {
      return jsonResponse({ error: "No valid cart items found" }, 400);
    }

    const totalAmount = validatedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const paymentStatus = formatPaymentStatus(paymentMethod, paymentReference);

    const { data: createdOrder, error: orderError } = await client
      .from("orders")
      .insert({
        order_id: orderCode,
        customer_name: customerName,
        email: user.email,
        user_email: user.email,
        phone,
        address,
        city,
        zip,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        currency: "USD",
        status: "payment_in_progress",
        payment_status: paymentStatus,
        order_status: "payment_in_progress",
        total_amount: totalAmount
      })
      .select("id,order_id")
      .single();

    if (orderError || !createdOrder) {
      return jsonResponse({ error: "Unable to create order" }, 400);
    }

    const { error: itemsError } = await client
      .from("order_items")
      .insert(validatedItems.map(item => ({
        order_id: createdOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size,
        price: item.price,
        qty: item.qty,
        quantity: item.quantity
      })));

    if (itemsError) {
      await client.from("orders").delete().eq("id", createdOrder.id);
      return jsonResponse({ error: "Unable to save order items" }, 400);
    }

    return jsonResponse({
      success: true,
      order_id: createdOrder.order_id,
      phone
    });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unexpected checkout error"
    }, 500);
  }
});

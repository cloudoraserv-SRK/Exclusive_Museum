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

Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = await request.json();
    const orderId = String(payload.order_id || "").trim();
    const phone = String(payload.phone || "").trim();

    if (!orderId || !phone) {
      return jsonResponse({ error: "Order ID and phone are required" }, 400);
    }

    const client = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await client
      .from("orders")
      .select("order_id,customer_name,total_amount,order_status,payment_status,created_at")
      .eq("order_id", orderId)
      .eq("phone", phone)
      .single();

    if (error || !data) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    return jsonResponse({ success: true, order: data });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unexpected tracking error"
    }, 500);
  }
});

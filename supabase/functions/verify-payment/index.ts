import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const adminEmail = "admin@exclusivemuseum.com";

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
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: userData, error: userError } = await client.auth.getUser(token);
    const user = userData?.user;

    if (userError || !user || user.email?.toLowerCase() !== adminEmail) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const payload = await request.json();
    const orderId = String(payload.order_id || "").trim();
    const paymentStatus = String(payload.payment_status || "").trim();
    const orderStatus = String(payload.order_status || "").trim();
    const paymentReference = String(payload.payment_reference || "").trim();

    if (!orderId || !paymentStatus || !orderStatus) {
      return jsonResponse({ error: "Missing payment verification data" }, 400);
    }

    const { error } = await client
      .from("orders")
      .update({
        payment_status: paymentStatus,
        order_status: orderStatus,
        status: orderStatus,
        payment_reference: paymentReference || null
      })
      .eq("id", orderId);

    if (error) {
      return jsonResponse({ error: "Unable to update payment state" }, 400);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unexpected verification error"
    }, 500);
  }
});

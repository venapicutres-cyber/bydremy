import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Konfigurasi ${name} belum tersedia.`);
  return value;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method tidak diizinkan.' }, 405);

  try {
    const body = await request.json();
    const templateId = Number(body.templateId);
    const checkoutKey = String(body.checkoutKey || '');
    if (!Number.isSafeInteger(templateId) || !checkoutKey) return json({ error: 'Data checkout tidak valid.' }, 400);

    const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: orderRows, error: orderError } = await supabase.rpc('create_checkout_order', {
      p_template_id: templateId,
      p_customer_name: String(body.customerName || ''),
      p_email: String(body.email || ''),
      p_phone: String(body.phone || ''),
      p_checkout_key: checkoutKey,
    });
    if (orderError || !orderRows?.[0]) return json({ error: orderError?.message || 'Pesanan tidak dapat dibuat.' }, 400);

    const order = orderRows[0];
    return json({ orderId: order.order_id, token: order.checkout_token });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Checkout tidak dapat diproses.' }, 500);
  }
});

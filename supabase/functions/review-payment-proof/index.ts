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
    const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') || '';
    const { data: caller, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller.user || caller.user.app_metadata?.role !== 'admin') {
      return json({ error: 'Hanya admin yang dapat memeriksa pembayaran.' }, 403);
    }

    const body = await request.json();
    const orderId = String(body.orderId || '');
    const action = String(body.action || '');
    if (!orderId) return json({ error: 'ID pesanan tidak valid.' }, 400);
    if (action !== 'activate' && action !== 'hold') return json({ error: 'Keputusan tidak dikenal.' }, 400);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, email, customer_name, auth_user_id, invitation_id, payment_status, proof_path, activated_at')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError || !order) return json({ error: 'Pesanan tidak ditemukan.' }, 404);
    if (order.activated_at) return json({ activated: true, invitation_id: order.invitation_id });
    if (!order.proof_path) return json({ error: 'Pelanggan belum mengunggah bukti transfer.' }, 400);
    if (order.payment_status !== 'pending') return json({ error: 'Bukti transfer sedang tidak menunggu pemeriksaan.' }, 400);

    if (action === 'hold') {
      // Dana belum masuk: biarkan akun tidak aktif dan minta pelanggan mengirim bukti baru.
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'unpaid' })
        .eq('id', orderId);
      if (error) throw error;
      return json({ activated: false });
    }

    let authUserId = order.auth_user_id as string | null;
    if (!authUserId) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: order.email,
        email_confirm: true,
        user_metadata: { full_name: order.customer_name },
      });
      if (created?.user) authUserId = created.user.id;
      else {
        const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = users?.users.find((user) => user.email === order.email);
        if (!existing) throw new Error(createError?.message || 'Akun pelanggan tidak dapat dibuat.');
        authUserId = existing.id;
      }
    }

    const { error: statusError } = await supabase
      .from('orders')
      .update({ payment_status: 'settlement' })
      .eq('id', orderId);
    if (statusError) throw statusError;

    const { data: invitationId, error: activationError } = await supabase.rpc('activate_paid_order', {
      p_order_id: orderId,
      p_auth_user_id: authUserId,
    });
    if (activationError || !invitationId) throw new Error(activationError?.message || 'Undangan tidak dapat diaktifkan.');

    const { error: metadataError } = await supabase.auth.admin.updateUserById(authUserId, {
      app_metadata: { role: 'editor', page_id: invitationId },
      user_metadata: { full_name: order.customer_name },
    });
    if (metadataError) throw metadataError;

    // Aktivasi sudah tersimpan. Kegagalan pengiriman email (mis. rate limit)
    // tidak boleh membuat admin mengira pesanan gagal diaktifkan.
    let emailSent = true;
    try {
      const siteUrl = requireEnv('SITE_URL').replace(/\/$/, '');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(order.email, {
        redirectTo: `${siteUrl}/admin/activate`,
      });
      if (resetError) throw resetError;
    } catch (emailError) {
      console.error('Gagal mengirim email aktivasi:', emailError);
      emailSent = false;
    }

    return json({ activated: true, invitation_id: invitationId, email_sent: emailSent });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Pemeriksaan pembayaran gagal.' }, 500);
  }
});

-- Checkout transfer manual tidak boleh membuat pesanan dengan status
-- "bukti menunggu pemeriksaan" sebelum bukti diunggah. Status awal dan
-- provider ditetapkan langsung oleh RPC agar tidak bergantung pada update
-- lanjutan di Edge Function.

create or replace function public.create_checkout_order(
  p_template_id bigint,
  p_customer_name text,
  p_email text,
  p_phone text,
  p_checkout_key uuid
)
returns table (
  order_id text,
  checkout_token text,
  customer_name text,
  email text,
  phone text,
  template_name text,
  total bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.pages;
  v_order public.orders;
  v_name text := btrim(coalesce(p_customer_name, ''));
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_phone text := btrim(coalesce(p_phone, ''));
begin
  if p_checkout_key is null then
    raise exception 'Checkout key tidak valid.' using errcode = '22023';
  end if;
  if char_length(v_name) not between 2 and 100 then
    raise exception 'Nama harus 2-100 karakter.' using errcode = '22023';
  end if;
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Email tidak valid.' using errcode = '22023';
  end if;
  if char_length(v_phone) not between 8 and 30 then
    raise exception 'Nomor WhatsApp tidak valid.' using errcode = '22023';
  end if;

  select * into v_order from public.orders where checkout_key = p_checkout_key;
  if found then
    return query
      select v_order.id, v_order.checkout_token, v_order.customer_name, v_order.email, v_order.phone,
             coalesce((select template_name from public.pages where id = v_order.template_id), ''), v_order.total;
    return;
  end if;

  select * into v_template
  from public.pages
  where id = p_template_id and kind = 'template' and status = 'published';
  if not found or coalesce(v_template.price, 0) <= 0 then
    raise exception 'Template tidak tersedia untuk checkout.' using errcode = '22023';
  end if;

  insert into public.orders (
    id, checkout_key, checkout_token, customer_name, email, phone, template_id, package_name,
    status, payment_status, payment_provider, total, paid, date, notes
  ) values (
    'ORD-' || upper(substr(md5(clock_timestamp()::text || random()::text), 1, 12)),
    p_checkout_key,
    md5(clock_timestamp()::text || random()::text || p_checkout_key::text),
    v_name, v_email, v_phone, v_template.id, coalesce(v_template.template_name, v_template.label),
    'pending', 'unpaid', 'manual_transfer', v_template.price, 0, current_date, 'Checkout mandiri'
  ) returning * into v_order;

  return query select v_order.id, v_order.checkout_token, v_order.customer_name, v_order.email, v_order.phone,
    coalesce(v_template.template_name, v_template.label), v_order.total;
end;
$$;

revoke all on function public.create_checkout_order(bigint, text, text, text, uuid) from public;
grant execute on function public.create_checkout_order(bigint, text, text, text, uuid) to anon, authenticated;

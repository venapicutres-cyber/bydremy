-- Undangan hasil checkout harus memakai namespace /u/ agar dikenali editor undangan
-- (lihat INVITATION_PREFIX di src/utils/invitations.ts). Perbaiki data lama dan
-- fungsi aktivasi agar pesanan berikutnya tidak membuat route yang salah.

update public.pages p
set route = '/u/' || p.slug
from public.orders o
where o.invitation_id = p.id
  and p.slug like 'undangan-%'
  and p.route = '/' || p.slug;

create or replace function public.activate_paid_order(p_order_id text, p_auth_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_template public.pages;
  v_page_id bigint;
  v_slug text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan.' using errcode = '23503';
  end if;
  if v_order.payment_status <> 'settlement' then
    raise exception 'Pembayaran belum lunas.' using errcode = '42501';
  end if;
  if v_order.invitation_id is not null then
    return v_order.invitation_id;
  end if;

  select * into v_template from public.pages where id = v_order.template_id and kind = 'template';
  if not found then
    raise exception 'Template pesanan tidak ditemukan.' using errcode = '23503';
  end if;

  v_slug := 'undangan-' || lower(replace(v_order.id, 'ORD-', ''));
  insert into public.pages (
    slug, route, label, title, description, category, sort_order, template_name, file, css, thumb,
    status, kind, price, price_compare, content_html, hidden_section_ids, text_overrides,
    image_overrides, link_overrides, extra_html, views
  ) values (
    v_slug, '/u/' || v_slug, v_order.customer_name, v_order.customer_name || ' · Wedding Invitation',
    v_template.description, v_template.category, 0, v_template.template_name, v_template.file,
    v_template.css, v_template.thumb, 'draft', 'page', null, null, v_template.content_html,
    v_template.hidden_section_ids, v_template.text_overrides, v_template.image_overrides,
    v_template.link_overrides, v_template.extra_html, 0
  ) returning id into v_page_id;

  update public.orders
  set invitation_id = v_page_id,
      auth_user_id = coalesce(p_auth_user_id, auth_user_id),
      activated_at = now(),
      status = 'in_progress',
      paid = total,
      paid_at = current_date
  where id = p_order_id;

  return v_page_id;
end;
$$;

revoke all on function public.activate_paid_order(text, uuid) from public;
grant execute on function public.activate_paid_order(text, uuid) to service_role;

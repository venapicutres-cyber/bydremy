-- Layar Sapa ditampilkan di perangkat resepsionis tanpa perlu login. RPC ini
-- sengaja hanya membocorkan nama, ucapan, kategori, dan waktu check-in —
-- token QR serta nomor telepon tidak pernah dikirim ke publik.

create or replace function public.layar_sapa(p_page_id bigint, p_limit integer default 12)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(item order by item->>'checked_in_at' desc),
    '[]'::jsonb
  )
  from (
    select jsonb_build_object(
      'name', e.name,
      'message', e.message,
      'identity_category', c.identity_category,
      'checked_in_at', c.checked_in_at
    ) as item
    from public.guest_checkins c
    join public.guestbook_entries e on e.id = c.entry_id
    where e.page_id = p_page_id
      and c.checked_in_at is not null
    order by c.checked_in_at desc
    limit greatest(1, least(coalesce(p_limit, 12), 30))
  ) latest;
$$;

revoke all on function public.layar_sapa(bigint, integer) from public;
grant execute on function public.layar_sapa(bigint, integer) to anon, authenticated;

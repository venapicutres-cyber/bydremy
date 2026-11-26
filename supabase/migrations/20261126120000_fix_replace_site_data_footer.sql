-- Perbaikan replace_site_data: tipe yang benar adalah public.footer_columns.
-- Tanpa ini, admin gagal menyimpan Pengaturan (termasuk rekening transfer)
-- dengan error: type "public.footer" does not exist.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.replace_site_data(jsonb)'::regprocedure) into v_def;
  if v_def like '%null::public.footer,%' then
    execute replace(v_def, 'null::public.footer,', 'null::public.footer_columns,');
  end if;
end $$;

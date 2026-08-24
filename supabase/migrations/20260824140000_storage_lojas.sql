-- ComandaGO — bucket de Storage para fotos de produto/logo do painel
--
-- Bucket público pra leitura (as fotos aparecem no cardápio público, sem
-- login) e escrita restrita a membro do tenant dono do arquivo. O
-- isolamento por tenant é feito pelo PRIMEIRO segmento do path do arquivo
-- (ex: "{tenant_id}/produtos/xyz.jpg") — é o mesmo padrão de
-- is_tenant_member() já usado nas outras tabelas, aplicado aqui via
-- storage.foldername(name).

insert into storage.buckets (id, name, public)
values ('lojas', 'lojas', true)
on conflict (id) do nothing;

create policy lojas_select_publico
  on storage.objects for select
  to public
  using (bucket_id = 'lojas');

create policy lojas_insert_membros
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lojas'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy lojas_update_membros
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lojas'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'lojas'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

create policy lojas_delete_membros
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lojas'
    and public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

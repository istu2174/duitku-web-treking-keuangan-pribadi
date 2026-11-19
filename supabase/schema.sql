-- Duitku: skema Supabase. Jalankan sekali di Supabase → SQL Editor → New query → Run.

-- Satu baris per akun: seluruh data (transaksi + kategori) dalam satu JSON,
-- bentuknya sama dengan yang disimpan versi browser.
create table if not exists public.duitku_data (
  user_id     uuid primary key default auth.uid() references auth.users on delete cascade,
  data        jsonb not null check (pg_column_size(data) < 5000000),
  updated_at  timestamptz not null default now()
);

alter table public.duitku_data enable row level security;

-- Tiap akun cuma bisa baca & ubah datanya sendiri.
drop policy if exists "baca data sendiri" on public.duitku_data;
create policy "baca data sendiri" on public.duitku_data
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "tambah data sendiri" on public.duitku_data;
create policy "tambah data sendiri" on public.duitku_data
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ubah data sendiri" on public.duitku_data;
create policy "ubah data sendiri" on public.duitku_data
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

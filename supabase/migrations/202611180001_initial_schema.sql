create extension if not exists pgcrypto;

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  url text not null check (url ~* '^https?://'),
  notes text not null default '',
  content_type text not null default 'Website',
  source text,
  preview_image_url text,
  tags text[] not null default '{}',
  style_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nebula_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_filename text,
  alt_text text not null default '',
  notes text not null default '',
  source_url text,
  tags text[] not null default '{}',
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saves_owner_created_idx on public.saves (owner_id, created_at desc);
create index saves_tags_idx on public.saves using gin (tags);
create index saves_style_tags_idx on public.saves using gin (style_tags);
create index nebula_images_owner_created_idx on public.nebula_images (owner_id, created_at desc);
create index nebula_images_tags_idx on public.nebula_images using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger saves_set_updated_at before update on public.saves
for each row execute function public.set_updated_at();

create trigger nebula_images_set_updated_at before update on public.nebula_images
for each row execute function public.set_updated_at();

alter table public.saves enable row level security;
alter table public.nebula_images enable row level security;

create policy "Owners can read their saves" on public.saves
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners can create their saves" on public.saves
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners can update their saves" on public.saves
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners can delete their saves" on public.saves
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "Owners can read their Nebula images" on public.nebula_images
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners can create their Nebula images" on public.nebula_images
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners can update their Nebula images" on public.nebula_images
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners can delete their Nebula images" on public.nebula_images
for delete to authenticated using ((select auth.uid()) = owner_id);

revoke all on public.saves from anon;
revoke all on public.nebula_images from anon;
grant select, insert, update, delete on public.saves to authenticated;
grant select, insert, update, delete on public.nebula_images to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nebula', 'nebula', false, 15728640, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can read their Nebula files" on storage.objects
for select to authenticated
using (bucket_id = 'nebula' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can upload their Nebula files" on storage.objects
for insert to authenticated
with check (bucket_id = 'nebula' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can update their Nebula files" on storage.objects
for update to authenticated
using (bucket_id = 'nebula' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'nebula' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners can delete their Nebula files" on storage.objects
for delete to authenticated
using (bucket_id = 'nebula' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.saves
  add column if not exists metadata_description text,
  add column if not exists metadata_fetched_at timestamptz;

comment on column public.saves.metadata_description is
  'Description fetched from the linked page. Kept separate from owner-authored notes.';

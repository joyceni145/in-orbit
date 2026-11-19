alter table public.saves
  add column external_source text,
  add column external_id text,
  add column imported_at timestamptz,
  add column categories text[] not null default '{}',
  add column portfolio_level text,
  add column is_favorite boolean not null default false;

alter table public.saves
  add constraint saves_external_reference_complete
    check (
      (external_source is null and external_id is null)
      or (external_source is not null and external_id is not null)
    ),
  add constraint saves_external_source_format
    check (external_source is null or external_source ~ '^[a-z][a-z0-9_-]*$'),
  add constraint saves_portfolio_level_valid
    check (portfolio_level is null or portfolio_level in ('Student', 'Junior', 'Mid-Level', 'Senior+'));

create unique index saves_owner_external_reference_idx
  on public.saves (owner_id, external_source, external_id)
  where external_source is not null and external_id is not null;

create index saves_categories_idx on public.saves using gin (categories);

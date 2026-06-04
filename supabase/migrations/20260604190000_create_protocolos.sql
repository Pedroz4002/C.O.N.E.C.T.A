create extension if not exists "pgcrypto";

create table if not exists public.protocolos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  nome text not null,
  email text not null,
  matricula text not null,
  mensagem text not null,
  status text not null default 'Recebido',
  pdf_path text,
  created_at timestamptz not null default now()
);

create index if not exists protocolos_matricula_idx on public.protocolos (matricula);
create index if not exists protocolos_created_at_idx on public.protocolos (created_at desc);

alter table public.protocolos enable row level security;

insert into storage.buckets (id, name, public)
values ('protocolos', 'protocolos', false)
on conflict (id) do nothing;

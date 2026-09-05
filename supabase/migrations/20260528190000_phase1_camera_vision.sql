create extension if not exists "pgcrypto";

create table if not exists public.vision_attempts (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null,
  student_id uuid not null references public.students(id) on delete cascade,
  subject text,
  topic text,
  image_path text not null,
  image_mime_type text not null,
  extracted_text text default '',
  confidence numeric(5,2) not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  structured_steps jsonb not null default '[]'::jsonb,
  summary text default '',
  provider text not null default 'local-fallback',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vision_attempts_student_created_at
  on public.vision_attempts(student_id, created_at desc);

create index if not exists idx_vision_attempts_teacher_created_at
  on public.vision_attempts(teacher_id, created_at desc);

alter table public.vision_attempts enable row level security;

drop policy if exists "vision_attempts_owner_teacher_select" on public.vision_attempts;
create policy "vision_attempts_owner_teacher_select"
on public.vision_attempts
for select
using (
  teacher_id = auth.jwt() ->> 'sub'
  or exists (
    select 1
    from public.students s
    where s.id = vision_attempts.student_id
      and s.teacher_id = auth.jwt() ->> 'sub'
  )
);

drop policy if exists "vision_attempts_owner_insert" on public.vision_attempts;
create policy "vision_attempts_owner_insert"
on public.vision_attempts
for insert
with check (
  teacher_id = auth.jwt() ->> 'sub'
  and exists (
    select 1
    from public.students s
    where s.id = vision_attempts.student_id
      and s.teacher_id = auth.jwt() ->> 'sub'
  )
);

drop policy if exists "vision_attempts_owner_update" on public.vision_attempts;
create policy "vision_attempts_owner_update"
on public.vision_attempts
for update
using (teacher_id = auth.jwt() ->> 'sub')
with check (teacher_id = auth.jwt() ->> 'sub');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vision-captures',
  'vision-captures',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "service_role_manage_vision_bucket" on storage.objects;
create policy "service_role_manage_vision_bucket"
on storage.objects
for all
to service_role
using (bucket_id = 'vision-captures')
with check (bucket_id = 'vision-captures');

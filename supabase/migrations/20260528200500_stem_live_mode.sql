create extension if not exists "pgcrypto";

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null,
  student_id uuid not null references public.students(id) on delete cascade,
  subject text,
  topic text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_live_sessions_teacher_started
  on public.live_sessions(teacher_id, started_at desc);

create table if not exists public.live_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  teacher_id text not null,
  user_utterance text not null,
  assistant_reply text not null,
  vision_context jsonb not null default '{}'::jsonb,
  provider text not null default 'local-fallback',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_turns_session_created
  on public.live_turns(session_id, created_at desc);

alter table public.live_sessions enable row level security;
alter table public.live_turns enable row level security;

drop policy if exists "live_sessions_teacher_select" on public.live_sessions;
create policy "live_sessions_teacher_select"
on public.live_sessions
for select
using (teacher_id = auth.jwt() ->> 'sub');

drop policy if exists "live_sessions_teacher_insert" on public.live_sessions;
create policy "live_sessions_teacher_insert"
on public.live_sessions
for insert
with check (
  teacher_id = auth.jwt() ->> 'sub'
  and exists (
    select 1 from public.students s
    where s.id = live_sessions.student_id
      and s.teacher_id = auth.jwt() ->> 'sub'
  )
);

drop policy if exists "live_sessions_teacher_update" on public.live_sessions;
create policy "live_sessions_teacher_update"
on public.live_sessions
for update
using (teacher_id = auth.jwt() ->> 'sub')
with check (teacher_id = auth.jwt() ->> 'sub');

drop policy if exists "live_turns_teacher_select" on public.live_turns;
create policy "live_turns_teacher_select"
on public.live_turns
for select
using (teacher_id = auth.jwt() ->> 'sub');

drop policy if exists "live_turns_teacher_insert" on public.live_turns;
create policy "live_turns_teacher_insert"
on public.live_turns
for insert
with check (
  teacher_id = auth.jwt() ->> 'sub'
  and exists (
    select 1 from public.live_sessions ls
    where ls.id = live_turns.session_id
      and ls.teacher_id = auth.jwt() ->> 'sub'
  )
);

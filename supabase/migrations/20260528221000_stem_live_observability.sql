create table if not exists public.live_session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  teacher_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_session_events_session_created
  on public.live_session_events(session_id, created_at desc);

alter table public.live_session_events enable row level security;

drop policy if exists "live_session_events_teacher_select" on public.live_session_events;
create policy "live_session_events_teacher_select"
on public.live_session_events
for select
using (teacher_id = auth.jwt() ->> 'sub');

drop policy if exists "live_session_events_teacher_insert" on public.live_session_events;
create policy "live_session_events_teacher_insert"
on public.live_session_events
for insert
with check (
  teacher_id = auth.jwt() ->> 'sub'
  and exists (
    select 1 from public.live_sessions ls
    where ls.id = live_session_events.session_id
      and ls.teacher_id = auth.jwt() ->> 'sub'
  )
);

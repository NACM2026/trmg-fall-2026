-- TRMG Baby Face Game — database setup
-- Run once in Supabase: SQL Editor > New query > paste all > Run
-- Host PIN below controls the game (open/reveal/reset). Change 'TRMG2026' if you want.

-- ---------- Tables ----------
create table if not exists public.game_state (
  id         int primary key default 1 check (id = 1),
  round      int  not null default 0,
  status     text not null default 'idle' check (status in ('idle','open','closed','revealed','final')),
  updated_at timestamptz not null default now()
);
insert into public.game_state (id) values (1) on conflict (id) do nothing;

create table if not exists public.round_answers (
  round  int primary key,
  answer text not null
);

create table if not exists public.votes (
  device_id  text not null,
  team       text not null check (team in ('credit','collections')),
  round      int  not null,
  choice     text not null,
  created_at timestamptz not null default now(),
  primary key (device_id, round)
);

create table if not exists public.host_config (
  id  int primary key default 1 check (id = 1),
  pin text not null
);
insert into public.host_config (id, pin) values (1, 'TRMG2026')
  on conflict (id) do update set pin = excluded.pin;

-- ---------- Security ----------
alter table public.game_state    enable row level security;
alter table public.round_answers enable row level security;
alter table public.votes         enable row level security;
alter table public.host_config   enable row level security;   -- no policies = nobody reads the PIN

drop policy if exists "read state"   on public.game_state;
drop policy if exists "read answers" on public.round_answers;
drop policy if exists "read votes"   on public.votes;
create policy "read state"   on public.game_state    for select to anon, authenticated using (true);
create policy "read answers" on public.round_answers for select to anon, authenticated using (true);
create policy "read votes"   on public.votes         for select to anon, authenticated using (true);
-- No insert/update/delete policies: all writes go through the functions below.

-- ---------- Phone: cast a vote ----------
create or replace function public.cast_vote(p_device text, p_team text, p_round int, p_choice text)
returns text language plpgsql security definer set search_path = public as $$
declare s public.game_state; prior_team text;
begin
  select * into s from public.game_state where id = 1;
  if s.status <> 'open' or s.round <> p_round then return 'closed'; end if;
  if p_team not in ('credit','collections') then return 'bad_team'; end if;
  select team into prior_team from public.votes where device_id = p_device limit 1;
  if prior_team is not null and prior_team <> p_team then return 'team_locked'; end if;
  insert into public.votes (device_id, team, round, choice)
    values (p_device, p_team, p_round, p_choice)
    on conflict (device_id, round) do update set choice = excluded.choice, created_at = now();
  return 'ok';
end $$;

-- ---------- Host: move the game along ----------
create or replace function public.host_control(p_pin text, p_round int, p_status text, p_answer text default null)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.host_config where id = 1 and pin = p_pin) then return 'bad_pin'; end if;
  if p_status = 'revealed' and p_answer is not null then
    insert into public.round_answers (round, answer) values (p_round, p_answer)
      on conflict (round) do update set answer = excluded.answer;
  end if;
  update public.game_state set round = p_round, status = p_status, updated_at = now() where id = 1;
  return 'ok';
end $$;

create or replace function public.host_reset(p_pin text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.host_config where id = 1 and pin = p_pin) then return 'bad_pin'; end if;
  delete from public.votes where true;
  delete from public.round_answers where true;
  update public.game_state set round = 0, status = 'idle', updated_at = now() where id = 1;
  return 'ok';
end $$;

-- ---------- Scores: % of each team's voters correct, per revealed round ----------
create or replace function public.get_scores()
returns table (round int, team text, voters int, correct int, pct numeric)
language sql security definer set search_path = public stable as $$
  select v.round, v.team,
         count(*)::int as voters,
         count(*) filter (where v.choice = a.answer)::int as correct,
         round(100.0 * count(*) filter (where v.choice = a.answer) / count(*), 1) as pct
  from public.votes v
  join public.round_answers a on a.round = v.round
  group by v.round, v.team
  order by v.round, v.team;
$$;

revoke all on function public.cast_vote(text,text,int,text)        from public;
revoke all on function public.host_control(text,int,text,text)     from public;
revoke all on function public.host_reset(text)                     from public;
revoke all on function public.get_scores()                         from public;
grant execute on function public.cast_vote(text,text,int,text)     to anon, authenticated;
grant execute on function public.host_control(text,int,text,text)  to anon, authenticated;
grant execute on function public.host_reset(text)                  to anon, authenticated;
grant execute on function public.get_scores()                      to anon, authenticated;

-- ---------- Realtime (live updates to phones + big screen) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.game_state; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.votes;      exception when duplicate_object then null; end;
end $$;

select 'TRMG Baby Face Game setup complete' as result;

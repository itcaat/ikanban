-- iKanban Leaderboard Schema
-- Run this in Supabase SQL Editor

create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  nickname text not null check (char_length(nickname) between 1 and 30),
  company text check (company is null or char_length(company) <= 50),
  score integer not null check (score >= 0 and score <= 50000),
  survival_time real not null check (survival_time >= 0),
  tasks_completed integer not null check (tasks_completed >= 0),
  max_combo integer not null check (max_combo >= 0),
  role text not null,
  tournament_id text not null,  -- Friday date: '2026-02-13'
  created_at timestamptz default now()
);

-- RLS
alter table leaderboard enable row level security;
create policy "Anyone can read" on leaderboard for select using (true);
create policy "Anyone can insert" on leaderboard for insert with check (true);

-- Indexes
create index idx_leaderboard_score on leaderboard (score desc);
create index idx_leaderboard_tournament on leaderboard (tournament_id, score desc);
create index idx_leaderboard_company on leaderboard (company, score desc);
create index idx_leaderboard_nickname on leaderboard (nickname, tournament_id);

-- ============================================
-- Player stats (games played counter)
-- ============================================

create table player_stats (
  nickname text primary key,
  games_played integer not null default 0,
  updated_at timestamptz default now()
);

alter table player_stats enable row level security;
create policy "Anyone can read stats" on player_stats for select using (true);
create policy "Anyone can insert stats" on player_stats for insert with check (true);
create policy "Anyone can update stats" on player_stats for update using (true);

-- Atomic increment function
create or replace function increment_games(p_nickname text)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  insert into player_stats (nickname, games_played, updated_at)
  values (p_nickname, 1, now())
  on conflict (nickname)
  do update set
    games_played = player_stats.games_played + 1,
    updated_at = now();

  select games_played into new_count
  from player_stats
  where nickname = p_nickname;

  return new_count;
end;
$$;

-- Update nickname constraint: minimum 2 chars
-- alter table leaderboard drop constraint if exists leaderboard_nickname_check;
-- alter table leaderboard add constraint leaderboard_nickname_check check (char_length(nickname) between 2 and 30);

-- ============================================
-- Rate-limited score submission (max 1 per 10s per nickname)
-- ============================================

create or replace function submit_score_safe(
  p_nickname text,
  p_company text,
  p_score integer,
  p_survival_time real,
  p_tasks_completed integer,
  p_max_combo integer,
  p_role text,
  p_tournament_id text
)
returns void
language plpgsql
as $$
declare
  last_submit timestamptz;
begin
  -- Validate nickname length
  if char_length(trim(p_nickname)) < 2 then
    raise exception 'Nickname too short';
  end if;

  -- Rate limit: 1 submission per 10 seconds per nickname
  select created_at into last_submit
  from leaderboard
  where nickname = p_nickname
  order by created_at desc
  limit 1;

  if last_submit is not null and last_submit > now() - interval '1 minute' then
    raise exception 'Too many submissions, wait a few seconds';
  end if;

  insert into leaderboard (nickname, company, score, survival_time, tasks_completed, max_combo, role, tournament_id)
  values (trim(p_nickname), nullif(trim(coalesce(p_company, '')), ''), p_score, p_survival_time, p_tasks_completed, p_max_combo, p_role, p_tournament_id);
end;
$$;

-- Note: all game results are stored (no upsert, no cleanup).
-- Leaderboard queries use the view/function below to show best score per player.

-- ============================================
-- Best score per player per tournament (view)
-- ============================================

create or replace view leaderboard_best as
select distinct on (nickname, tournament_id) *
from leaderboard
order by nickname, tournament_id, score desc;

-- RPC: get top N players for a tournament (best score per player, optional company filter)
create or replace function get_tournament_top(
  p_tournament_id text,
  p_limit integer default 10,
  p_company text default null
)
returns setof leaderboard
language sql stable
as $$
  select * from (
    select distinct on (nickname) *
    from leaderboard
    where tournament_id = p_tournament_id
      and (p_company is null or company = p_company)
    order by nickname, score desc
  ) best
  order by score desc
  limit p_limit;
$$;

-- RPC: count unique players in a tournament (optional company filter)
create or replace function count_tournament_players(
  p_tournament_id text,
  p_company text default null
)
returns integer
language sql stable
as $$
  select count(distinct nickname)::integer
  from leaderboard
  where tournament_id = p_tournament_id
    and (p_company is null or company = p_company);
$$;

-- RPC: get player rank by best score (unique players only)
create or replace function get_player_rank(
  p_nickname text,
  p_tournament_id text,
  p_company text default null
)
returns table(rank integer, total integer)
language sql stable
as $$
  with best_scores as (
    select nickname, max(score) as score
    from leaderboard
    where tournament_id = p_tournament_id
      and (p_company is null or company = p_company)
    group by nickname
  ),
  player as (
    select score from best_scores where nickname = p_nickname
  )
  select
    (select count(*)::integer + 1 from best_scores b, player p where b.score > p.score) as rank,
    (select count(*)::integer from best_scores) as total;
$$;

-- ============================================
-- Tournament announcements (pg_cron + pg_net)
-- ============================================
-- Enable extensions (run once in Supabase SQL Editor):
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
-- Schedule tournament results + new tournament every Friday at 09:00 UTC (12:00 MSK):
-- Replace <YOUR_SUPABASE_URL> and <YOUR_SERVICE_ROLE_KEY> with actual values.
--
-- select cron.schedule(
--   'tournament-announce',
--   '0 9 * * 5',
--   $$
--   select net.http_post(
--     url := '<YOUR_SUPABASE_URL>/functions/v1/tournament-announce',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- Schedule daily standings every day at 09:00 UTC (12:00 MSK), except Friday (handled above):
--
-- select cron.schedule(
--   'daily-standings',
--   '0 9 * * 0-4,6',
--   $$
--   select net.http_post(
--     url := '<YOUR_SUPABASE_URL>/functions/v1/daily-standings',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

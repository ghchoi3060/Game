-- 솔솔 게임 모음: 기록 동기화 · 순위표 · 이어하기 코드
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- 로그인은 익명 계정(Authentication → Allow anonymous sign-ins 켜기).
-- 데이터 보호는 RLS 가 맡는다: 각 사용자는 자기 행만 읽고 쓴다. 순위표와 코드 옮기기는 아래 함수로만.

-- 순위표에 보일 닉네임
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text check (char_length(nickname) between 1 and 20),
  updated_at timestamptz not null default now()
);

-- 게임별 저장 데이터(브라우저 localStorage 의 그 게임 키들을 통째로)
create table if not exists public.saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  game text not null check (game in ('chess', 'janggi', 'sudoku', 'mine')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game)
);

-- 완성·성공한 판의 기록(순위표용)
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game text not null check (game in ('sudoku', 'mine')),
  level text not null check (level in ('easy', 'normal', 'hard', 'expert')),
  time_sec int not null check (time_sec between 1 and 86400),
  created_at timestamptz not null default now()
);
create index if not exists scores_board_idx on public.scores (game, level, time_sec);
create index if not exists scores_user_idx on public.scores (user_id);

-- 이어하기 코드(30분 유효). 직접 접근은 막고 함수로만 쓴다
create table if not exists public.transfer_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;
alter table public.scores enable row level security;
alter table public.transfer_codes enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own saves" on public.saves;
create policy "own saves" on public.saves
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "insert own scores" on public.scores;
create policy "insert own scores" on public.scores
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "read own scores" on public.scores;
create policy "read own scores" on public.scores
  for select to authenticated using (user_id = auth.uid());

-- 순위표: 사람마다 최고 기록 하나. 상위 p_limit 명 + 내 순위
create or replace function public.leaderboard(p_game text, p_level text, p_limit int default 20)
returns table (rank bigint, nickname text, best int, is_me boolean)
language sql stable security definer set search_path = public as $$
  with best as (
    select s.user_id, min(s.time_sec) as best
    from scores s where s.game = p_game and s.level = p_level
    group by s.user_id
  ), ranked as (
    select rank() over (order by b.best) as rank,
           coalesce(p.nickname, '이름 없음') as nickname,
           b.best,
           b.user_id = auth.uid() as is_me
    from best b left join profiles p on p.id = b.user_id
  )
  select * from ranked where rank <= least(greatest(p_limit, 1), 100) or is_me order by rank;
$$;

-- 이어하기 코드 만들기(예전 폰)
create or replace function public.create_transfer_code()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from transfer_codes where user_id = auth.uid() or expires_at < now();
  loop
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into transfer_codes (code, user_id, expires_at) values (c, auth.uid(), now() + interval '30 minutes');
      return c;
    exception when unique_violation then
      -- 드물게 겹치면 다시 뽑는다
    end;
  end loop;
end $$;

-- 이어하기 코드 쓰기(새 폰): 예전 계정의 저장·기록·닉네임을 지금 계정으로 옮긴다
create or replace function public.redeem_transfer_code(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare old uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  select user_id into old from transfer_codes
    where code = upper(trim(p_code)) and expires_at > now();
  if old is null then return false; end if;
  delete from transfer_codes where code = upper(trim(p_code));
  if old = me then return true; end if;
  delete from saves where user_id = me;
  update saves set user_id = me where user_id = old;
  update scores set user_id = me where user_id = old;
  insert into profiles (id, nickname, updated_at)
    select me, nickname, now() from profiles where id = old
    on conflict (id) do update set nickname = excluded.nickname, updated_at = now();
  delete from profiles where id = old;
  return true;
end $$;

revoke all on function public.leaderboard(text, text, int) from public;
revoke all on function public.create_transfer_code() from public;
revoke all on function public.redeem_transfer_code(text) from public;
grant execute on function public.leaderboard(text, text, int) to authenticated;
grant execute on function public.create_transfer_code() to authenticated;
grant execute on function public.redeem_transfer_code(text) to authenticated;

# 서버 저장(Supabase) 설정

모든 게임(체스·장기·스도쿠·지뢰찾기·빙고·블록·숨은그림)의 기록을 서버에 저장하고, 스도쿠·지뢰찾기·블록·숨은그림 순위표를 보여 주는 설정이다.
설정 전에는 게임이 지금처럼 그 폰에만 저장한다.

## 한 번만 하면 되는 준비

1. https://supabase.com 에 가입한다(GitHub 계정으로 로그인 가능).
2. **New project**
   - Name: `solsol-games` (아무 이름)
   - Database Password: 자동 생성 후 따로 보관
   - Region: **Northeast Asia (Seoul)**
   - Plan: Free
3. 왼쪽 **Authentication → Sign In / Providers** 에서 **Allow anonymous sign-ins** 를 켜고 저장한다.
4. 왼쪽 **SQL Editor → New query** 에 [schema.sql](schema.sql) 내용을 통째로 붙여넣고 **Run**.
   "Success. No rows returned" 가 나오면 된다.
5. 왼쪽 아래 **Project Settings → API Keys**(또는 Data API)에서 두 값을 복사한다.
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** 키 또는 **publishable** 키 (`eyJ…` 또는 `sb_publishable_…`)
   - **service_role / secret 키는 쓰지 않는다.** 이 키는 모든 데이터를 마음대로 바꿀 수 있어서 공개 저장소에 올리면 안 된다.
6. [../common/supabase-config.js](../common/supabase-config.js) 의 `url`, `anonKey` 에 넣고 push 한다.

anon(publishable) 키는 웹앱에 들어가도 되는 공개 키다. 누가 무엇을 읽고 쓸 수 있는지는 schema.sql 의 RLS 규칙이 정한다.

## 구조

| 테이블 / 함수 | 내용 |
|---|---|
| `saves` | 사용자·게임별 저장 데이터(그 게임의 localStorage 키 묶음, jsonb). 자기 것만 읽고 쓴다 |
| `scores` | 스도쿠·지뢰찾기 완성·성공 기록. 자기 것만 넣고 읽는다 |
| `profiles` | 순위표 닉네임 |
| `transfer_codes` | 이어하기 코드(30분). 직접 접근 불가 |
| `leaderboard(game, level, limit)` | 사람마다 최고 기록 하나로 순위. 상위 20명 + 내 순위 |
| `create_transfer_code()` / `redeem_transfer_code(code)` | 기기 옮기기 |

브라우저 쪽은 [../common/cloud.js](../common/cloud.js) 하나. 각 게임은 이 파일을 먼저 불러오고, localStorage 를 쓰던 대로 쓰면 그 게임의 키가 바뀔 때 서버로 올라간다.
서버와 이 폰 중 더 최근에 바뀐 쪽을 쓴다(게임 단위).

## 알아 둘 점

- 무료 플랜은 **1주일 동안 아무 요청이 없으면 프로젝트가 일시정지**된다. 대시보드에서 Restore 를 누르면 다시 켜진다. 그동안 게임은 폰에만 저장한다.
- 순위표 기록은 브라우저가 올리므로, 마음먹고 조작하면 가짜 기록을 넣을 수 있다. 친구끼리 쓰는 정도라면 괜찮다.
- 익명 계정은 브라우저 데이터를 지우면 사라진다. 폰을 바꾸거나 데이터를 지우기 전에 기록 탭의 **이어하기 코드**로 옮긴다.
- 대시보드 **Table Editor** 에서 사용자 수(`saves`, `profiles`)와 기록(`scores`)을 볼 수 있다.

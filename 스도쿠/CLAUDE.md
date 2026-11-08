# 솔솔퍼즐(스도쿠)

아이폰에서 링크로 여는 스도쿠 웹앱(PWA). 체스·장기와 같은 디자인. 빌드 단계 없음 — 파일을 고치면 그대로 배포된다.
사용자 응답·문서·화면 문구는 한국어.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면·스타일·앱 로직 전부. 입력, 메모, 되돌리기, 힌트, 이펙트, 기록 |
| `engine.js` | 문제 생성·풀이·힌트 (`SudokuEngine()`) |
| `sw.js` | 오프라인 캐시. 캐시에 넣는 파일이 바뀌면 `CACHE` 버전을 올린다 |
| `manifest.webmanifest`, `icon.svg`, `icon-512.png` | 홈 화면 앱 정보·아이콘. PNG 는 `icon.svg` 를 512px 로 렌더링한 것 |

## 구조

- **칸**: `i = 줄*9 + 칸`, 값 0 은 빈칸. `UNITS` 27개(줄 9, 칸 9, 상자 9), `PEERS[i]` 20칸.
- **생성** (`generate(level)`): 무작위로 꽉 찬 판을 만들고 가운데 대칭으로 두 칸씩 지운다. 지울 때마다 해가 하나인지(`solve(…, 2)`) 확인.
  쉬움·보통은 외길 수(naked/hidden single)만으로 풀리는 것만 남기고, 어려움·고수는 외길 수만으로는 안 풀리는 문제를 고른다.
  고수는 대칭 뒤에 한 칸씩 더 지워 최소로 만든다(보통 23~25칸).
- **힌트**: 맞게 채운 칸만 보고 외길 수를 찾아 이유와 함께 알려 준다. 없으면 정답에서 한 칸.
- **상태** `G`: `lv, puz, sol, val, notes(칸마다 9비트), time, mistakes, hints, done, undo(스냅숏 최대 200)`.
- **저장**: localStorage `sudoku.game`(진행 중 판), `sudoku.stats`(난이도별 played·solved·best·recent), `sudoku.lastLv`.
  같은 주소의 다른 게임과 겹치지 않게 키는 `sudoku.*`.
- **캐시**: 다른 게임과 캐시 저장소를 함께 쓰므로 `sw.js` 는 `solsol-sudoku-` 로 시작하는 옛 캐시만 지운다.

## 검증

Node 가 없으면 headless Chrome 에서 엔진을 불러 확인한다.
- 난이도마다 여러 판 생성: 해가 정확히 하나, 정답이 규칙에 맞음, 문제 숫자가 정답과 같음, 쉬움·보통은 외길로 풀리고 어려움·고수는 아님.
- 힌트만 반복해서 끝까지 풀리는지.

## 배포

GitHub 저장소 `ghchoi3060/Game` 을 Pages 로 공개한다. 주소는 `https://ghchoi3060.github.io/Game/스도쿠/`.

## 서버 저장

`../common/cloud.js` 를 게임 스크립트보다 먼저 불러온다(`data-game` 으로 게임 이름). localStorage 를 쓰던 대로 쓰면 그 게임 키가 서버로 올라간다. 기록(전적) 탭 끝에 `SolsolCloud.mount()` 로 순위표·기기 옮기기 화면을 붙인다. 설정·구조는 `../supabase/README.md`.

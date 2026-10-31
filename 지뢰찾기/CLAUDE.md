# 솔솔퍼즐(지뢰찾기)

아이폰에서 링크로 여는 지뢰찾기 웹앱(PWA). 체스·장기와 같은 디자인. 빌드 단계 없음 — 파일을 고치면 그대로 배포된다.
사용자 응답·문서·화면 문구는 한국어.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면·스타일·앱 로직 전부. 입력(탭·길게 누르기·오른쪽 클릭), 열기·코드, 이펙트, 기록 |
| `engine.js` | 판 생성·찍기 없는 판 판정 (`MineEngine()`) |
| `sw.js` | 오프라인 캐시. 캐시에 넣는 파일이 바뀌면 `CACHE` 버전을 올린다 |
| `manifest.webmanifest`, `icon.svg`, `icon-512.png` | 홈 화면 앱 정보·아이콘. PNG 는 `icon.svg` 를 512px 로 렌더링한 것 |

## 구조

- **난이도**: `engine.js` 의 `LEVELS`. 폰 세로 화면에 맞춰 폭 9~12칸. 칸 크기는 화면 폭에 맞추되 최대 44px.
- **생성**: 첫 탭 때 만든다. 첫 칸과 주변 8칸에는 지뢰를 두지 않는다.
  "찍지 않아도 풀리는 판"이 켜져 있으면 `solvable()`(단일 칸 규칙 + 두 칸 부분집합 규칙 + 남은 지뢰 수)로 첫 칸부터 끝까지 풀리는 판이 나올 때까지 다시 만든다(최대 1.2초, 실패하면 그냥 판).
- **입력**: 탭 = 열기(깃발 모드면 깃발), 380ms 길게 누르기 = 깃발(깃발 모드면 열기), 오른쪽 클릭 = 깃발. 열린 숫자 탭 = 코드.
  길게 누른 뒤 오는 click·contextmenu 는 `longFired` 로 한 번 무시한다.
- **상태** `G`: `lv, w, h, m, mine[], num[], open[], flag[], started, over('win'|'lose'|null), boom, time`.
- **저장**: localStorage `mine.game`(진행 중 판), `mine.stats`(난이도별 played·won·best·recent), `mine.lastLv`, `mine.noGuess`.
  같은 주소의 다른 게임과 겹치지 않게 키는 `mine.*`.
- **캐시**: `sw.js` 는 `solsol-mine-` 로 시작하는 옛 캐시만 지운다.

## 검증

Node 가 없으면 headless Chrome 에서 확인한다.
- 난이도마다 여러 판 생성: 지뢰 수가 맞고, 첫 칸·주변에 지뢰가 없고, 찍기 없는 판 비율.
- 화면: 첫 탭, 깃발(모드·오른쪽 클릭), 전부 열어 성공, 지뢰 밟아 실패, 기록 저장.
- 길게 누르기는 실제 폰에서 확인해야 한다.

## 배포

GitHub 저장소 `ghchoi3060/Game` 을 Pages 로 공개한다. 주소는 `https://ghchoi3060.github.io/Game/지뢰찾기/`.

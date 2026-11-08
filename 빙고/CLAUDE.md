# 솔솔대국(빙고)

아이폰에서 링크로 여는 빙고 웹앱(PWA). 체스·장기와 같은 디자인, 친구 대전은 최대 6명. 빌드 단계 없음 — 파일을 고치면 그대로 배포된다.
사용자 응답·문서·화면 문구는 한국어.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면·스타일·앱 로직 전부. 배치, 봇 대전, 친구 대전, 제비뽑기, 차례 시간, 이펙트, 기록 |
| `engine.js` | 줄 판정·봇 판단 (`BingoEngine()`) |
| `sw.js` | 오프라인 캐시(봇 대전). 캐시에 넣는 파일이 바뀌면 `CACHE` 버전을 올린다 |
| `manifest.webmanifest`, `icon.svg`, `icon-512.png` | 홈 화면 앱 정보·아이콘. PNG 는 `icon.svg` 를 512px 로 렌더링한 것 |

## 구조

- **판**: 칸 `i = 줄*5 + 칸`, 값 1~25(배치 중 0). `LINES` 12줄(가로 5, 세로 5, 대각 2). 부른 숫자 목록으로 표시·줄을 계산한다.
- **상태** `G`: `mode('bot'|'friend'), target(1·3·5줄), players, order(제비뽑기 순서), turn, called, phase('setup'|'play'|'end'), winners, lastCall`.
  내 판(`myBoard`)은 G 밖에 두고 남에게 보내지 않는다. 봇 판은 봇 플레이어 안에.
- **봇**: `botPick(board, called, level)` — 0 무작위, 1 보통(40% 무작위), 2 어려움. 줄에 이미 표시된 칸이 많을수록 점수.
- **친구 대전**: PeerJS 별 모양 연결. 방장 피어 id `solsolbg-<방코드>`, 방장이 모든 판정과 중계를 맡는다.
  - 참가자→방장: `hello{id,name}`, `ready{ready}`, `call{n}`, `status{k,lines}`
  - 방장→모두: `lobby{players,target,phase}`, `start{order,turn,target}`, `called{n,by,k}`, `turn{turn,lines}`, `end{winners,lines}`, `again`, `full`, `started`
  - 숫자가 불리면 모두 자기 줄 수를 `status` 로 보내고, 방장이 다 모으면(또는 5초) 승자를 정하거나 다음 차례를 알린다. 그동안 다음 부르기는 받지 않는다.
  - 최대 6명(`MAX_PLAYERS`). 게임 중 들어오면 `started`, 꽉 차면 `full`. 나간 사람은 흐리게 남기고 차례를 건너뛴다. 방장이 나가면 방이 닫힌다.
- **제비뽑기·차례 시간**: 시작하면 `showIntro()` 카드(5초, `INTRO_MS`)에 번호가 굴러가다 순서가 정해진다.
  친구 대전에서는 차례마다 `TURN_SEC`(5초) 시간 막대. 0초가 되면 자기 폰이 `botPick(…, 1)` 로 대신 고르고,
  그래도 응답이 없으면(폰 멈춤·끊김) 방장이 2초 더 기다렸다가 남은 숫자 아무거나 부른다(`hostArm`). 봇 대전은 시간 제한 없음.
- **저장**: localStorage `bingo.stats`(봇·친구 승패, 최근 판), `bingo.prefs`(봇 수·실력·줄 수). 기기 id `solsol.me`, 이름 `solsol.name` 은 다른 게임과 함께 쓴다.

## 검증

- 봇 대전: headless Chrome 에서 배치(직접 채우기·되돌리기·나머지 랜덤) → 시작 → 끝까지 → 결과·전적.
- 친구 대전: 실제 WebRTC 는 headless 에서 연결되지 않으므로, 한 페이지에 iframe 3개를 두고 PeerJS 를 부모 페이지가 중계하는 가짜로 바꿔 확인한다
  (참가, 준비, 시작, 제비뽑기가 모두 같은지, 5초 자동 선택, 승자 판정이 모두 같은지).
- 실제 폰 2대 이상으로 한 판 둬 봐야 최종 확인된다.

## 배포

GitHub 저장소 `ghchoi3060/Game` 을 Pages 로 공개한다. 주소는 `https://ghchoi3060.github.io/Game/빙고/`.

## 서버 저장

`../common/cloud.js` 를 `data-game="bingo"` 로 불러온다. 서버 DB 의 저장 허용 목록에 `bingo` 가 있어야 한다(`../supabase/schema.sql` 끝의 alter 문).

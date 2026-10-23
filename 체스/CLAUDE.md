# 솔솔대전

아이폰에서 링크로 여는 체스 웹앱(PWA). 빌드 단계 없음 — 파일을 고치면 그대로 배포된다.
사용자 응답·문서·화면 문구는 한국어.

## 파일

| 파일 | 내용 |
|---|---|
| `index.html` | 화면·스타일·앱 로직 전부. 봇 대국, 친구 대전, 전적, 이펙트 |
| `engine.js` | 체스 규칙·AI (`ChessEngine()`). 화면 쪽과 Web Worker 양쪽에서 쓴다 |
| `sw.js` | 오프라인 캐시. 캐시에 넣는 파일이 바뀌면 `CACHE` 버전을 올린다 |
| `manifest.webmanifest`, `icon.svg`, `icon-512.png` | 홈 화면 앱 정보·아이콘 |

## 구조

- **봇 난이도**: `index.html` 의 `LEVELS` 10개. `depth`(수읽기 깊이)·`noise`(평가 흔들기)·`rnd`(무작위 수 확률)·`time`(ms).
- **친구 대전**: PeerJS(unpkg `peerjs@1.5.4`)로 두 폰을 WebRTC 로 직접 연결. 공개 PeerJS 서버는 연결 중개만 하고 저장하지 않는다.
  방 만든 쪽 피어 id 는 `solsol-<방코드6자리>`. 초대 링크는 `<주소>#join-<코드>`.
  메시지: `hello` → (방장) `state` → `move`(전체 수 목록을 보냄) / `end`(기권) / `rematch`(색 바꿔 새 판).
- **저장**: 전부 그 폰의 localStorage. `solsol.room`(진행 중 방), `solsol.friends`(친구별 전적), `solsol.name`, `solsol.me`(기기 id), `chess.botStats`·`chess.botGame`.

## 검증

- 엔진을 바꾸면 perft 로 확인한다: 시작 국면 depth 4 = 197281, Kiwipete depth 3 = 97862.
  `node -e "const E=require('./engine.js')();console.log(E.perft(E.create(),4))"`
- 친구 대전은 폰 두 대(또는 폰 + PC 브라우저)로 실제로 한 판 둬 봐야 확인된다.

## 배포

GitHub 저장소 `ghchoi3060/Game`(이 폴더의 상위)을 Pages(main 브랜치 루트)로 공개한다. 체스 주소는 `https://ghchoi3060.github.io/Game/체스/`.
push 하면 1~2분 뒤 반영된다. 파일 경로는 전부 상대 경로라 폴더 이름이 바뀌어도 동작한다.

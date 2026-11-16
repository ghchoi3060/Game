# 솔솔놀이(계단) 메모

- 한 파일 앱: index.html(캔버스 2D) + sw.js + manifest. 그림은 전부 직접 그린 것(솔솔이: 토끼 귀 후드를 쓴 2등신 꼬마, 분홍 후드티, 큰 눈, ω 입, 동그란 꼬리. 뛸 때 귀가 펄럭이고 가끔 눈을 깜빡임). 다른 회사 게임의 이름·캐릭터·그림은 쓰지 않는다.
- 상태 `R`: `stairs[i]`는 i번째 계단의 칸. `p`는 지금 계단, `face`는 1이거나 -1. `act(turn)`은 turn이면 face를 뒤집고, 다음 계단 방향이 face와 다르면 `die('miss')`.
- 계단 생성 `ensure(n)`: 처음 5칸은 곧게. 그 뒤로는 꺾일 확률이 .3에서 .55로 오르고, 6칸 넘게 곧게 가지는 않는다. 코인은 10% 확률.
- 시간 막대 `drain()`은 .15 + p×.0011(최대 .65)/초이고, 한 칸에 +.075, 코인은 +.06을 더 채운다. `tickGauge()`는 그리기(rAF)와 setInterval(100ms) 양쪽에서 불러서 그리기가 느려도 정확하다.
- 일시정지: 화면을 떠나거나 설명서·기록 탭을 열면 멈추고, 다음 누름은 다시 시작만 한다(움직이지 않음).
- 캐릭터 6종 `CHARS`(토끼·고양이·곰·병아리·강아지·판다): 후드 색, 귀(long/cat/round/flop/tuft), 꼬리(puff/curl/wag/feather), 배 무늬만 다르고 얼굴은 같다. 고르기 창(`#charBg`)의 캔버스 미리보기는 `drawPicks()`가 매 프레임 그린다. 처음 들어오면 설명서 다음에 고르기 창이 뜬다.
- 저장 키: `stairs.stats` {played, best, total, coins, recent[]}, `stairs.voice`, `stairs.music`, `stairs.char`, `stairs.swap`(버튼 자리), `stairs.seenManual`.
- 서버: cloud.js 게임 키는 `stairs`, 순위 레벨은 `normal`. 층수를 time_sec 칸에 넣는다. 높을수록 위로 가게 하려면 supabase/schema.sql 맨 아래 "계단 추가" 블록을 실행해야 한다.
- 버전: index.html의 `VERSION`. 바꾸면 sw.js의 CACHE(`solsol-stairs-vN`)도 올린다.

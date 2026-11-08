// Supabase 프로젝트 설정. 공개(anon / publishable) 키만 넣는다 — 데이터 보호는 DB 의 RLS 규칙이 맡는다.
// service_role(secret) 키는 절대 넣지 않는다. 비어 있으면 클라우드 기능은 꺼지고 게임은 이 폰에만 저장한다.
window.SOLSOL_SUPABASE = {
  url: 'https://pegcmjokliesdvrqqheb.supabase.co',
  anonKey: 'sb_publishable_hbtnUlt1_-NmcqxXwkH79g_YjT7IWg4'
};

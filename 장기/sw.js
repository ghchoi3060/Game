// 앱 껍데기 캐시: 화면은 네트워크 우선(새 버전 바로 반영), 안 되면 캐시로 오프라인 봇 대국
// 체스와 같은 주소(origin)라 캐시 저장소를 함께 쓴다. 지울 때는 자기 이름(solsol-janggi-)으로 시작하는 것만 지운다
const CACHE = 'solsol-janggi-v1';
const SHELL = ['./', './index.html', './engine.js', './manifest.webmanifest', './icon.svg', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('solsol-janggi-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});

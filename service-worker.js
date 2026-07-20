// ══════════════════════════════════════════════════════════════
// 양진웅 Note — 서비스워커
// 배포할 때마다 CACHE_VERSION 숫자만 올리면 즉시 갱신됩니다.
// ══════════════════════════════════════════════════════════════
const CACHE_VERSION = 'v3';
const CACHE_NAME = `yjw-note-${CACHE_VERSION}`;

// 오프라인에서도 열리도록 최소한만 캐시
const PRECACHE = ['./', './index.html'];

// 설치: 새 워커를 대기시키지 않고 바로 활성화 준비
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
});

// 활성화: 예전 버전 캐시 전부 삭제
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 페이지에서 즉시 교체 요청이 오면 수락
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// 요청 처리
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 외부 도메인(Firebase, 날씨 API 등)은 그대로 통과
  if (url.origin !== self.location.origin) return;

  // HTML 문서는 "네트워크 우선" → 배포하면 바로 최신이 보임
  const isDoc = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');

  if (isDoc) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        // 오프라인이면 캐시본 사용
        const cached = await caches.match(req) || await caches.match('./index.html');
        return cached || new Response('오프라인 상태입니다.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // 그 외 정적 파일은 "캐시 우선 + 백그라운드 갱신"
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(res => {
      if (res && res.status === 200) {
        caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
      }
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response('', { status: 504 });
  })());
});

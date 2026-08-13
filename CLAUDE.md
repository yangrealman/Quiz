# 양진웅 Note — 작업 규칙

## 구조

- `index.html` 한 파일이 앱 전체다 (약 1MB · HTML + CSS + JS 인라인). 빌드 도구 없음.
- `light.html` = 라이트 버전, `home.html` = 예전 원페이지 홈(설정에서 뺐지만 파일은 남아 있음).
- `service-worker.js` = PWA 캐시. HTML은 네트워크 우선이라 배포하면 바로 반영된다.
  `CACHE_VERSION` 은 정적 파일 캐시용이라 index.html 만 고칠 때는 건드리지 않아도 된다.
- 배포는 GitHub Pages(`main` 브랜치). **`main` 에 병합돼야 사이트가 바뀐다.**

## 버전 번호 — 반드시 지킬 것

앱을 고칠 때마다 **한국 시각 기준 `YYMMDD-HHMM`** 으로 버전을 올린다.
지어내지 말고 실제 시각을 찍어서 쓴다:

```
TZ=Asia/Seoul date +%y%m%d-%H%M
```

이 값을 **두 곳에 똑같이** 넣는다.

1. `const APP_VERSION = '...'`
2. `PATCH_NOTES` 맨 위에 새로 쌓는 덩어리의 `v: '...'`

`APP_VERSION` 은 설정 화면의 "지금 버전" 표시와, 설치한 PWA에 뜨는
"새 버전이 있어요" 배너를 움직인다. 안 올리면 배포해도 사용자 화면은
그대로인 것처럼 보인다.

## 업데이트 내역 (`PATCH_NOTES`)

맨 위가 가장 최근. 새 덩어리를 위에 쌓는다. `k` 는 `new`(새 기능) ·
`fix`(고침) · `chg`(바뀜). 사용자가 읽는 글이므로 **무엇이 어떻게
달라졌는지**를 사용자 말로 쓴다. 함수 이름이나 코드 얘기는 넣지 않는다.

## 코드 관습

- 주석은 한국어. 고친 자리에는 `[수정]`, 새로 넣은 자리에는 `[추가]` 를 달고
  **왜 그렇게 했는지**(예전에 무엇이 문제였는지)를 남긴다. 기존 주석들이 그렇다.
- 저장은 `_getCache(key, 기본값)` 으로 읽고 `syncToFirebase(key, 값)` 으로 쓴다.
  새 키를 만들면 동기화 키 목록과 백업 키 목록(`'quiz_imgw','quiz_quick_links',...`)
  **양쪽에** 더해야 백업·복원에 딸려 간다.
- 풀이 화면은 일곱 개(`currentQuiz` · `wqState` · `sqState` · `fqState` ·
  `cqState` · `mqState` · `mwqState`)이고 `{ questions, idx, answered }` 모양이
  같다. 한 화면에 기능을 넣으면 나머지도 같이 손봐야 하는지 꼭 확인한다.
- 답 기록은 `answered[문항자리]` — 객관식은 고른 보기 번호(0부터), 필답형은
  `'correct'`/`'wrong'`. **`answered[i]` 를 참·거짓으로 판단하면 안 된다**
  (첫 보기가 0이라 안 푼 것과 구별이 안 된다). `i in answered` 로 본다.

## 확인

브라우저 없이 고치고 끝내지 말 것. 최소한:

```
node -e "…"                       # <script> 블록 문법 검사
npx http-server -p 8877 -s .      # + playwright(/opt/node22/lib/node_modules)로 실제 클릭
```

앱은 처음에 `page-home`(문제풀기)으로 열린다. 홈 대시보드를 보려면
`goPage('dashboard')` 를 먼저 부른다.

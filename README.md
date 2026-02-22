# Cloudflare Worker — KV API

Bearer 토큰으로 인증하는 KV 프록시 Worker입니다. 클라이언트는 `GET`/`PUT`/`DELETE`로 키별 데이터를 읽고 쓸 수 있습니다.

## 요구 사항

- [Node.js](https://nodejs.org/) (LTS 권장)
- [Cloudflare 계정](https://dash.cloudflare.com/sign-up)

## 설정

### 1. KV 네임스페이스 생성

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **KV** 이동
2. **Create namespace** 클릭 후 이름 입력 (예: `exam-papers`) → 생성
3. 생성된 네임스페이스의 **ID**를 복사 (예: `cedfd377e56a4e0caaac3b732dc10995`)

### 2. wrangler.jsonc에 KV ID 넣기

`wrangler.jsonc`의 `kv_namespaces[0].id`를 위에서 복사한 **본인 KV 네임스페이스 ID**로 바꿉니다.

```jsonc
"kv_namespaces": [
  {
    "binding": "KV",
    "id": "여기에_본인_KV_네임스페이스_ID"
  }
],
```

- `binding`: Worker 코드에서 사용하는 이름 (`env.KV`) — 필요 시 이름만 바꾸고, `src/index.js`의 `env.KV`도 같이 수정해야 합니다.

### 3. MASTER_TOKEN 시크릿 설정

클라이언트가 `Authorization: Bearer <MASTER_TOKEN>`으로 인증합니다. 같은 값을 다른 기기/앱에서도 사용해야 하므로 한 번 정한 뒤 잘 보관하세요.

```sh
npx wrangler secret put MASTER_TOKEN
```

프롬프트가 나오면 사용할 토큰 문자열을 입력합니다. (예: 랜덤 32자)

- 이미 설정된 시크릿을 바꾸려면 같은 명령을 다시 실행해 새 값을 입력하면 됩니다.

## 로컬 개발

```sh
npm install
npm run dev
```

`wrangler dev`가 실행되며, 로컬에서 Worker를 띄웁니다. MASTER_TOKEN은 이미 배포 환경에 넣어 둔 값으로 로컬에서도 동일하게 동작하려면 [Wrangler 문서의 로컬 시크릿](https://developers.cloudflare.com/workers/wrangler/commands/#secret)을 참고하세요.

## 배포 (Deploy)

```sh
npm install
npx wrangler secret put MASTER_TOKEN   # 최초 1회 또는 값 변경 시
npm run deploy
```

배포가 끝나면 터미널에 Worker URL이 출력됩니다 (예: `https://kv.<subdomain>.workers.dev`).  
클라이언트 앱의 **Worker URL**에는 이 주소를 그대로 넣고, **MASTER_TOKEN**에는 위에서 설정한 값과 동일한 문자열을 사용하면 됩니다.

## API 사용 예

- **Base URL**: 배포 후 출력되는 Worker URL (끝에 `/` 없이, 예: `https://kv.example.workers.dev`)
- **인증**: 모든 요청에 헤더 `Authorization: Bearer <MASTER_TOKEN>` 필요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET`  | `/{key}` | 키에 해당하는 값 조회 |
| `PUT`  | `/{key}` | 키에 값 저장 (body: 문자열 또는 JSON 문자열) |
| `DELETE` | `/{key}` | 키 삭제 |

예: 키 `papers`에 JSON 배열 저장

```sh
curl -X PUT "https://YOUR_WORKER_URL/papers" \
  -H "Authorization: Bearer YOUR_MASTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"id":"1","title":"시험지1"}]'
```

## 참고

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
- [Wrangler 설정](https://developers.cloudflare.com/workers/wrangler/configuration/)

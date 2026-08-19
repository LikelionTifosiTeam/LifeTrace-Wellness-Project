# AfterGlow Frontend–Backend API Contract

시술 후 90일 회복 동행 서비스 **AfterGlow**의 프론트엔드–백엔드 인터페이스 명세.

**현재 구현된 백엔드는 Supabase다.** `services/supabase-repo.ts`가 아래 계약과 동일한 결과를 만들어내며,
`NEXT_PUBLIC_DATA_SOURCE=supabase` + 실제 키가 채워지면 자동으로 그 경로로 전환된다.

본 문서는 두 가지 용도로 유지한다.

1. Supabase 대신 자체 REST 백엔드를 붙일 경우의 인터페이스 계약
2. Supabase 구현이 지켜야 하는 규칙(판정 임계값, 생성 책임 분리, 민감정보 처리)의 원본 명세

스키마 원본: `supabase/migrations/20260819000001_init_afterglow.sql`

---

## 1. 공통 규약

- **Base URL**: `NEXT_PUBLIC_API_BASE_URL` (기본 `https://api.afterglow.kr/v1`)
- **Content-Type**: `application/json` (사진 업로드만 `multipart/form-data`)
- **Auth**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Date**: `YYYY-MM-DD` / `YYYY-MM-DDTHH:mm:ss+09:00`
- **시간대**: 서버가 KST 기준으로 `day`(D+N)를 계산해 내려준다. 클라이언트는 D+N을 재계산하지 않는다.

### 성공 응답

```json
{ "success": true, "data": { } }
```

### 오류 응답

```json
{
  "success": false,
  "error": {
    "code": "DEVIATION_ALERT_NOT_FOUND",
    "message": "해당 알림을 찾을 수 없습니다.",
    "details": [{ "field": "alertId", "issue": "not found" }]
  }
}
```

| code | HTTP | 상황 |
| :-- | :-- | :-- |
| `UNAUTHORIZED` | 401 | 토큰 만료/누락 |
| `CONSENT_REQUIRED` | 403 | 클리닉 공유 동의 없이 공유 시도 |
| `JOURNEY_NOT_FOUND` | 404 | 진행 중인 여정 없음 |
| `CHECKIN_DUPLICATE` | 409 | 같은 날 중복 체크인 (PATCH로 유도) |
| `INVALID_PARAM` | 422 | 검증 실패 |

---

## 2. 엔드포인트

| 영역 | Method | Path | 설명 |
| :-- | :-- | :-- | :-- |
| Auth | `POST` | `/auth/login` | 로그인 |
| Auth | `POST` | `/auth/signup` | 회원가입 |
| Auth | `GET` | `/auth/me` | 현재 사용자 |
| Journey | `POST` | `/journeys` | 시술 등록 = 회복 여정 시작 |
| Journey | `GET` | `/journeys/current/today` | 오늘 화면 통합 조회 |
| Journey | `GET` | `/journeys/current/recovery` | 회복 곡선 화면 통합 조회 |
| Journey | `GET` | `/journeys/current/alerts` | 이탈 알림 목록 |
| Journey | `GET` | `/journeys/archive` | 완료된 여정 목록 |
| Journey | `GET` | `/journeys/archive/{id}` | 완료된 여정 상세 |
| Checkin | `GET` | `/checkins` | 체크인 전체 조회 |
| Checkin | `POST` | `/checkins` | 오늘 체크인 등록 |
| Checkin | `PATCH` | `/checkins/{date}` | 체크인 수정 |
| Checkin | `POST` | `/checkins/{date}/photo` | 사진 첨부 (선택) |
| Alert | `POST` | `/alerts/{id}/share` | 클리닉 공유 (동의 필수) |
| Vitals | `GET` | `/vitals` | 웨어러블·환경·상관 |
| Vitals | `POST` | `/vitals/connect` | 웨어러블 연동 |
| Protocol | `GET` | `/protocols/{id}` | 시술별 케어 프로토콜 |

---

## 3. 핵심 DTO

타입 원본은 `types/index.ts`. 아래는 서버가 반드시 맞춰야 하는 필드만 발췌한다.

### 3.1 `POST /journeys` — 여정 시작

Request

```json
{
  "procedureName": "고강도 집속 초음파 리프팅",
  "category": "리프팅",
  "procedureDate": "2026-08-07",
  "clinicName": "웰니스하우스 강남 클리닉",
  "clinicSharingConsent": false,
  "checkinReminderTime": "21:30",
  "connectWearable": true
}
```

Response `data`: `RecoveryJourney`

```json
{
  "id": "journey-001",
  "protocolId": "protocol-lifting-001",
  "procedureName": "고강도 집속 초음파 리프팅 (300샷)",
  "category": "리프팅",
  "clinicName": "웰니스하우스 강남 클리닉",
  "practitionerName": "박지훈 원장",
  "procedureDate": "2026-08-07",
  "currentDay": 12,
  "status": "on-track",
  "recoveryProgress": 75,
  "deviationScore": -0.42
}
```

- `status`: `on-track` | `watch` | `off-track` | `completed`
- `recoveryProgress`: 경과일이 아니라 **증상 총합 감소율**로 계산 (`lib/recovery.ts#computeRecoveryProgress`)
- `deviationScore`: 양수 = 예상보다 빠른 회복

### 3.2 `GET /journeys/current/today`

Response `data`: `TodayScreenData` — `user`, `journey`, `protocol`, `currentPhase`, `careCard`, `todayCheckin`, `streak`, `activeAlert`, `wearable`, `environment`

`todayCheckin`이 `null`이면 프론트가 체크인 CTA를 노출한다.

### 3.3 `CareProtocol` — 종이 리포트를 대체하는 규칙 집합

```json
{
  "id": "protocol-lifting-001",
  "procedureName": "고강도 집속 초음파 리프팅 (300샷)",
  "totalRecoveryDays": 91,
  "downtimeDays": 3,
  "resultVisibleFromDay": 28,
  "phases": [
    { "key": "acute", "label": "급성 반응기", "startDay": 0, "endDay": 2, "summary": "...", "keyRisk": "..." }
  ],
  "expectedCurves": {
    "swelling": [0.0, 3.4, 2.6, "...(총 91개)"]
  },
  "restrictions": [
    {
      "id": "r-sauna",
      "label": "사우나 · 찜질방 · 반신욕",
      "icon": "Flame",
      "activeFromDay": 0,
      "activeUntilDay": 14,
      "severity": "critical",
      "reason": "..."
    }
  ],
  "recommendations": [{ "id": "c-cooling", "label": "...", "icon": "Snowflake", "activeFromDay": 0, "activeUntilDay": 3, "reason": "..." }],
  "clinicNote": "..."
}
```

- `expectedCurves[symptom]`은 길이 `totalRecoveryDays`의 배열, 값 범위 `0~4`
- `icon`은 프론트의 허용 목록(`components/ui/dynamic-icon.tsx`)에 있는 문자열만 사용. 미등록 값은 기본 아이콘으로 안전하게 처리된다
- 곡선 파라미터는 `lib/recovery.ts#buildExpectedCurve({ peak, onsetDay, halfLife })`로 생성한다. 서버는 같은 함수를 재현하거나 배열을 그대로 저장한다

### 3.4 `POST /checkins`

Request

```json
{
  "symptoms": { "swelling": 1, "redness": 1, "pain": 0, "peeling": 0, "tightness": 1 },
  "moodNote": "어제 회식이 있었어요",
  "photoUrl": null,
  "followedRestrictions": true,
  "durationSeconds": 26
}
```

Response `data`

```json
{
  "checkin": { "id": "checkin-12", "day": 12, "date": "2026-08-19", "...": "..." },
  "newAlert": null,
  "improved": ["swelling", "tightness"]
}
```

- `improved`: 어제 대비 값이 낮아진 증상 키 배열. 즉시 피드백에 쓰인다
- `durationSeconds`: 체크인 소요 시간. **30초 이내 완료율**이 이 서비스의 핵심 UX 지표라 반드시 저장한다

### 3.5 `RecoveryAlert` — 이탈 감지

서버는 체크인 저장 시 `lib/recovery.ts#detectDeviation`과 동일한 규칙으로 판정한다.

```json
{
  "id": "alert-008",
  "day": 8,
  "level": "watch",
  "title": "붓기가 예상보다 다시 올라왔어요",
  "detail": "...",
  "triggeredBy": [{ "symptom": "swelling", "expected": 0.6, "actual": 3 }],
  "recommendedAction": "...",
  "sharedWithClinic": false,
  "clinicResponse": null
}
```

판정 규칙

| 조건 | level |
| :-- | :-- |
| `actual - expected >= 1.2` | `watch` |
| 위 조건 + (`pain >= 3` 또는 편차 `>= 2`) | `urgent` |

`expected`는 웨어러블 보정(`computeRecoveryModifier`)을 적용한 값이다.

### 3.6 `POST /alerts/{id}/share` — 클리닉 리콜

- `user.clinicSharingConsent === false`이면 **403 `CONSENT_REQUIRED`**로 거절한다
- 공유되는 범위: 해당 알림의 `day`, `triggeredBy`, 최근 3일 체크인. 그 외 기록은 전송하지 않는다
- 클리닉 측 응답은 `clinicResponse`로 폴링/푸시된다

### 3.7 `GET /vitals`

```json
{
  "connected": true,
  "source": "apple-health",
  "wearables": [{ "date": "2026-08-19", "sleepHours": 8.1, "hrvMs": 60, "restingHr": 58, "steps": 7200, "sleepQuality": 89 }],
  "environments": [{ "date": "2026-08-19", "uvIndex": 8, "humidity": 36, "temperature": 32, "fineDust": "보통" }],
  "correlations": [{ "id": "corr-001", "signalLabel": "전날 수면 시간", "symptomLabel": "다음날 붓기", "coefficient": -0.72, "sampleDays": 13, "plainExplanation": "...", "disclaimer": "..." }]
}
```

- 웨어러블에서 읽는 항목은 **수면 · HRV · 안정시 심박 · 걸음 수로 한정**한다. 위치·상세 운동 로그는 수집하지 않는다
- `coefficient`는 서버가 피어슨 상관으로 재계산한다. 고정값을 내려보내지 않는다
- `sampleDays < 7`이면 프론트는 신뢰도가 낮음을 표기한다

---

## 4. 생성형 AI — 데일리 케어 카드

`DailyCareCard`의 생성 책임은 **분리되어 있다.**

| 필드 | 생성 주체 | 이유 |
| :-- | :-- | :-- |
| `headline`, `rationale` | LLM (Claude API) | 매일 다른 문장, 개인 맥락 반영 |
| `avoid`, `recommend` | 규칙 엔진 (`CareProtocol`) | 금기 목록을 LLM이 창작하면 의료 안전성이 깨진다 |
| `signalsUsed` | 규칙 엔진 | 카드가 무엇을 보고 쓰였는지 투명하게 노출 |

프롬프트는 `lib/careCard.ts#buildCareCardPrompt`가 생성한다. 서버는 이 문자열을 그대로 사용하고, 응답은 아래 JSON만 허용한다.

```json
{ "headline": "40자 이내", "rationale": "80자 이내" }
```

LLM 출력 검증 규칙 (서버 필수)

1. 진단명·질병명·확정 표현이 포함되면 폐기하고 로컬 폴백 문장을 쓴다
2. `avoid`/`recommend`에 해당하는 항목을 문장 안에서 새로 만들면 폐기한다
3. 생성 실패 시 `lib/careCard.ts#generateCareCard`의 로컬 생성기 결과를 그대로 사용한다 (서비스는 절대 빈 카드를 보여주지 않는다)

캐싱: 카드는 하루 1회(사용자 로컬 06:00 기준) 생성 후 `date + journeyId`로 캐싱한다. 재요청 시 재생성하지 않는다.

---

## 5. 민감정보 처리 (필수)

시술명 · 시술일 · 방문 병원 · 시술 사진은 개인정보보호법상 **건강에 관한 민감정보**다.

| 항목 | 요구사항 |
| :-- | :-- |
| 수집 | 온보딩에서 별도 동의 항목으로 분리 수집 |
| 저장 | 컬럼 단위 암호화, 별도 스키마 분리 |
| 클리닉 공유 | `clinicSharingConsent`가 `true`이고, 이탈이 감지된 알림에 한해서만 |
| 공유 범위 | 알림 1건 + 최근 3일 체크인. 전체 이력 전송 금지 |
| 철회 | 동의 철회 시 이후 공유 즉시 중단, 기 공유분은 클리닉 측에서 삭제 요청 API 호출 |
| 삭제 | `DELETE /users/me` 호출 시 사진·체크인·공유 이력까지 하드 딜리트, 30일 내 완료 |
| 내보내기 | `GET /users/me/export` — 전체 기록 JSON |

본 저장소의 `mock/` 데이터는 전부 임의 생성 더미이며 실제 고객 데이터를 포함하지 않는다.

---

## 6. 프론트 연동 체크리스트

- [ ] `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_USE_MOCK=false` 설정
- [ ] `services/client.ts#request`에 토큰 주입 로직 추가
- [ ] 서버가 `day`(D+N)를 계산해 내려주는지 확인
- [ ] `expectedCurves` 배열 길이 = `totalRecoveryDays` 검증
- [ ] `detectDeviation` 임계값을 서버와 동일하게 유지 (불일치 시 알림이 두 번 뜬다)
- [ ] 케어 카드 캐싱 키가 `journeyId + date`인지 확인

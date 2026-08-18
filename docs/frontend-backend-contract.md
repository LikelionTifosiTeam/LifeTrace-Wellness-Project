# DermaTrace AI Frontend-Backend API Contract Specification

본 문서는 **DermaTrace AI** 서비스의 프론트엔드와 백엔드 개발 팀 간의 RESTful API 인터페이스 협약을 정리한 상세 명세서입니다.

---

## 1. Global Standards & Protocols

- **Base URL**: `https://api.dermatrace.ai/v1`
- **Content-Type**: `application/json` (파일 업로드 시 `multipart/form-data`)
- **Authentication**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Date Format**: ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`)

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAM",
    "message": "요청한 날짜 형식이 올바르지 않습니다.",
    "details": [
      { "field": "date", "issue": "YYYY-MM-DD format required" }
    ]
  }
}
```

---

## 2. API Endpoint Matrix

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | 로그인 (이메일/비밀번호 or 소셜 토큰) |
| **Auth** | `POST` | `/api/auth/signup` | 회원가입 |
| **Profile** | `POST` | `/api/skin/profile` | 온보딩 피부 프로필 생성/수정 |
| **Dashboard** | `GET` | `/api/dashboard` | 메인 대시보드 종합 요약 정보 조회 |
| **Skin Log** | `GET` | `/api/skin/logs` | 피부 상태 일별 기록 조회 (트렌드 차트용) |
| **Skin Log** | `POST` | `/api/skin/logs` | 오늘 피부 상태 기록 등록 |
| **AI Analysis** | `POST` | `/api/skin/analyze` | AI 피부 분석 요청 (사진 + 설문) |
| **AI Analysis** | `GET` | `/api/skin/analysis/:id` | AI 분석 결과 상세 조회 |
| **Hospitals** | `GET` | `/api/hospitals` | 주변 피부과 의료기관 목록 및 필터 검색 |
| **Hospitals** | `GET` | `/api/hospitals/:id` | 의료기관 상세 정보 & 제공 시술 조회 |
| **Reservation** | `POST` | `/api/reservations` | 병원 진료/시술 예약 신청 |
| **Treatment** | `GET` | `/api/treatments` | 사용자 치료 및 피부과 방문 이력 목록 조회 |
| **Treatment** | `POST` | `/api/treatments` | 신규 치료 이력 등록 (Before/After 사진 포함) |
| **Insights** | `GET` | `/api/insights` | AI 패턴 분석 및 치료 연관성 그래프 데이터 조회 |

---

## 3. Detailed Request/Response Schema

### 3.1 `GET /api/dashboard`
**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "user-001", "name": "김민수", "email": "minsu@example.com" },
    "todaySkinStatus": { "score": 72, "statusText": "최근 기록 기준 안정적", "trendPercentage": 8 },
    "aiInsight": { "title": "...", "summary": "...", "actionText": "..." },
    "todayGuide": { "actionText": "...", "badgeText": "..." },
    "recentSkinTrend": [
      { "date": "08/05", "skinScore": 62, "acne": 55, "redness": 45 }
    ],
    "skinJourneyPreview": [
      { "id": "j1", "date": "08월 12일", "title": "피부 상태 기록", "concern": "여드름", "category": "피부 분석" }
    ],
    "recommendedHospitals": []
  }
}
```

### 3.2 `POST /api/skin/analyze` (Multipart Request)
**Headers:** `Content-Type: multipart/form-data`  
**Body Parameters:**
- `image`: Image Binary (JPEG/PNG, Max 10MB)
- `concerns`: Array string `["여드름", "붉은기"]`
- `severity`: Number (1~10)
- `duration`: String (`"1주 이내"`)
- `sleepHours`: Number
- `stressLevel`: Number

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis-12345",
    "mainConcern": "여드름",
    "mainConcernScore": 68,
    "detectedConcerns": [
      { "name": "여드름", "score": 68, "changePercentage": 18, "description": "..." }
    ],
    "changeDetection": { "period": "최근 14일", "acneChange": 18, "sleepChange": -21, "stressChange": 14 },
    "topFactors": [
      { "name": "수면시간", "relevance": "높음", "description": "..." }
    ],
    "recommendationGuide": "현재 입력된 정보에서는 트러블 관리 및 지속성 확인을 위해 전문 의료진 상담을 우선적으로 고려할 수 있습니다.",
    "disclaimer": "본 결과는 의료적 진단이 아닌 입력된 사진과 기록을 기반으로 한 참고 정보입니다."
  }
}
```

---

## 4. Frontend-Backend Responsibilities Boundary

- **Frontend Responsibility**:
  - Validations, Multi-step Wizard UI, Skeleton Loaders, Recharts integration, Medical Disclaimer banners, Client State.
- **Backend Responsibility**:
  - Database persistence, Authentication (JWT refresh tokens), Image AI analysis engine, Hospital dataset geo-querying, Reservation state machine.

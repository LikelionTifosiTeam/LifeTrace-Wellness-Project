Implementation Plan - DermaTrace AI Frontend MVP
DermaTrace AI는 사용자의 피부 상태, 생활 습관, 피부과 치료 이력을 통합 관리하고 AI 기반 인사이트와 병원 탐색 및 예약 연결까지 지원하는 개인화 피부 관리 웰니스 SaaS 플랫폼입니다.

이 계획서는 백엔드 팀과의 원활한 협업을 고려한 Service Layer & Mock Data 기반 독립 프론트엔드 아키텍처 구축 및 full MVP 개발 플로우를 서술합니다.

User Review Required
IMPORTANT

의료 안전성 및 표현 원칙 준수 DermaTrace AI는 의료진의 확정 진단을 대체하지 않습니다. 모든 AI 분석 결과 및 시술 정보 UI에는 <MedicalDisclaimer />가 명시되며, "진단/질병/필수 시술" 대신 "관련 가능성 있는 피부 고민", "의료진 상담 고려", "참고 정보" 등의 조율된 용어가 사용됩니다.

NOTE

독립적인 Frontend MVP & Service Layer 백엔드 API가 작성되기 전에도 프론트엔드 전체의 동적 렌더링, 상태 변경, 차트 시각화, 예약을 포함한 UX 흐름이 100% 작동하도록 Mock API Service Layer를 구현합니다. 추후 백엔드가 준비되면 Service Layer 내부의 fetch/axios 함수만 교체할 수 있습니다.

Proposed Architecture & Directory Structure
text

/
├── app/                        # Next.js App Router Pages
│   ├── (auth)/                 # Login / Signup / Onboarding
│   ├── (dashboard)/            # App Main Shell (Sidebar + Header + BottomNav)
│   │   ├── dashboard/          # Main Dashboard
│   │   ├── analysis/           # Skin Analysis & New Analysis & Result
│   │   ├── hospitals/          # Hospital Search, Detail, Reservation
│   │   ├── history/            # Treatment History Timeline & Detail
│   │   ├── skin/               # My Skin Profile & Trends
│   │   ├── insights/           # AI Insights & Relationship Graph
│   │   ├── profile/            # Profile & Data Management
│   │   └── settings/           # App Settings
│   ├── layout.tsx
│   └── page.tsx                # Landing Page
├── components/                 # Global Reusable Design System Components
│   ├── ui/                     # Base UI (Button, Card, Modal, Input, Badge, etc.)
│   ├── common/                 # Layout Shell, Navigation, MedicalDisclaimer
│   └── states/                 # Loading Skeleton, ErrorState, EmptyState
├── features/                   # Feature-Specific Visual & Interactive Components
│   ├── analysis/               # Photo Uploader, Progress Bar, AI WHY Card
│   ├── hospitals/              # Hospital Card, Filter Bar, Interactive Map Mock
│   ├── history/                # Timeline Node, Add Record Modal, Before/After View
│   ├── insights/               # Treatment Relationship Graph, Pattern Card
│   └── skin/                   # Skin Score Chart, Concern Breakdown
├── services/                   # API Service Layer Interfaces & Implementations
├── mock/                       # Rich Mock Dataset (Users, Logs, Hospitals, Insights)
├── types/                      # Complete TypeScript Type Definitions
├── docs/                       # Backend Integration Contract Document
└── lib/                        # Utility Functions & Formatters
Phased Implementation Plan
Phase 1: Project Setup & Base Architecture
Initialize Next.js project with TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, and Recharts.
Define global design system colors (Teal/Slate Primary, Bright Neutral background, Soft borders & shadows).
Create docs/frontend-backend-contract.md to define API endpoints, request/response DTOs, and error standards for backend team collaboration.
Phase 2: Core Data Types, Mock Data & Service Layer
Types (/types): User, SkinProfile, SkinLog, SkinAnalysis, Hospital, Reservation, TreatmentRecord, AIInsight, SkinPattern, TreatmentRelationship, DashboardData.
Mock Dataset (/mock): Realistic data for user 김민수 (24세), 14-day skin scores, 8+ hospitals, 6+ treatment records, 5+ AI insights, and graph nodes.
Service Layer (/services): Abstracted services with promise delays to simulate network requests with complete Loading/Error/Success states.
Phase 3: Design System & Global Layout Shell
Global CSS with typography hierarchy, soft cards, rounded-2xl buttons, and badges.
<MedicalDisclaimer /> reusable safety notice.
Layout Shell: Desktop Left Sidebar, Top Header with profile info, Mobile Bottom Navigation bar.
Phase 4: Public Landing & Authentication Flow
/ Landing Page: Hero with CTA, AI UI Mockup preview, 3 core value props (ANALYZE, GUIDE, LEARN), 5-step process, Timeline Preview, Safety guarantee, Footer.
/login & /signup: Clean auth card, social login mock, registration with skin concern selection.
/onboarding & /onboarding/skin-profile: 4-step interactive onboarding wizard (concerns, primary issue, history, goals).
Phase 5: Core Dashboard (/dashboard)
Hero Card with 72/100 skin score, stability tag, +8% trend.
AI Insight banner & One Action guide card.
Recharts 14-day interactive skin score & acne/redness trend chart.
Recent Skin Journey timeline preview.
Recommended nearby hospitals list & Quick Action tiles.
Phase 6: AI Skin Analysis Flow (/analysis, /analysis/new, /analysis/result)
/analysis: Overall metrics, recent insights, analysis history.
/analysis/new: 4-step wizard (Photo Drag&Drop/Camera upload preview, symptom & severity scale 1-10, life factors like sleep/stress, submission).
Visual 6-stage AI Analysis Loading progress animation.
/analysis/result: Detected concerns %, 14-day change trends, interactive AI WHY top factors modal, non-prescriptive AI guide, CTAs to Hospital Search & Save.
Phase 7: Hospital Search, Detail & Reservation (/hospitals, /hospitals/[id], /hospitals/[id]/reservation)
/hospitals: Search input, specialist/condition filter badges, Desktop split Map/List layout & Mobile list/map toggle. Hospital cards with ratings & availability.
/hospitals/[id]: Detailed view with specialist information, procedure cards (purpose, recovery, features), interactive map mockup, direct reservation trigger.
/hospitals/[id]/reservation: 6-step interactive reservation flow with date/time selection & confirmation toast.
Phase 8: Treatment History ("My Skin Journey") (/history, /history/[id])
Vertical timeline with filters (All, Consultation, Treatment, Analysis).
6-month summary category donut chart.
/history/[id]: Detail view featuring Before/After photo comparison, rating system, notes, and outcome feedback.
Modal dialog for adding new treatment records with instant timeline update.
Phase 9: My Skin Profile & AI Insights (/skin, /insights)
/skin: Skin profile card, 30/90/365-day score comparison, AI detected patterns (e.g. sleep vs acne correlation).
/insights: Interactive Treatment Relationship Graph (Acne → Inflammation Care → Redness → Pigmentation → Texture) with clickable node details & medical non-causality disclaimer.
Phase 10: Profile, Settings, Accessibility & Polish
/profile: User info, privacy settings, data export/delete actions.
/settings: Notification toggles, language, AI consent settings, logout.
Loading Skeletons, Error Retry fallbacks, Empty states across all features.
Full responsive optimization for Mobile (375px~430px), Tablet (768px+), Desktop (1440px).
Verification Plan
Automated Build & Syntax Verification
Run npm run build or npx tsc --noEmit to guarantee 0 TypeScript errors.
Ensure strict adherence to React rules, no missing imports, and no broken prop signatures.
Manual UX & Navigation Verification
Test all routing paths in browser: Landing → Login → Onboarding → Dashboard → New Analysis → Result → Hospital Search → Hospital Detail → Reservation → History → Add Record → Insights.
Verify clear Primary CTA on every main screen to eliminate user confusion ("그래서 뭘 해야 하지?").
Verify mobile responsiveness and bottom bar navigation tab switching.

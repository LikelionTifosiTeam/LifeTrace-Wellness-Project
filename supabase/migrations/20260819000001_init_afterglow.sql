-- ---------------------------------------------------------------------------
-- AfterGlow 초기 스키마
--
-- 시술명 · 시술일 · 클리닉 정보는 개인정보보호법상 '건강에 관한 민감정보'다.
-- 모든 테이블은 RLS를 켜고, 본인 행에만 접근 가능하도록 강제한다.
--
-- 클리닉(의료진) 계정은 예외적으로 아래 조건을 '모두' 만족할 때만 환자 기록을 본다.
--   1) 그 클리닉 소속으로 등록되어 있고 (clinic_members)
--   2) 환자가 공유에 동의했고 (profiles.clinic_sharing_consent)
--   3) 회복 곡선을 벗어나 공유된 알림에 한해서 (recovery_alerts.shared_with_clinic)
-- 평상시 기록은 의료진도 볼 수 없다.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------------

create type procedure_category as enum (
  '레이저', '리프팅', '주사', '필러', '스킨부스터', '필링', '재생관리'
);

create type journey_status as enum ('on-track', 'watch', 'off-track', 'completed');
create type alert_level as enum ('info', 'watch', 'urgent');
create type clinic_role as enum ('practitioner', 'admin');

-- ---------------------------------------------------------------------------
-- 클리닉 & 소속 의료진
-- ---------------------------------------------------------------------------

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.clinic_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  display_name text not null,
  role clinic_role not null default 'practitioner',
  created_at timestamptz not null default now()
);

create index clinic_members_clinic_idx on public.clinic_members (clinic_id);

-- 정책 안에서 clinic_members를 직접 조회하면 RLS 재귀가 생긴다.
-- security definer 함수로 한 번 감싸 재귀를 끊는다.
create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.clinic_members where user_id = auth.uid();
$$;

create or replace function public.is_clinic_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.clinic_members where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- 프로필 (auth.users 확장)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  birth_year int,
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  checkin_reminder_time time not null default '21:30',
  -- 기본값은 반드시 false. 동의는 명시적으로만 켜진다.
  clinic_sharing_consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 케어 프로토콜 (시술별 회복 규칙 — 공용 마스터 데이터)
-- ---------------------------------------------------------------------------

create table public.care_protocols (
  id text primary key,
  procedure_name text not null,
  category procedure_category not null,
  total_recovery_days int not null default 91,
  downtime_days int not null,
  result_visible_from_day int not null,
  clinic_note text not null default '',
  phases jsonb not null,
  expected_curves jsonb not null,
  restrictions jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.care_protocols.expected_curves is
  '증상키 -> 길이 total_recovery_days 의 number[] (0~4). lib/recovery.ts#buildExpectedCurve 와 동일 규칙';

-- ---------------------------------------------------------------------------
-- 회복 여정 (시술 1건 = 여정 1개)
-- ---------------------------------------------------------------------------

create table public.recovery_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  protocol_id text not null references public.care_protocols (id),
  procedure_name text not null,
  category procedure_category not null,
  clinic_id uuid references public.clinics (id),
  clinic_name text not null,
  practitioner_name text not null default '',
  procedure_date date not null,
  status journey_status not null default 'on-track',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index recovery_journeys_user_idx on public.recovery_journeys (user_id, procedure_date desc);
create index recovery_journeys_clinic_idx on public.recovery_journeys (clinic_id);

-- ---------------------------------------------------------------------------
-- 데일리 체크인
-- ---------------------------------------------------------------------------

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.recovery_journeys (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  day int not null check (day >= 0),
  swelling smallint not null check (swelling between 0 and 4),
  redness smallint not null check (redness between 0 and 4),
  pain smallint not null check (pain between 0 and 4),
  peeling smallint not null check (peeling between 0 and 4),
  tightness smallint not null check (tightness between 0 and 4),
  photo_path text,
  mood_note text,
  followed_restrictions boolean not null default true,
  -- 30초 이내 완료율이 이 서비스의 핵심 UX 지표다.
  duration_seconds int not null default 0,
  created_at timestamptz not null default now(),
  unique (journey_id, date)
);

create index daily_checkins_journey_idx on public.daily_checkins (journey_id, day);

-- ---------------------------------------------------------------------------
-- 데일리 컨디션 (수면 등) — 웹에서 사용자가 직접 입력한다
-- ---------------------------------------------------------------------------

create table public.daily_vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  sleep_hours numeric(4, 2) not null check (sleep_hours >= 0 and sleep_hours <= 24),
  -- 0~10 자가 보고. 웨어러블 없이도 회복 속도 보정이 가능하도록 설계한 축이다.
  stress_level smallint check (stress_level between 0 and 10),
  alcohol boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.environment_snapshots (
  date date not null,
  region text not null default 'seoul',
  uv_index smallint not null,
  humidity smallint not null,
  temperature smallint not null,
  fine_dust text not null,
  primary key (date, region)
);

-- ---------------------------------------------------------------------------
-- 데일리 케어 카드 (생성형 AI 결과 캐시)
-- ---------------------------------------------------------------------------

create table public.care_cards (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.recovery_journeys (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  day int not null,
  headline text not null,
  rationale text not null,
  avoid jsonb not null default '[]'::jsonb,
  recommend jsonb not null default '[]'::jsonb,
  signals_used jsonb not null default '[]'::jsonb,
  -- 'llm' | 'fallback'. 폴백 비율을 추적해 LLM 품질을 감시한다.
  generated_by text not null default 'fallback',
  generated_at timestamptz not null default now(),
  unique (journey_id, date)
);

-- ---------------------------------------------------------------------------
-- 이탈 알림 & 클리닉 리콜
-- ---------------------------------------------------------------------------

create table public.recovery_alerts (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.recovery_journeys (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  day int not null,
  level alert_level not null,
  title text not null,
  detail text not null,
  triggered_by jsonb not null default '[]'::jsonb,
  recommended_action text not null,
  -- 사용자가 명시적으로 공유하기 전에는 절대 true 가 될 수 없다 (아래 트리거로 강제).
  shared_with_clinic boolean not null default false,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  unique (journey_id, date)
);

create index recovery_alerts_shared_idx on public.recovery_alerts (shared_with_clinic, day desc);

create table public.clinic_responses (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null unique references public.recovery_alerts (id) on delete cascade,
  responder_id uuid references auth.users (id),
  practitioner_name text not null,
  message text not null,
  suggested_visit boolean not null default false,
  responded_at timestamptz not null default now()
);

-- 동의 없이 공유 플래그가 켜지는 것을 DB 레벨에서 막는다.
create or replace function public.enforce_sharing_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.shared_with_clinic and not coalesce(old.shared_with_clinic, false) then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.user_id and p.clinic_sharing_consent
    ) then
      raise exception 'CONSENT_REQUIRED: 클리닉 공유 동의가 없습니다.';
    end if;
    new.shared_at := now();
  end if;
  return new;
end;
$$;

create trigger recovery_alerts_consent_guard
  before insert or update on public.recovery_alerts
  for each row execute function public.enforce_sharing_consent();

-- ---------------------------------------------------------------------------
-- 완료된 여정 아카이브
-- ---------------------------------------------------------------------------

create table public.journey_archives (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null unique references public.recovery_journeys (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  completed_day int not null,
  satisfaction_score smallint check (satisfaction_score between 1 and 5),
  before_photo_path text,
  after_photo_path text,
  learned_insight text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.recovery_journeys     enable row level security;
alter table public.daily_checkins        enable row level security;
alter table public.daily_vitals          enable row level security;
alter table public.care_cards            enable row level security;
alter table public.recovery_alerts       enable row level security;
alter table public.clinic_responses      enable row level security;
alter table public.journey_archives      enable row level security;
alter table public.care_protocols        enable row level security;
alter table public.environment_snapshots enable row level security;
alter table public.clinics               enable row level security;
alter table public.clinic_members        enable row level security;

-- 본인 행만 접근
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own journeys" on public.recovery_journeys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own checkins" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own vitals" on public.daily_vitals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own care cards" on public.care_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own alerts" on public.recovery_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own archives" on public.journey_archives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "read own clinic responses" on public.clinic_responses
  for select using (
    exists (
      select 1 from public.recovery_alerts a
      where a.id = clinic_responses.alert_id and a.user_id = auth.uid()
    )
  );

-- 마스터 데이터는 로그인 사용자에게 읽기 전용
create policy "read protocols" on public.care_protocols
  for select to authenticated using (true);

create policy "read environments" on public.environment_snapshots
  for select to authenticated using (true);

create policy "read clinics" on public.clinics
  for select to authenticated using (true);

create policy "read own membership" on public.clinic_members
  for select using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 의료진 전용 정책 — 공유된 알림에 한정
-- ---------------------------------------------------------------------------

-- 공유된 알림만 본다. 미공유 알림은 의료진에게도 보이지 않는다.
create policy "clinic reads shared alerts" on public.recovery_alerts
  for select using (
    shared_with_clinic
    and public.is_clinic_staff()
    and exists (
      select 1 from public.recovery_journeys j
      where j.id = recovery_alerts.journey_id
        and j.clinic_id = public.current_clinic_id()
    )
  );

-- 알림이 걸린 여정의 기본 정보만 본다 (환자 이름/연락처는 포함되지 않는다).
create policy "clinic reads shared journeys" on public.recovery_journeys
  for select using (
    public.is_clinic_staff()
    and clinic_id = public.current_clinic_id()
    and exists (
      select 1 from public.recovery_alerts a
      where a.journey_id = recovery_journeys.id and a.shared_with_clinic
    )
  );

-- 공유된 알림 전후 3일 체크인만 본다. 전체 이력은 열리지 않는다.
create policy "clinic reads shared checkins" on public.daily_checkins
  for select using (
    public.is_clinic_staff()
    and exists (
      select 1
      from public.recovery_alerts a
      join public.recovery_journeys j on j.id = a.journey_id
      where a.journey_id = daily_checkins.journey_id
        and a.shared_with_clinic
        and j.clinic_id = public.current_clinic_id()
        and daily_checkins.day between a.day - 3 and a.day
    )
  );

-- 의료진은 공유된 알림에만 답변을 남긴다.
create policy "clinic writes responses" on public.clinic_responses
  for insert to authenticated
  with check (
    public.is_clinic_staff()
    and exists (
      select 1
      from public.recovery_alerts a
      join public.recovery_journeys j on j.id = a.journey_id
      where a.id = clinic_responses.alert_id
        and a.shared_with_clinic
        and j.clinic_id = public.current_clinic_id()
    )
  );

create policy "clinic reads responses" on public.clinic_responses
  for select using (
    public.is_clinic_staff()
    and exists (
      select 1
      from public.recovery_alerts a
      join public.recovery_journeys j on j.id = a.journey_id
      where a.id = clinic_responses.alert_id
        and j.clinic_id = public.current_clinic_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 회원가입 시 프로필 자동 생성
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 사진 저장소 (비공개 버킷 — 서명 URL로만 접근)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', false)
on conflict (id) do nothing;

create policy "own checkin photos"
  on storage.objects for all
  using (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'checkin-photos' and (storage.foldername(name))[1] = auth.uid()::text);

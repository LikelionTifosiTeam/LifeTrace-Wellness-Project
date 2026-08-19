-- ---------------------------------------------------------------------------
-- 함수 실행 권한 정리
--
-- Postgres는 함수 생성 시 PUBLIC에 EXECUTE를 기본 부여한다.
-- anon/authenticated만 revoke 하면 PUBLIC 경유로 여전히 실행 가능해 효과가 없다.
--
-- 다만 전부 회수할 수는 없다. RLS 정책 식은 '조회하는 사용자 권한'으로 평가되므로,
-- 정책 안에서 호출되는 헬퍼의 EXECUTE를 막으면 정책 자체가 실패한다.
-- 그래서 두 부류로 나눈다.
--
--   (1) 트리거 전용 · 운영 유틸리티 → PUBLIC 회수. 외부에서 호출될 이유가 없다.
--   (2) RLS 정책 헬퍼             → 호출 가능해야 한다. 대신 반환값이 호출자 자신의
--                                   소속이거나 boolean 판정뿐이라 유출 가치가 없다.
-- ---------------------------------------------------------------------------

-- (1) 외부 호출 차단
revoke execute on function public.handle_new_user()         from public, anon, authenticated;
revoke execute on function public.enforce_sharing_consent() from public, anon, authenticated;
revoke execute on function public.rebase_demo_data(int)     from public, anon, authenticated;
revoke execute on function public.seed_demo_environment()   from public, anon, authenticated;
revoke execute on function public.build_expected_curve(numeric, int, numeric, int)
                                                            from public, anon, authenticated;

-- (2) 정책 평가에 필요한 헬퍼는 유지한다. 회수하면 RLS가 통째로 실패한다.
comment on function public.current_clinic_id() is
  'RLS 정책 헬퍼. 호출자 본인의 소속 클리닉만 반환하므로 노출 위험이 없다. EXECUTE를 회수하면 정책이 실패한다.';
comment on function public.is_clinic_staff() is
  'RLS 정책 헬퍼. 호출자 본인이 의료진인지 여부만 반환한다.';
comment on function public.journey_clinic_id(uuid) is
  'RLS 정책 헬퍼. 정책 재귀를 끊기 위해 필요하다. 여정 UUID를 이미 아는 경우에만 clinic_id를 알 수 있다.';
comment on function public.journey_has_shared_alert(uuid) is
  'RLS 정책 헬퍼. 공유 알림 존재 여부(boolean)만 반환한다.';
comment on function public.checkin_in_shared_window(uuid, int) is
  'RLS 정책 헬퍼. 해당 일자가 공유 범위(알림 전후 3일)인지 여부만 반환한다.';
comment on function public.alert_clinic_id(uuid) is
  'RLS 정책 헬퍼. 알림 UUID를 이미 아는 경우에만 clinic_id를 알 수 있다.';
comment on function public.alert_is_shared(uuid) is
  'RLS 정책 헬퍼. 공유 여부(boolean)만 반환한다.';

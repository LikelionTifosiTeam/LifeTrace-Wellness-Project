-- ---------------------------------------------------------------------------
-- 시연 데이터 재정렬
--
-- 데모 시나리오는 "리프팅 D+12"를 전제로 문서·IR·영상 스크립트가 쓰여 있다.
-- 시술일이 고정 날짜라 하루 지날 때마다 D+13, D+14로 밀리므로,
-- 심사 직전에 아래를 한 번 실행해 시나리오를 원위치시킨다.
--
--   select public.rebase_demo_data();
--
-- 앱이 KST로 경과일을 계산하므로 여기서도 KST를 기준으로 맞춘다.
-- ---------------------------------------------------------------------------

/**
 * 환경 스냅샷 보충.
 *
 * 환경 데이터는 사용자 기록이 아니라 그날의 날씨 값이라 '이동'시킬 대상이 아니다.
 * (연속 날짜를 통째로 밀면 목적지가 기존 행과 전부 겹쳐 충돌한다.)
 * 여정 기간이 하루도 비지 않도록 채우는 방식이 맞다.
 */
create or replace function public.seed_demo_environment()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start date;
  v_days  int;
begin
  select procedure_date into v_start
    from public.recovery_journeys
   where completed_at is null
   order by procedure_date desc
   limit 1;

  if v_start is null then
    return '진행 중인 여정이 없습니다.';
  end if;

  v_days := greatest(((timezone('Asia/Seoul', now()))::date - v_start) + 1, 14);

  insert into public.environment_snapshots (date, region, uv_index, humidity, temperature, fine_dust)
  select v_start + g, 'seoul',
         (array[5,6,8,7,4,3,6,9,8,5,4,7,8,6])[(g % 14) + 1],
         (array[62,58,51,47,55,68,60,44,38,42,57,49,36,45])[(g % 14) + 1],
         (array[29,31,33,32,28,26,30,34,33,30,28,31,32,30])[(g % 14) + 1],
         (array['좋음','보통','보통','나쁨'])[(g % 4) + 1]
    from generate_series(0, v_days - 1) as g
  on conflict (date, region) do nothing;

  return format('%s일치 환경 데이터 확보 (%s ~ %s).', v_days, v_start, v_start + (v_days - 1));
end;
$$;

create or replace function public.rebase_demo_data(target_day int default 12)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_today   date := (timezone('Asia/Seoul', now()))::date;
  v_active  date;
  v_delta   int;
  r         record;
begin
  select id into v_user_id from public.profiles where email = 'demo@afterglow.kr';
  if v_user_id is null then
    return 'demo 계정을 찾을 수 없습니다.';
  end if;

  select procedure_date into v_active
    from public.recovery_journeys
   where user_id = v_user_id and completed_at is null
   order by procedure_date desc
   limit 1;

  if v_active is null then
    return '진행 중인 데모 여정이 없습니다.';
  end if;

  v_delta := (v_today - target_day) - v_active;

  if v_delta <> 0 then
    update public.recovery_journeys
       set procedure_date = procedure_date + v_delta
     where user_id = v_user_id;

    -- (journey_id, date) 유니크 제약 때문에 이동 방향에 맞춰 한 행씩 옮긴다.
    for r in select id from public.daily_checkins
              where user_id = v_user_id order by date desc
    loop
      if v_delta > 0 then
        update public.daily_checkins set date = date + v_delta where id = r.id;
      end if;
    end loop;

    for r in select id from public.daily_checkins
              where user_id = v_user_id order by date asc
    loop
      if v_delta < 0 then
        update public.daily_checkins set date = date + v_delta where id = r.id;
      end if;
    end loop;

    for r in select id from public.daily_vitals
              where user_id = v_user_id
              order by case when v_delta > 0 then date end desc,
                       case when v_delta < 0 then date end asc
    loop
      update public.daily_vitals set date = date + v_delta where id = r.id;
    end loop;

    update public.recovery_alerts
       set date = date + v_delta,
           shared_at = shared_at + make_interval(days => v_delta)
     where user_id = v_user_id;

    update public.clinic_responses
       set responded_at = responded_at + make_interval(days => v_delta)
     where alert_id in (select id from public.recovery_alerts where user_id = v_user_id);
  end if;

  perform public.seed_demo_environment();

  return format('오늘(KST %s) 기준 D+%s 로 맞췄습니다. (이동 %s일)', v_today, target_day, v_delta);
end;
$$;

-- 시연 데이터 관리용이므로 앱 사용자에게 노출하지 않는다.
revoke execute on function public.rebase_demo_data(int)   from anon, authenticated;
revoke execute on function public.seed_demo_environment() from anon, authenticated;

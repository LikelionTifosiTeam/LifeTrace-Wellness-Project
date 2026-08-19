import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bell,
  LineChart,
  Sparkle,
  Stethoscope,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { DemoEntryButton } from '@/components/common/DemoEntryButton';

const problems = [
  {
    title: '“이게 정상인가요?”',
    body: '시술 다음 날부터 가장 자주 하는 질문. 답을 아는 사람은 클리닉에 있고, 불안한 사람은 집에 있습니다.',
  },
  {
    title: '리포트는 조회만 가능합니다',
    body: '종이 대신 앱으로 받았지만 여전히 정지된 문서입니다. 오늘 내 상태에 맞춰 바뀌지 않습니다.',
  },
  {
    title: '금기는 첫날에만 안내됩니다',
    body: '“2주간 사우나 금지”를 12일째에 기억하는 사람은 없습니다. 그리고 언제 다시 해도 되는지는 아무도 알려주지 않습니다.',
  },
];

const features = [
  {
    icon: Timer,
    title: '하루 30초, 사진 없이',
    body: '붓기·붉은기·통증·각질·당김 5가지를 탭 한 번씩. 사진은 선택입니다. 매일 열게 만드는 유일한 방법은 가볍게 만드는 것입니다.',
  },
  {
    icon: LineChart,
    title: '내 회복이 곡선 안에 있는지',
    body: '같은 시술의 예상 회복 곡선 위에 내 기록을 겹칩니다. “정상인가요?”에 매일 답이 나옵니다.',
  },
  {
    icon: Sparkle,
    title: '매일 새로 쓰이는 케어 카드',
    body: '경과일 + 어제 기록 + 수면·HRV + 자외선·습도를 읽고 오늘 피할 것과 할 것을 생성합니다. 그리고 오늘 풀린 금기를 먼저 알려줍니다.',
  },
  {
    icon: Activity,
    title: '잠이 부족하면 회복 기준도 바뀝니다',
    body: '수면과 심박변이도로 회복 속도 기대치를 개인에 맞게 보정합니다. 피부·건강·일상이 한 곡선에서 만납니다.',
  },
  {
    icon: Bell,
    title: '벗어나면 먼저 알아챕니다',
    body: '곡선을 벗어난 날, 무엇이 얼마나 달랐는지 짚어줍니다. 불안을 키우지 않고 다음 행동을 제시합니다.',
  },
  {
    icon: Stethoscope,
    title: '필요할 때만 클리닉으로',
    body: '회원님이 켜둔 경우에만, 이탈이 감지된 기록이 시술받은 의료기관에 전달됩니다. 전화로 설명할 필요가 없습니다.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white">
              <Sparkle className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-tight">AfterGlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
            시술 전이 아니라, 시술 다음 날부터
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.15] mt-5">
            시술은 하루,
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              회복은 90일입니다
            </span>
          </h1>
          <p className="text-base text-slate-600 leading-relaxed mt-5 max-w-xl mx-auto">
            AfterGlow는 시술 다음 날부터 90일 동안 매일 30초 기록으로 회복을 함께 따라갑니다.
            정지된 리포트 대신, 오늘 내 상태에 맞춰 매일 다시 쓰이는 케어 플랜을 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/onboarding">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                내 시술 등록하고 시작하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <DemoEntryButton />
          </div>
        </section>

        {/* Problem */}
        <section className="bg-slate-50 border-y border-slate-200/70 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-center">
              시술 후 90일은 아무도 함께 있지 않습니다
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {problems.map((p) => (
                <div
                  key={p.title}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft"
                >
                  <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-extrabold tracking-tight text-center">
            매일 열게 되는 이유
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-5 rounded-2xl border border-slate-200/80 shadow-soft"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              오늘이 D+며칠인지부터 시작합니다
            </h2>
            <p className="text-sm text-white/70 mt-3 max-w-lg mx-auto leading-relaxed">
              시술명과 시술일만 등록하면 회복 곡선이 그려집니다. 첫 체크인까지 1분이면 충분합니다.
            </p>
            <Link href="/onboarding" className="inline-block mt-6">
              <Button size="lg" variant="secondary" className="gap-2">
                시작하기
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6">
            <MedicalDisclaimer />
          </div>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-6">
            본 서비스의 모든 데이터는 시연을 위해 임의로 생성된 더미 데이터입니다. 실제 고객의
            시술명·시술일·방문 병원 정보는 개인정보보호법상 민감정보로 별도의 동의와 보호 조치 아래
            처리됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

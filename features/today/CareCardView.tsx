'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Ban, Check, Sparkles } from 'lucide-react';
import { DailyCareCard, CardActionItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

const severityTone: Record<string, string> = {
  critical: 'border-red-200 bg-red-50/70',
  caution: 'border-amber-200 bg-amber-50/70',
  'ok-soon': 'border-slate-200 bg-slate-50',
};

const ActionRow: React.FC<{ item: CardActionItem; tone: 'avoid' | 'recommend' }> = ({
  item,
  tone,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors min-h-[48px]',
          tone === 'avoid'
            ? severityTone[item.severity ?? 'caution']
            : 'border-emerald-200 bg-emerald-50/60'
        )}
      >
        <DynamicIcon
          name={item.icon}
          className={cn(
            'w-4 h-4 shrink-0',
            tone === 'avoid' ? 'text-red-600' : 'text-emerald-700'
          )}
        />
        <span className="text-sm font-medium text-slate-800 flex-1">{item.label}</span>
        {tone === 'avoid' && item.severity === 'critical' && (
          <Badge variant="danger" className="shrink-0">
            꼭 피하기
          </Badge>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden text-xs text-slate-600 leading-relaxed px-3.5"
          >
            <span className="block pt-2 pb-1">{item.reason}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </li>
  );
};

export const CareCardView: React.FC<{ card: DailyCareCard }> = ({ card }) => {
  const [showSignals, setShowSignals] = useState(false);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-brand-600 to-accent-600 text-white">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          오늘의 케어 카드 · 매일 새로 생성됩니다
        </div>
        <h2 className="text-lg font-extrabold leading-snug tracking-tight">{card.headline}</h2>
        <p className="text-[13px] text-white/85 mt-2 leading-relaxed">{card.rationale}</p>

        <button
          type="button"
          onClick={() => setShowSignals((v) => !v)}
          aria-expanded={showSignals}
          className="mt-3 text-[11px] font-semibold text-white/90 underline underline-offset-4 decoration-white/40"
        >
          {showSignals ? '근거 접기' : `이 안내에 쓰인 신호 ${card.signalsUsed.length}개 보기`}
        </button>

        <AnimatePresence initial={false}>
          {showSignals && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden flex flex-wrap gap-1.5 mt-3"
            >
              {card.signalsUsed.map((s) => (
                <li
                  key={s.key}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-full border',
                    s.impact === '주의'
                      ? 'bg-amber-400/20 border-amber-200/50 text-amber-50'
                      : s.impact === '긍정'
                      ? 'bg-emerald-400/20 border-emerald-200/50 text-emerald-50'
                      : 'bg-white/10 border-white/20 text-white/80'
                  )}
                >
                  {s.label}
                </li>
              ))}
              {/* 문장을 무엇이 썼는지 숨기지 않는다. */}
              <li className="basis-full text-[11px] text-white/55 leading-relaxed mt-1">
                {card.generatedBy === 'llm'
                  ? '오늘의 문장은 Claude가 위 신호를 읽고 작성했고, 금기·권장 목록은 시술 프로토콜 규칙 엔진이 만들었습니다.'
                  : '오늘의 문장과 금기·권장 목록 모두 시술 프로토콜 규칙 엔진이 만들었습니다. LLM 키를 연결하면 문장만 Claude가 대신 씁니다.'}
              </li>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">
            <Ban className="w-3.5 h-3.5" />
            오늘 피할 것 ({card.avoid.length})
          </h3>
          <ul className="space-y-1.5">
            {card.avoid.map((item) => (
              <ActionRow key={item.id} item={item} tone="avoid" />
            ))}
          </ul>
        </section>

        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">
            <Check className="w-3.5 h-3.5" />
            오늘 하면 좋은 것 ({card.recommend.length})
          </h3>
          <ul className="space-y-1.5">
            {card.recommend.map((item) => (
              <ActionRow key={item.id} item={item} tone="recommend" />
            ))}
          </ul>
        </section>
      </div>
    </Card>
  );
};

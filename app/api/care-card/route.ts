import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropicApiKey, anthropicModel, hasAnthropicKey } from '@/lib/env';
import { buildCareCardPrompt, extractSignals, generateCareCard } from '@/lib/careCard';
import { getPhase } from '@/lib/recovery';
import { getProtocol } from '@/mock/protocols';
import { fallbackEnvironment } from '@/mock/reference';
import type { DailyCareCard } from '@/types';

export const runtime = 'nodejs';

interface CareCardRequest {
  journeyId: string;
  date: string;
  day: number;
  protocolId: string;
  yesterdayCheckin?: Parameters<typeof generateCareCard>[0]['yesterdayCheckin'];
  vitals?: Parameters<typeof generateCareCard>[0]['vitals'];
  environment?: Parameters<typeof generateCareCard>[0]['environment'];
}

/** LLM 출력에 진단성 표현이 섞이면 폐기한다. 안전 게이트는 서버에만 둔다. */
const BANNED = [
  '진단',
  '질병',
  '확진',
  '처방',
  '치료해',
  '병입니다',
  '감염입니다',
  '수술이 필요',
];

function isSafe(text: string): boolean {
  return !BANNED.some((word) => text.includes(word));
}

export async function POST(req: Request) {
  let body: CareCardRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAM', message: '잘못된 요청입니다.' } },
      { status: 422 }
    );
  }

  const protocol = getProtocol(body.protocolId);
  const day = Math.max(0, Number(body.day) || 0);
  const phase = getPhase(protocol, day);

  const input = {
    journeyId: body.journeyId ?? 'journey-unknown',
    date: body.date,
    day,
    protocol,
    phase,
    yesterdayCheckin: body.yesterdayCheckin ?? null,
    vitals: body.vitals ?? [],
    environment: body.environment ?? fallbackEnvironment(body.date),
  };

  // 금기·권장 목록과 신호는 항상 규칙 엔진이 만든다. LLM은 문장만 담당한다.
  const baseCard: DailyCareCard = generateCareCard(input);

  if (!hasAnthropicKey()) {
    // 목업 키 상태 — 로컬 생성기 결과를 그대로 쓴다. 데모는 항상 동작한다.
    return NextResponse.json({
      success: true,
      data: baseCard,
      meta: { generatedBy: 'fallback', reason: 'ANTHROPIC_API_KEY 미설정' },
    });
  }

  try {
    const client = new Anthropic({ apiKey: anthropicApiKey });
    const signals = extractSignals(input);

    const message = await client.messages.create({
      model: anthropicModel,
      max_tokens: 400,
      system:
        '당신은 미용 시술 후 회복을 돕는 케어 코치입니다. 의사가 아니며 진단하지 않습니다. 반드시 지정된 JSON만 출력하세요.',
      messages: [{ role: 'user', content: buildCareCardPrompt(input, signals) }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]) as { headline?: string; rationale?: string };
    const headline = (parsed.headline ?? '').trim();
    const rationale = (parsed.rationale ?? '').trim();

    if (!headline || !rationale || !isSafe(headline) || !isSafe(rationale)) {
      throw new Error('안전 검증 실패');
    }

    return NextResponse.json({
      success: true,
      data: { ...baseCard, headline, rationale },
      meta: { generatedBy: 'llm', model: anthropicModel },
    });
  } catch (error) {
    // LLM 실패는 사용자에게 노출하지 않는다. 빈 카드보다 폴백 문장이 낫다.
    return NextResponse.json({
      success: true,
      data: baseCard,
      meta: {
        generatedBy: 'fallback',
        reason: error instanceof Error ? error.message : 'unknown',
      },
    });
  }
}

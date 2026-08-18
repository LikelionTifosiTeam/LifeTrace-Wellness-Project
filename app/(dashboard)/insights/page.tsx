'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  GitCommit,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { MainShell } from '@/components/common/MainShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/states/Skeleton';
import { MedicalDisclaimer } from '@/components/common/MedicalDisclaimer';
import { AIInsight, TreatmentRelationshipData, RelationshipNode } from '@/types';
import { insightService } from '@/services/insight';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [graphData, setGraphData] = useState<TreatmentRelationshipData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<RelationshipNode | null>(null);

  useEffect(() => {
    Promise.all([
      insightService.getSkinInsights(),
      insightService.getTreatmentRelationship()
    ]).then(([insRes, graphRes]) => {
      setInsights(insRes);
      setGraphData(graphRes);
      setIsLoading(false);
    });
  }, []);

  return (
    <MainShell>
      <div className="space-y-8">
        {/* Hero */}
        <Card className="bg-gradient-to-r from-brand-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-float space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="brand" className="bg-white/10 text-white border-white/20">
              AI PERSONALIZED INSIGHTS
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            나의 피부를 AI가 다각도로 이해하고 있어요
          </h1>
          <p className="text-xs sm:text-sm text-brand-100/90 max-w-2xl font-medium leading-relaxed">
            축적된 피부 사진, 생활 패턴, 피부과 치료 기록을 통합하여 관찰된 데이터 패턴과 관리 시사점을 전달합니다.
          </p>
        </Card>

        {/* Treatment Relationship Visual Graph */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Treatment Relationship (치료 연관성 시각화)</h2>
            </div>
            <span className="text-xs text-slate-400">각 Node 클릭 시 상세 정보</span>
          </div>

          {isLoading || !graphData ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card className="p-6 bg-white border-slate-200 space-y-6">
              {/* Relationship Explanation Banner */}
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-900 font-semibold leading-relaxed">
                  &quot;{graphData.summaryExplanation}&quot;
                </p>
              </div>

              {/* Graph Flow Horizontal Nodes */}
              <div className="overflow-x-auto pb-4">
                <div className="flex items-center gap-4 min-w-[700px] justify-between">
                  {graphData.nodes.map((node, idx) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <React.Fragment key={node.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedNode(node)}
                          className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all w-44 shrink-0 ${
                            isSelected
                              ? 'border-brand-500 bg-brand-600 text-white shadow-md ring-2 ring-brand-400 scale-105'
                              : node.type === 'concern'
                              ? 'border-red-200 bg-red-50/50 hover:border-red-300'
                              : node.type === 'treatment'
                              ? 'border-brand-200 bg-brand-50/50 hover:border-brand-300'
                              : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={isSelected ? 'text-brand-100 font-bold' : 'text-slate-400 font-bold'}>
                              {node.date}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : node.type === 'concern'
                                  ? 'bg-red-100 text-red-700'
                                  : node.type === 'treatment'
                                  ? 'bg-brand-100 text-brand-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {node.type}
                            </span>
                          </div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {node.label}
                          </p>
                        </button>

                        {idx < graphData.nodes.length - 1 && (
                          <div className="flex items-center justify-center shrink-0">
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium">
                ⚠️ {graphData.disclaimer}
              </div>
            </Card>
          )}
        </div>

        {/* Personalized AI Insights List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">개인화 AI Insight 목록</h2>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((ins) => (
                <Card key={ins.id} hoverEffect className="p-6 bg-white border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <h3 className="text-base font-bold text-slate-900">{ins.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{ins.date} 감지</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{ins.summary}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {ins.factorList.map((f) => (
                      <span key={f} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        #{f}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-700">추천 실행 가이드: {ins.recommendedAction}</span>
                    <Button size="sm" variant="outline" className="text-xs font-bold gap-1">
                      <span>가이드 보기</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <MedicalDisclaimer />

        {/* Node Detail Modal */}
        <Modal
          isOpen={!!selectedNode}
          onClose={() => setSelectedNode(null)}
          title={selectedNode ? `Node: ${selectedNode.label}` : ''}
        >
          {selectedNode && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">발생 일시:</span>
                <span className="font-bold text-slate-900">{selectedNode.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">노드 구분:</span>
                <Badge variant="brand">{selectedNode.type}</Badge>
              </div>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                이 노드는 사용자가 작성한 피부 기록 및 치료 이력 데이터에서 탐색된 특정 이벤트 단계입니다.
              </p>
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setSelectedNode(null)} className="bg-slate-900 text-white font-bold">
                  닫기
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </MainShell>
  );
}

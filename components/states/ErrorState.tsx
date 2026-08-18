import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '데이터를 불러오지 못했습니다.',
  message = '네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-red-50/50 border border-red-100 text-center my-4">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="gap-2 bg-white">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>다시 시도</span>
        </Button>
      )}
    </div>
  );
};

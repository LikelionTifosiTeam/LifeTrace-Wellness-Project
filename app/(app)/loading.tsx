import React from 'react';
import { Skeleton } from '@/components/states/Skeleton';

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-14 border-b border-slate-200/70 bg-white" />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

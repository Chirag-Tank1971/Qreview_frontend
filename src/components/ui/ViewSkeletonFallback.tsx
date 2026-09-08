import React from 'react';
import { Loader2 } from 'lucide-react';

export const ViewSkeletonFallback: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* Top Banner Skeleton */}
      <div className="p-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md animate-pulse" />
        </div>
        <div className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>

      {/* Main Content Skeleton */}
      <div className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
        <div className="h-3 w-56 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
      </div>
    </div>
  );
};

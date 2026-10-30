import React from 'react';

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm animate-pulse flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
              <div className="h-3 w-16 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-full bg-slate-100 rounded mb-1" />
            <div className="h-4 w-2/3 bg-slate-100 rounded mb-4" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <div className="h-6 w-24 bg-slate-200 rounded" />
            <div className="h-6 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

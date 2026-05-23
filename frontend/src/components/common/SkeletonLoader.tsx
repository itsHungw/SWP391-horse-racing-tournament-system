export function SkeletonLoader() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-md w-1/3"></div>
      <div className="h-32 bg-slate-200 rounded-md w-full"></div>
      <div className="h-10 bg-slate-200 rounded-md w-1/4"></div>
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded w-full"></div>
        <div className="h-6 bg-slate-200 rounded w-5/6"></div>
        <div className="h-6 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}


export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-sm text-slate-400 font-medium">Loading Azentrix...</p>
    </div>
  );
};

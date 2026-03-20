export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-zinc-700" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-t-primary animate-spin" />
        </div>
        <p className="text-sm text-zinc-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

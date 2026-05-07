export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Halftone pulse ring */}
          <div className="absolute -inset-6 rounded-full border-2 border-vermillion-600/30 animate-ping" />
          {/* Solid border ring */}
          <div className="relative h-24 w-24 border-4 border-ink-900 bg-cream-100 flex items-center justify-center halftone-bg">
            <span className="font-jp text-4xl font-black text-vermillion-600 animate-pulse">
              読
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-jp text-vermillion-600 text-sm tracking-widest mb-1">
            読み込み中
          </p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-ink-700">
            Loading
          </p>
        </div>
      </div>
    </div>
  );
}

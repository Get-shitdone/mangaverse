export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-[3px] border-ink-900" />
          <div className="absolute inset-0 border-[3px] border-vermillion-600 animate-spin border-t-transparent" />
        </div>
        <p className="font-jp text-vermillion-600 text-sm tracking-widest">
          読み込み中…
        </p>
      </div>
    </div>
  );
}

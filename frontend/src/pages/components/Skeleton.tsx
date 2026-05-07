const base = "animate-pulse rounded bg-gray-200 dark:bg-zinc-800";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`${base} h-4 ${className}`} />;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`${base} ${className}`} />;
}

// Tek form input satırı (label + input çizgisi)
export function SkeletonField() {
  return (
    <div className="space-y-2">
      <SkeletonLine className="w-1/3 h-3" />
      <SkeletonLine className="w-full h-3 mt-1" />
    </div>
  );
}

// Tablo satırı — sütun sayısı verilebilir
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonLine className={i === 0 ? "w-24" : "w-full"} />
        </td>
      ))}
    </tr>
  );
}

// Öğretmen / hoca kartı
export function SkeletonTeacherCard() {
  return (
    <div className="border dark:border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonLine className="w-2/5 h-4" />
          <SkeletonLine className="w-1/3 h-3" />
        </div>
        <div className="flex gap-2 ml-4">
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
          <SkeletonBlock className="w-8 h-8 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-4">
        <SkeletonLine className="w-20 h-3" />
        <SkeletonLine className="w-20 h-3" />
      </div>
    </div>
  );
}

// İstatistik kartı (Dashboard)
export function SkeletonStatCard() {
  return (
    <div className="border dark:border-zinc-800 rounded-xl p-5 space-y-3">
      <SkeletonLine className="w-1/2 h-3" />
      <SkeletonLine className="w-1/3 h-7" />
    </div>
  );
}

// Form tercih listesi satırı
export function SkeletonPreferenceItem() {
  return (
    <div className="flex justify-between items-center border dark:border-zinc-800 p-2 rounded-md">
      <div className="flex gap-3 items-center flex-1">
        <SkeletonBlock className="w-4 h-4 rounded" />
        <SkeletonLine className="w-32 h-3" />
      </div>
      <div className="flex gap-1">
        <SkeletonBlock className="w-9 h-9 rounded-lg" />
        <SkeletonBlock className="w-9 h-9 rounded-lg" />
      </div>
    </div>
  );
}

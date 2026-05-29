interface Props {
  page: number;
  pageSize: number;
  count: number;
  total?: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, pageSize, count, total, onPrev, onNext }: Props) {
  const start = page * pageSize + 1;
  const end = page * pageSize + count;
  const hasPrev = page > 0;
  const hasNext = count === pageSize;

  if (count === 0 && !hasPrev) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-zinc-500">
      <span>
        {count === 0 ? "No results" : `Showing ${start}–${end}${total !== undefined ? ` of ${total}` : ""}`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 transition-colors"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-zinc-600">Page {page + 1}</span>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

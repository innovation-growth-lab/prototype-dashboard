import {Link2} from 'lucide-react';
import {Button} from '@/components/ui/button';

// Above the projects when the page was opened from a shared link
// (?shared=…&from=…): who shared how many links, and a way back to the whole
// dashboard. `from` is the sharer's name as the link gives it, or null.
export function SharedBanner({count, from, onShowAll}) {
  const links = count === 1 ? '1 link' : `${count} links`;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 rounded-xl border border-blue bg-blue-10 py-2 pr-2 pl-3">
      <span
        aria-hidden="true"
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-dark-blue text-sm font-bold text-white"
      >
        {from ? from[0].toUpperCase() : <Link2 className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[15px] font-bold text-dark-blue [overflow-wrap:anywhere]">
          {from
            ? `${from} shared ${links} with you.`
            : `${links} ${count === 1 ? 'was' : 'were'} shared with you.`}
        </p>
        <p className="text-[13px] text-ink-500">
          {count === 1 ? 'It’s' : 'They’re'} highlighted below.
        </p>
      </div>
      <Button variant="outline" onClick={onShowAll}>
        Show everything
      </Button>
    </div>
  );
}

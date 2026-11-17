import {cn} from 'cn';
import {domainOf, typeOf} from './types.jsx';

// A link's picture: its thumbnail, or without one the type's icon on its tint
// with the site's name. 16:10, like a laptop screen.
export function Thumb({type, src, url, latest, className, children}) {
  const t = typeOf(type);
  return (
    <div
      className={cn(
        'relative aspect-[16/10] overflow-hidden rounded-lg border border-line',
        t.tint,
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          className="block size-full object-cover object-top"
        />
      ) : (
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2.5',
            t.ink,
          )}
        >
          <t.Icon className="size-9" strokeWidth={1.5} aria-hidden="true" />
          {url && <span className="font-mono text-xs">{domainOf(url)}</span>}
        </div>
      )}
      {latest && (
        <span className="absolute top-2.5 left-2.5 rounded-[4px] bg-yellow px-2 py-[3px] font-mono text-[11px] leading-tight tracking-[0.08em] text-dark-blue uppercase">
          Latest
        </span>
      )}
      {children}
    </div>
  );
}

// Where a link's thumbnail is served from.
export function thumbSrc(thumb) {
  return thumb ? `${import.meta.env.BASE_URL}${thumb}` : null;
}

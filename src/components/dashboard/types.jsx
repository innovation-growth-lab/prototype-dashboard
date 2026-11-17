import {cn} from 'cn';
import {Frame, Globe, Link2, MonitorPlay, StickyNote} from 'lucide-react';

// Each kind of link: its label, a generic icon (never a product's logo), and
// the tint and ink it's drawn in (tokens in src/index.css). Full class names,
// so Tailwind finds them.
export const TYPES = {
  live: {
    label: 'Live prototype',
    Icon: Globe,
    tint: 'bg-type-live-tint',
    ink: 'text-type-live',
  },
  'figma-design': {
    label: 'Figma design',
    Icon: Frame,
    tint: 'bg-type-design-tint',
    ink: 'text-type-design',
  },
  'figma-proto': {
    label: 'Figma prototype',
    Icon: MonitorPlay,
    tint: 'bg-type-proto-tint',
    ink: 'text-type-proto',
  },
  miro: {
    label: 'Miro board',
    Icon: StickyNote,
    tint: 'bg-type-miro-tint',
    ink: 'text-type-miro',
  },
  other: {
    label: 'Other',
    Icon: Link2,
    tint: 'bg-type-other-tint',
    ink: 'text-type-other',
  },
};

export const typeOf = (key) => TYPES[key] ?? TYPES.other;

// The small tinted square with the type's icon, beside a title.
export function TypeChip({type, className}) {
  const t = typeOf(type);
  return (
    <span
      className={cn(
        'inline-flex size-6 flex-none items-center justify-center rounded-md',
        t.tint,
        t.ink,
        className,
      )}
    >
      <t.Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

// What to call a link to a screen-reader user, as on its edit button: its
// title, or without one its type and project ("Figma design in IRM").
export function linkLabel(link, project) {
  return link.title || `${typeOf(link.type).label} in ${project.name}`;
}

// "figma.com" from a link, for the placeholder where there's no thumbnail.
export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

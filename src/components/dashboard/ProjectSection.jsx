import {cn} from 'cn';
import {ChevronDown, GripVertical, Pencil, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {formatDate} from '../../lib/dashboard.js';
import {MoveMenu} from './MoveMenu.jsx';
import {Thumb, thumbSrc} from './Thumb.jsx';
import {linkLabel, TypeChip, typeOf} from './types.jsx';

// A small button on a card's thumbnail.
const OVERLAY_BUTTON =
  'border-line bg-white text-dark-blue shadow-[0_1px_2px_rgb(9_38_64/0.08)] not-disabled:hover:bg-surface aria-expanded:bg-surface';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// One project: its heading, then its links as a grid of cards. `editor` is
// null on the live site, which is read-only; under `npm run dev` it carries
// the edit actions and the drag-and-drop state (src/pages/Dashboard.jsx).
export function ProjectSection({
  project,
  index,
  count,
  collapsed,
  onToggle,
  editor: editorProp,
}) {
  // Checked here as well, so the build leaves the editing parts out.
  const editor = import.meta.env.DEV ? editorProp : null;
  const headingId = `project-${project.id}`;
  const dnd = editor?.dnd;
  const draggingThis =
    dnd?.drag?.kind === 'project' && dnd.drag.id === project.id;
  const overThis = dnd?.over?.kind === 'project' && dnd.over.id === project.id;
  const overEnd = dnd?.over?.kind === 'end' && dnd.over.id === project.id;
  const cardDrag = dnd?.drag?.kind === 'card';

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'relative flex flex-col gap-4',
        draggingThis && 'opacity-45',
      )}
      {...(editor && dnd.projectTarget(project.id))}
    >
      {overThis && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 h-[3px] rounded-full bg-blue',
            dnd.over.after ? '-bottom-5' : '-top-5',
          )}
        />
      )}
      <div
        className={cn(
          'group/heading -ml-2 flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg pl-1',
          overEnd &&
            collapsed &&
            'bg-blue-10 outline-2 outline-blue outline-dashed',
        )}
        {...(editor && dnd.endTarget(project.id))}
      >
        {editor && (
          <span
            draggable
            onDragStart={(e) => dnd.start(e, 'project', project.id)}
            onDragEnd={dnd.end}
            title="Drag to reorder"
            aria-hidden="true"
            className="-mr-1 inline-flex h-10 w-8 cursor-grab items-center justify-center rounded-lg text-grey-500 hover:bg-hover hover:text-dark-blue active:cursor-grabbing"
          >
            <GripVertical className="size-[18px]" />
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`${headingId}-links`}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${project.name}`}
          className="text-ink-500 aria-expanded:bg-transparent not-disabled:hover:bg-hover"
        >
          <ChevronDown
            className={cn(
              'size-5 transition-transform',
              collapsed && '-rotate-90',
            )}
          />
        </Button>
        <div className="flex items-end gap-2 mr-1">
          <h2 id={headingId} className="text-[22px] leading-tight">
            {project.name}
          </h2>
          {!collapsed && project.description && (
            // Beside the project's name; hidden with its links when collapsed.
            <p className="ml-2 mb-0.5 text-[15px] text-ink-500">
              {project.description}
            </p>
          )}
          <span className="pl-1 mb-0.5 font-mono text-xs tracking-label text-ink-500 uppercase">
            {plural(project.links.length, 'link')}
          </span>
        </div>
        {editor && (
          // The keyboard's way to reorder projects, shown on hover and focus.
          <div className="opacity-0 transition-opacity group-hover/heading:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100">
            <MoveMenu
              label={`Move project ${project.name}`}
              className="text-ink-500"
              moves={[
                {
                  label: 'Move project up',
                  disabled: index === 0,
                  onSelect: () => editor.shiftProject(project.id, -1),
                },
                {
                  label: 'Move project down',
                  disabled: index === count - 1,
                  onSelect: () => editor.shiftProject(project.id, 1),
                },
              ]}
            />
          </div>
        )}
        <div className="flex-[1_1_24px]" />
        {editor && (
          <div className="flex items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => editor.editProject(project)}
              aria-label={`Edit project ${project.name}`}
            >
              <Pencil /> Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => editor.addLink(project.id)}
            >
              <Plus /> Add link
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div
          id={`${headingId}-links`}
          className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-x-6 gap-y-8"
        >
          {project.links.map((link, i) => (
            <LinkCard
              key={link.id}
              link={link}
              project={project}
              index={i}
              editor={editor}
            />
          ))}
          {editor && (
            <button
              type="button"
              onClick={() => editor.addLink(project.id)}
              {...dnd.endTarget(project.id)}
              className={cn(
                'flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-lg p-4 text-sm font-semibold transition-colors',
                overEnd
                  ? 'border-2 border-blue border-dashed bg-blue-10 text-blue'
                  : 'border-[1.5px] border-grey-300 border-dashed text-ink-500 hover:border-blue-60 hover:bg-surface hover:text-blue',
              )}
            >
              <Plus
                className="size-[22px]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {cardDrag ? 'Drop here' : 'Add link'}
            </button>
          )}
          {!editor && project.links.length === 0 && (
            <p className="text-ink-500">No links yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

// A link: its picture, then its title (or, without one, its type) and date.
function LinkCard({link, project, index, editor: editorProp}) {
  const editor = import.meta.env.DEV ? editorProp : null;
  const t = typeOf(link.type);
  const dnd = editor?.dnd;
  const dragging = dnd?.drag?.kind === 'card' && dnd.drag.id === link.id;
  const over = dnd?.over?.kind === 'card' && dnd.over.id === link.id;
  const label = linkLabel(link, project);
  return (
    <div
      className={cn(
        'group/card relative flex min-w-0 flex-col rounded-lg',
        dragging && 'opacity-40',
        over && 'outline-2 outline-offset-[6px] outline-blue outline-dashed',
      )}
      {...(editor && {
        draggable: true,
        onDragStart: (e) => dnd.start(e, 'card', link.id),
        onDragEnd: dnd.end,
        ...dnd.cardTarget(project.id, link.id),
      })}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        draggable={editor ? false : undefined}
        className="flex flex-col gap-3 rounded-lg text-inherit no-underline"
      >
        <Thumb
          type={link.type}
          src={thumbSrc(link.thumb)}
          url={link.url}
          latest={link.latest}
          className="transition-colors group-hover/card:border-blue-60"
        />
        <div className="flex min-w-0 items-start gap-2.5">
          <TypeChip type={link.type} />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] leading-snug font-bold text-dark-blue [overflow-wrap:anywhere] group-hover/card:text-blue">
              {link.title || t.label}
              <span className="sr-only">
                {link.title ? '' : `, ${project.name}`} (opens in a new tab)
              </span>
            </span>
            <span className="text-[13px] leading-snug text-ink-500">
              {link.title ? `${t.label} · ` : ''}
              {formatDate(link.updated)}
            </span>
          </span>
        </div>
      </a>
      {editor && (
        // On the thumbnail's corner, shown on hover, on keyboard focus, and
        // while the move menu is open.
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          <MoveMenu
            label={`Move ${label}`}
            moves={[
              {
                label: 'Move earlier',
                disabled: index === 0,
                onSelect: () => editor.shiftLink(link.id, -1),
              },
              {
                label: 'Move later',
                disabled: index === project.links.length - 1,
                onSelect: () => editor.shiftLink(link.id, 1),
              },
            ]}
            targets={editor.projects.filter((p) => p.id !== project.id)}
            onMoveTo={(projectId) => editor.moveLinkTo(link.id, projectId)}
            className={OVERLAY_BUTTON}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.editLink(link, project.id)}
            aria-label={`Edit ${label}`}
            className={OVERLAY_BUTTON}
          >
            <Pencil />
          </Button>
        </div>
      )}
    </div>
  );
}

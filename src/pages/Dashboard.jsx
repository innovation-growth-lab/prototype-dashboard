import {Plus} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {LinkDialog} from '@/components/dashboard/LinkDialog.jsx';
import {ProjectDialog} from '@/components/dashboard/ProjectDialog.jsx';
import {ProjectSection} from '@/components/dashboard/ProjectSection.jsx';
import {Button} from '@/components/ui/button';
import {Container} from '@/components/ui/container';
import {Dialog} from '@/components/ui/dialog';
import {Eyebrow} from '@/components/ui/eyebrow';
import {pageTitle} from '../config.js';
import initial from '../data/dashboard.json';
import {
  moveLink,
  moveProject,
  shiftLink,
  shiftProject,
} from '../lib/dashboard.js';
import {saveDashboard} from '../lib/editor-api.js';

// Editing exists only under `npm run dev`, where the dev server can write
// src/data/dashboard.json (scripts/dashboard-editor.js). The built site is
// read-only, and the build leaves the editing code out of what it runs.
const EDITABLE = import.meta.env.DEV;

const COLLAPSED_KEY = 'prototype-dashboard-collapsed-v1';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function Dashboard() {
  // The file as it was built. In dev, saving it from the page doesn't reload
  // the page unless an image changed (scripts/dashboard-editor.js); editing it
  // by hand does.
  const [data, setData] = useState(initial);

  const [collapsed, toggle] = useCollapsed();
  const editor = useEditor(data, setData);
  const links = data.projects.reduce((n, p) => n + p.links.length, 0);
  const empty = data.projects.length === 0;

  return (
    <>
      <title>{pageTitle()}</title>
      <Container className="flex flex-col gap-10 pt-10 pb-14 text-ink-700">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Eyebrow className="flex items-center gap-2 font-mono font-medium tracking-[0.08em] text-ink-500">
              <span aria-hidden="true" className="size-2.5 bg-yellow" />
              Innovation Growth Lab
            </Eyebrow>
            <h1 className="text-[32px] leading-tight">Prototype dashboard</h1>
            <p className="text-[15px] text-ink-500">
              {plural(data.projects.length, 'project')} ·{' '}
              {plural(links, 'link')} · A listing of live demos, prototypes,
              designs, and other prototype related resources.
            </p>
          </div>
          {EDITABLE && !empty && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={editor.newProject}>
                <Plus /> New project
              </Button>
              <Button onClick={() => editor.addLink(null)}>
                <Plus /> Add link
              </Button>
            </div>
          )}
        </header>

        {editor.error && (
          <p
            role="alert"
            className="rounded-lg bg-danger-tint px-3 py-2.5 text-sm font-semibold text-danger"
          >
            Not saved: {editor.error}
          </p>
        )}

        <div className="flex flex-col gap-10">
          {data.projects.map((project, i) => (
            <ProjectSection
              key={project.id}
              project={project}
              index={i}
              count={data.projects.length}
              collapsed={collapsed.has(project.id)}
              onToggle={() => toggle(project.id)}
              editor={EDITABLE ? editor : null}
            />
          ))}
          {empty && <EmptyState onCreate={EDITABLE && editor.newProject} />}
        </div>
      </Container>

      {EDITABLE && (
        <Dialog
          open={editor.dialogOpen}
          onOpenChange={(open) => !open && editor.closeDialog()}
        >
          {editor.dialog?.kind === 'link' && (
            <LinkDialog
              key={editor.dialog.key}
              link={editor.dialog.link}
              projectId={editor.dialog.projectId}
              data={data}
              commit={editor.commit}
              onDone={editor.closeDialog}
            />
          )}
          {editor.dialog?.kind === 'project' && (
            <ProjectDialog
              key={editor.dialog.key}
              project={editor.dialog.project}
              data={data}
              commit={editor.commit}
              onDone={editor.closeDialog}
            />
          )}
        </Dialog>
      )}
    </>
  );
}

function EmptyState({onCreate}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[10px] border-[1.5px] border-grey-300 border-dashed p-8">
      <h2 className="text-xl">No projects yet</h2>
      <p className="max-w-[60ch] text-[15px] text-ink-500">
        {onCreate
          ? 'Start a project, then add its live prototype, Figma and Miro links.'
          : 'Prototypes will appear here once they’re added.'}
      </p>
      {onCreate && <Button onClick={onCreate}>New project</Button>}
    </div>
  );
}

// Which projects this visitor has collapsed: theirs alone, kept in their
// browser. Read after hydration, as the prerendered page shows all open.
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]');
      if (Array.isArray(saved)) setCollapsed(new Set(saved));
    } catch {}
  }, []);
  function toggle(id) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }
  return [collapsed, toggle];
}

// Everything the editor does: saving, the dialogs, moves and drag and drop.
// Its functions are only called under `npm run dev`.
function useEditor(data, setData) {
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Link id → when its thumbnail last changed, to get past the image cache.
  // What's being dragged, {kind: 'card'|'project', id}: in a ref for the drop
  // handlers, which can run before React re-renders, and in state for the
  // look of the card or project being moved.
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null); // {kind: 'card'|'end'|'project', id, after}

  // Shows the change at once, then writes it. If the write fails, the page
  // goes back to what's on disk and the error is thrown on to the caller.
  async function commit(next) {
    // Never on the live site; this also lets the build drop the save code.
    if (!EDITABLE) return;
    const before = data;
    setData(next);
    setError(null);
    try {
      await saveDashboard(next);
    } catch (e) {
      setData(before);
      throw e;
    }
  }
  // For moves, which have no dialog to show an error in.
  const commitQuietly = (next) =>
    next !== data && commit(next).catch((e) => setError(e.message));

  const open = (d) => {
    setDialog({...d, key: Date.now()});
    setDialogOpen(true);
  };
  const closeDialog = () => setDialogOpen(false);

  // Which project ends up after `targetId` when `id` is dropped on it: moving
  // down, it goes after the target; moving up, before.
  const indexOf = (id) => data.projects.findIndex((p) => p.id === id);

  const dnd = {
    drag,
    over,
    start(e, kind, id) {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      dragRef.current = {kind, id};
      // After the browser has taken its picture of what's being dragged.
      setTimeout(() => setDrag(dragRef.current), 0);
    },
    end() {
      dragRef.current = null;
      setDrag(null);
      setOver(null);
    },
    point(next) {
      if (
        over?.kind !== next.kind ||
        over?.id !== next.id ||
        over?.after !== next.after
      ) {
        setOver(next);
      }
    },
    projectTarget(projectId) {
      return {
        onDragOver(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'project' || drag.id === projectId) return;
          e.preventDefault();
          dnd.point({
            kind: 'project',
            id: projectId,
            after: indexOf(drag.id) < indexOf(projectId),
          });
        },
        onDrop(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'project') return;
          e.preventDefault();
          const after = indexOf(drag.id) < indexOf(projectId);
          const before = after
            ? (data.projects[indexOf(projectId) + 1]?.id ?? null)
            : projectId;
          commitQuietly(moveProject(data, drag.id, before));
          dnd.end();
        },
      };
    },
    // A project's heading and its last tile: dropping a card there puts it
    // at the end of that project.
    endTarget(projectId) {
      return {
        onDragOver(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'card') return;
          e.preventDefault();
          e.stopPropagation();
          dnd.point({kind: 'end', id: projectId});
        },
        onDrop(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'card') return;
          e.preventDefault();
          e.stopPropagation();
          commitQuietly(moveLink(data, drag.id, projectId, null));
          dnd.end();
        },
      };
    },
    // Dropping a card on another puts it in that card's place.
    cardTarget(projectId, linkId) {
      return {
        onDragOver(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'card' || drag.id === linkId) return;
          e.preventDefault();
          e.stopPropagation();
          dnd.point({kind: 'card', id: linkId});
        },
        onDrop(e) {
          const drag = dragRef.current;
          if (drag?.kind !== 'card') return;
          e.preventDefault();
          e.stopPropagation();
          const links = data.projects.find((p) => p.id === projectId).links;
          const from = links.findIndex((l) => l.id === drag.id);
          const to = links.findIndex((l) => l.id === linkId);
          // Later in the same project: it takes the target's place by going
          // after it.
          const before =
            from > -1 && from < to ? (links[to + 1]?.id ?? null) : linkId;
          commitQuietly(moveLink(data, drag.id, projectId, before));
          dnd.end();
        },
      };
    },
  };

  return {
    error,
    commit,
    dnd,
    dialog,
    dialogOpen,
    projects: data.projects.map((p) => ({id: p.id, name: p.name})),
    closeDialog,
    newProject: () => open({kind: 'project', project: null}),
    editProject: (project) => open({kind: 'project', project}),
    addLink: (projectId) =>
      open({
        kind: 'link',
        link: null,
        projectId: projectId ?? data.projects[0]?.id ?? '',
      }),
    editLink: (link, projectId) => open({kind: 'link', link, projectId}),
    shiftLink: (id, delta) => commitQuietly(shiftLink(data, id, delta)),
    shiftProject: (id, delta) => commitQuietly(shiftProject(data, id, delta)),
    moveLinkTo: (id, projectId) =>
      commitQuietly(moveLink(data, id, projectId, null)),
  };
}

// The dashboard's data: its shape, the rules it keeps, and the edits made to
// it. Plain JavaScript with no browser or Vite in it, so the page and the dev
// server's save middleware (scripts/dashboard-editor.js) share one copy of the
// rules. Every edit returns a new object and leaves the old one alone.
//
//   {projects: [{id, name, description?,
//                links: [{id, type, title?, url, updated, latest, thumb?}]}]}
//
// A project's description is optional, a line or two under its name. A link's
// title is optional too: without one, the dashboard names it by its type
// ("Figma design").

export const LINK_TYPES = [
  'live',
  'figma-design',
  'figma-proto',
  'miro',
  'other',
];

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const THUMB_PATTERN =
  /^thumbs\/([a-z0-9][a-z0-9-]{0,63})\.(png|jpg|webp|gif)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Checks a whole dashboard and returns it with every key in a fixed order, so
// the saved file's diffs show only what changed. Throws an Error saying what's
// wrong, in words the editor can show.
export function validateDashboard(data) {
  if (!data || !Array.isArray(data.projects)) {
    throw new Error('The data needs a list of projects.');
  }
  const projectIds = new Set();
  const linkIds = new Set();
  const projects = data.projects.map((p, i) => {
    const where = `Project ${i + 1}`;
    if (!p || typeof p !== 'object') throw new Error(`${where} isn't valid.`);
    if (!ID_PATTERN.test(p.id ?? '')) {
      throw new Error(`${where} has a bad id: "${p.id}".`);
    }
    if (projectIds.has(p.id))
      throw new Error(`Two projects have the id "${p.id}".`);
    projectIds.add(p.id);
    const name = typeof p.name === 'string' ? p.name.trim() : '';
    if (!name) throw new Error(`${where} needs a name.`);
    if (p.description !== undefined && typeof p.description !== 'string') {
      throw new Error(`"${name}" has a description that isn't text.`);
    }
    const description = p.description?.trim() ?? '';
    if (!Array.isArray(p.links))
      throw new Error(`"${name}" needs a list of links.`);
    const latestTypes = new Set();
    const links = p.links.map((l, j) => {
      const at = `Link ${j + 1} in "${name}"`;
      if (!l || typeof l !== 'object') throw new Error(`${at} isn't valid.`);
      if (!ID_PATTERN.test(l.id ?? ''))
        throw new Error(`${at} has a bad id: "${l.id}".`);
      if (linkIds.has(l.id))
        throw new Error(`Two links have the id "${l.id}".`);
      linkIds.add(l.id);
      if (!LINK_TYPES.includes(l.type))
        throw new Error(`${at} has an unknown type: "${l.type}".`);
      if (l.title !== undefined && typeof l.title !== 'string') {
        throw new Error(`${at} has a title that isn't text.`);
      }
      const title = l.title?.trim() ?? '';
      // For error messages: the title, or failing that its place.
      const what = title ? `"${title}"` : at;
      if (!isWebUrl(l.url))
        throw new Error(
          `${what} needs a web address starting https:// or http://.`,
        );
      if (
        !DATE_PATTERN.test(l.updated ?? '') ||
        Number.isNaN(Date.parse(l.updated))
      ) {
        throw new Error(`${what} needs a date (YYYY-MM-DD).`);
      }
      if (typeof l.latest !== 'boolean')
        throw new Error(`${what}: latest must be true or false.`);
      if (l.latest) {
        if (latestTypes.has(l.type)) {
          throw new Error(`"${name}" has two latest links of the same type.`);
        }
        latestTypes.add(l.type);
      }
      if (l.thumb !== undefined) {
        const m = THUMB_PATTERN.exec(l.thumb);
        if (!m || m[1] !== l.id) {
          throw new Error(`${what} has a bad thumbnail path: "${l.thumb}".`);
        }
      }
      const link = {id: l.id, type: l.type};
      if (title) link.title = title;
      Object.assign(link, {
        url: l.url.trim(),
        updated: l.updated,
        latest: l.latest,
      });
      if (l.thumb) link.thumb = l.thumb;
      return link;
    });
    return description
      ? {id: p.id, name, description, links}
      : {id: p.id, name, links};
  });
  return {projects};
}

export function isWebUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

// Every thumbnail path the data refers to.
export function thumbsIn(data) {
  return new Set(
    data.projects.flatMap((p) => p.links.map((l) => l.thumb).filter(Boolean)),
  );
}

export function slugify(text) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48)
      .replace(/-+$/, '') || 'item'
  );
}

// An id made from `text` that isn't in `taken`: "irm", then "irm-2" …
function freeId(text, taken) {
  const base = slugify(text);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export function newProjectId(data, name) {
  return freeId(name, new Set(data.projects.map((p) => p.id)));
}

// A new link's id is its project's plus its title, or its type when it has
// none: "irm-figma-design". "irm-irm-prototype" reads badly, so a title that
// already starts with the project id isn't prefixed.
export function newLinkId(data, projectId, title) {
  const slug = slugify(title);
  const text =
    slug.startsWith(`${projectId}-`) || slug === projectId
      ? slug
      : `${projectId}-${slug}`;
  return freeId(
    text,
    new Set(data.projects.flatMap((p) => p.links.map((l) => l.id))),
  );
}

export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// "2026-11-06" → "6 Nov 2026"
export function formatDate(iso) {
  const [y, m, d] = (iso ?? '').split('-').map(Number);
  if (!y || !m || !d) return 'No date';
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function findLink(data, linkId) {
  for (const project of data.projects) {
    const index = project.links.findIndex((l) => l.id === linkId);
    if (index > -1) return {project, link: project.links[index], index};
  }
  return null;
}

// One latest link per type per project. `keepId` is the one that wins.
function keepOneLatest(links, keepId) {
  const kept = links.find((l) => l.id === keepId);
  if (!kept?.latest) return links;
  return links.map((l) =>
    l.id !== keepId && l.type === kept.type && l.latest
      ? {...l, latest: false}
      : l,
  );
}

// Adds a link, or replaces the one with its id, in project `projectId`. A link
// that changes project goes to the end of its new one.
export function saveLink(data, link, projectId) {
  const found = findLink(data, link.id);
  const projects = data.projects.map((p) => {
    let links = p.links;
    if (found && found.project.id === p.id && p.id !== projectId) {
      links = links.filter((l) => l.id !== link.id);
    }
    if (p.id === projectId) {
      links =
        found && found.project.id === p.id
          ? links.map((l) => (l.id === link.id ? link : l))
          : [...links, link];
      links = keepOneLatest(links, link.id);
    }
    return links === p.links ? p : {...p, links};
  });
  return {projects};
}

export function deleteLink(data, linkId) {
  return {
    projects: data.projects.map((p) => ({
      ...p,
      links: p.links.filter((l) => l.id !== linkId),
    })),
  };
}

// Moves a link before `beforeId` in project `projectId`, or to its end when
// `beforeId` is null. Moving a latest link into a project that already has a
// latest of its type keeps that project's, and drops the tag from the mover.
export function moveLink(data, linkId, projectId, beforeId = null) {
  const found = findLink(data, linkId);
  if (!found || linkId === beforeId) return data;
  let moved = found.link;
  const target = data.projects.find((p) => p.id === projectId);
  if (!target) return data;
  if (
    target.id !== found.project.id &&
    moved.latest &&
    target.links.some((l) => l.latest && l.type === moved.type)
  ) {
    moved = {...moved, latest: false};
  }
  const projects = data.projects.map((p) => {
    let links = p.links.filter((l) => l.id !== linkId);
    if (p.id === projectId) {
      const at = beforeId ? links.findIndex((l) => l.id === beforeId) : -1;
      links =
        at < 0
          ? [...links, moved]
          : [...links.slice(0, at), moved, ...links.slice(at)];
    }
    return {...p, links};
  });
  return {projects};
}

// Moves a link one place along within its project (-1 earlier, +1 later).
export function shiftLink(data, linkId, delta) {
  const found = findLink(data, linkId);
  if (!found) return data;
  const to = found.index + delta;
  if (to < 0 || to >= found.project.links.length) return data;
  const links = found.project.links.slice();
  links.splice(found.index, 1);
  links.splice(to, 0, found.link);
  return {
    projects: data.projects.map((p) =>
      p.id === found.project.id ? {...p, links} : p,
    ),
  };
}

// Adds a project at the end, or changes one's name and description. An empty
// description removes it.
export function saveProject(data, project) {
  const fields = (p) => {
    const {description: _, ...rest} = p;
    const description = project.description?.trim();
    return description
      ? {...rest, name: project.name, description}
      : {...rest, name: project.name};
  };
  const exists = data.projects.some((p) => p.id === project.id);
  return {
    projects: exists
      ? data.projects.map((p) => (p.id === project.id ? fields(p) : p))
      : [...data.projects, fields({id: project.id, links: []})],
  };
}

export function deleteProject(data, projectId) {
  return {projects: data.projects.filter((p) => p.id !== projectId)};
}

// Moves a project before `beforeId`.
export function moveProject(data, projectId, beforeId) {
  const from = data.projects.findIndex((p) => p.id === projectId);
  if (from < 0 || projectId === beforeId) return data;
  const projects = data.projects.slice();
  const [moved] = projects.splice(from, 1);
  const at = beforeId ? projects.findIndex((p) => p.id === beforeId) : -1;
  projects.splice(at < 0 ? projects.length : at, 0, moved);
  return {projects};
}

export function shiftProject(data, projectId, delta) {
  const from = data.projects.findIndex((p) => p.id === projectId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= data.projects.length) return data;
  const projects = data.projects.slice();
  const [moved] = projects.splice(from, 1);
  projects.splice(to, 0, moved);
  return {projects};
}

import {cn} from 'cn';
import {ImageUp, Upload} from 'lucide-react';
import {useEffect, useId, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deleteLink,
  isWebUrl,
  LINK_TYPES,
  newLinkId,
  saveLink,
  today,
} from '../../lib/dashboard.js';
import {toThumbnail, uploadThumb} from '../../lib/editor-api.js';
import {Thumb, thumbSrc} from './Thumb.jsx';
import {TYPES, TypeChip} from './types.jsx';

const plain = (link, projectId) => ({
  url: link?.url ?? '',
  type: link?.type ?? '',
  title: link?.title ?? '',
  projectId,
  updated: link?.updated ?? today(),
  latest: link?.latest ?? false,
  thumb: link?.thumb ?? null,
  // A new image, not saved yet: {blob, url}.
  image: null,
});

// Adding or editing a link. Saves through `commit`, which writes the whole
// dashboard; a new thumbnail is written first, to public/thumbs/.
//   link       The link being edited, or null for a new one.
//   projectId  The project it's in, or the one to add it to.
export function LinkDialog({link, projectId, data, commit, onDone}) {
  const [form, setForm] = useState(() => plain(link, projectId));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [zone, setZone] = useState(null); // 'focus' | 'over' | null
  const fileInput = useRef(null);
  const id = useId();
  const set = (patch) => {
    setForm((f) => ({...f, ...patch}));
    setError(null);
  };

  async function takeImage(file) {
    if (!file?.type.startsWith('image/')) {
      setError({message: 'That file isn’t an image.'});
      return;
    }
    try {
      const blob = await toThumbnail(file);
      setForm((f) => {
        if (f.image) URL.revokeObjectURL(f.image.url);
        return {...f, image: {blob, url: URL.createObjectURL(blob)}};
      });
      setError(null);
    } catch {
      setError({message: 'That image couldn’t be read.'});
    }
  }

  // Pasting an image anywhere while the dialog is open uses it as the
  // thumbnail. A paste into a text field that also carries text (copying from
  // some apps puts both on the clipboard) stays a text paste.
  const takeImageRef = useRef(takeImage);
  takeImageRef.current = takeImage;
  useEffect(() => {
    function onPaste(e) {
      const item = [...(e.clipboardData?.items ?? [])].find(
        (i) => i.kind === 'file' && i.type.startsWith('image/'),
      );
      if (!item) return;
      const inField = e.target.closest?.('input, textarea');
      if (inField && e.clipboardData.getData('text/plain')) return;
      e.preventDefault();
      takeImageRef.current(item.getAsFile());
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes('Files');

  function check() {
    if (!isWebUrl(form.url)) {
      return {field: 'url', message: 'Add the link, starting https://'};
    }
    if (!form.type) return {field: 'type', message: 'Pick a type.'};
    if (!form.projectId) return {field: 'project', message: 'Pick a project.'};
    if (!form.updated) return {field: 'updated', message: 'Add a date.'};
    return null;
  }

  async function save() {
    const problem = check();
    if (problem) {
      setError(problem);
      document.getElementById(`${id}-${problem.field}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const linkId =
        link?.id ??
        newLinkId(data, form.projectId, form.title.trim() || form.type);
      let thumb = form.thumb;
      if (form.image) thumb = await uploadThumb(linkId, form.image.blob);
      // No title: the dashboard names the link by its type.
      const saved = {id: linkId, type: form.type};
      if (form.title.trim()) saved.title = form.title.trim();
      Object.assign(saved, {
        url: form.url.trim(),
        updated: form.updated,
        latest: form.latest,
      });
      if (thumb) saved.thumb = thumb;
      await commit(saveLink(data, saved, form.projectId));
      onDone();
    } catch (e) {
      setError({message: e.message});
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await commit(deleteLink(data, link.id));
      onDone({});
    } catch (e) {
      setError({message: e.message});
      setSaving(false);
    }
  }

  const previewSrc =
    form.image?.url ?? (form.thumb ? thumbSrc(form.thumb) : null);
  const invalid = (field) => (error?.field === field ? true : undefined);
  const projects = data.projects.map((p) => ({value: p.id, label: p.name}));

  return (
    <DialogContent
      className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-w-[600px]"
      onDragOver={(e) => hasFiles(e) && e.preventDefault()}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setZone(null);
        takeImage(e.dataTransfer.files[0]);
      }}
    >
      <DialogHeader>
        <DialogTitle>{link ? 'Edit link' : 'Add link'}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <Field label="Link" id={`${id}-url`}>
          <Input
            id={`${id}-url`}
            type="url"
            value={form.url}
            onChange={(e) => set({url: e.target.value})}
            placeholder="Paste a Figma, Miro or prototype address"
            aria-invalid={invalid('url')}
            autoFocus={!link}
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm leading-tight font-bold text-dark-blue">
            Type
          </legend>
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2"
            aria-invalid={invalid('type')}
          >
            {LINK_TYPES.map((key, i) => (
              <label
                key={key}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-dark-blue has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue',
                  form.type === key
                    ? 'border-2 border-dark-blue bg-surface'
                    : 'border border-line hover:border-blue-60',
                  error?.field === 'type' && 'border-danger',
                )}
              >
                <input
                  type="radio"
                  name={`${id}-type`}
                  id={i === 0 ? `${id}-type` : undefined}
                  value={key}
                  checked={form.type === key}
                  onChange={() => set({type: key})}
                  className="sr-only"
                />
                <TypeChip type={key} />
                {TYPES[key].label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label="Title"
          optional
          id={`${id}-title`}
          help={`Leave it empty to show the type${form.type ? `, “${TYPES[form.type].label}”` : ''}.`}
        >
          <Input
            id={`${id}-title`}
            value={form.title}
            onChange={(e) => set({title: e.target.value})}
            placeholder="e.g. IRM prototype · 14 Oct"
            aria-describedby={`${id}-title-help`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project" id={`${id}-project`}>
            <Select
              items={projects}
              value={form.projectId}
              onValueChange={(value) => set({projectId: value})}
            >
              <SelectTrigger
                id={`${id}-project`}
                className="w-full"
                aria-invalid={invalid('project')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Last updated" id={`${id}-updated`}>
            <Input
              id={`${id}-updated`}
              type="date"
              value={form.updated}
              onChange={(e) => set({updated: e.target.value})}
              aria-invalid={invalid('updated')}
            />
          </Field>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id={`${id}-latest`}
            checked={form.latest}
            onCheckedChange={(latest) => set({latest})}
            className="mt-1"
            aria-describedby={`${id}-latest-help`}
          />
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`${id}-latest`}>Mark as latest</Label>
            <p id={`${id}-latest-help`} className="text-[13px] text-ink-500">
              Adds a Latest tag. One link of each type per project can be
              latest.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm leading-tight font-bold text-dark-blue">
            Thumbnail
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={(e) => e.currentTarget.focus()}
              onFocus={() => setZone('focus')}
              onBlur={() => setZone(null)}
              onDragOver={(e) => {
                if (!hasFiles(e)) return;
                e.preventDefault();
                setZone('over');
              }}
              onDragLeave={() => setZone(null)}
              aria-label="Thumbnail: click, then paste an image, or drop one here"
              className="w-[220px] flex-none focus-visible:outline-none"
            >
              <Thumb
                type={form.type || 'other'}
                src={previewSrc}
                className={cn(
                  zone
                    ? 'border-2 border-blue'
                    : !previewSrc &&
                        'border-[1.5px] border-grey-300 border-dashed',
                )}
              >
                {(zone || !previewSrc) && (
                  <span
                    className={cn(
                      'absolute flex flex-col items-center justify-center gap-1.5 px-4 text-center text-xs font-semibold',
                      // Over an image, the paste hint is a strip, so the
                      // image just pasted still shows.
                      previewSrc && zone === 'focus'
                        ? 'inset-x-0 bottom-0 py-1.5'
                        : 'inset-0',
                      zone ? 'bg-blue-10/95 text-blue' : 'text-ink-500',
                      // Covers the type's icon, which Thumb draws underneath.
                      !zone && !previewSrc && 'bg-inherit',
                    )}
                  >
                    {!zone && (
                      <ImageUp
                        className="size-6"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    )}
                    {zone === 'over'
                      ? 'Drop to use'
                      : zone === 'focus'
                        ? 'Now paste (⌘V / Ctrl+V)'
                        : 'Drop an image, or click and paste'}
                  </span>
                )}
              </Thumb>
            </button>
            <div className="flex min-w-[200px] flex-1 flex-col items-start gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput.current.click()}
                >
                  <Upload /> Upload image
                </Button>
                {previewSrc && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => set({thumb: null, image: null})}
                  >
                    Remove image
                  </Button>
                )}
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                onChange={(e) => {
                  takeImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <p className="text-[13px] text-ink-500">
                Pasting an image anywhere in this dialog works too. Without one,
                the card shows the type’s icon.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-danger-tint px-3 py-2.5 text-sm font-semibold text-danger"
          >
            {error.message}
          </p>
        )}
      </div>

      <DialogFooter>
        {link && (
          <Button
            variant={confirmDelete ? 'destructive' : 'ghost'}
            onClick={remove}
            disabled={saving}
            className={cn('sm:mr-auto', !confirmDelete && 'text-danger')}
          >
            {confirmDelete ? 'Yes, delete this link' : 'Delete link'}
          </Button>
        )}
        <Button variant="outline" onClick={() => onDone(null)}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {link ? 'Save changes' : 'Add link'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// A labelled field, with an optional "optional" marker and help below it.
export function Field({label, id, optional, help, children}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="font-normal text-ink-500">(optional)</span>
        )}
      </Label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-[13px] text-ink-500">
          {help}
        </p>
      )}
    </div>
  );
}

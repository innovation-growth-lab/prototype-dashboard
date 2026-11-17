import {cn} from 'cn';
import {useId, useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {deleteProject, newProjectId, saveProject} from '../../lib/dashboard.js';
import {Field} from './LinkDialog.jsx';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// A new project, or editing one's name and description (`project`). Deleting
// takes its links too, so it asks first and says how many.
export function ProjectDialog({project, data, commit, onDone}) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const id = useId();

  async function run(next, result) {
    setSaving(true);
    try {
      await commit(next);
      onDone(result);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  function save(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the project a name.');
      return;
    }
    const projectId = project?.id ?? newProjectId(data, trimmed);
    run(saveProject(data, {id: projectId, name: trimmed, description}), {
      projectId,
    });
  }

  function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    run(deleteProject(data, project.id), {});
  }

  const links = project?.links.length ?? 0;

  return (
    <DialogContent className="sm:max-w-[480px]">
      <form onSubmit={save} className="contents">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field
            label="Project name"
            id={`${id}-name`}
            help={
              project
                ? 'Its links stay where they are.'
                : 'New projects appear at the bottom; drag to reorder.'
            }
          >
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. IRM"
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-name-help`}
              autoFocus
            />
          </Field>
          <Field
            label="Description"
            id={`${id}-description`}
            optional
            help="A short line beside the project's name: what it is, or where it's at."
          >
            <Textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="min-h-20"
              aria-describedby={`${id}-description-help`}
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-danger-tint px-3 py-2.5 text-sm font-semibold text-danger"
            >
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          {project && (
            <Button
              variant={confirmDelete ? 'destructive' : 'ghost'}
              onClick={remove}
              disabled={saving}
              className={cn('sm:mr-auto', !confirmDelete && 'text-danger')}
            >
              {confirmDelete
                ? links
                  ? `Delete project and ${plural(links, 'link')}`
                  : 'Yes, delete this project'
                : 'Delete project'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onDone(null)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {project ? 'Save' : 'Create project'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

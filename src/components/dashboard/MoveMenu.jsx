import {cn} from 'cn';
import {ArrowUpDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// The keyboard's way to reorder, beside drag and drop: a menu of moves.
//   moves    [{label, onSelect, disabled}]
//   targets  Optional [{id, name}]: other projects to move a link to.
//   label    The button's name for screen readers: "Move IRM prototype".
export function MoveMenu({label, moves, targets = [], onMoveTo, className}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={cn('text-grey-700', className)}
          />
        }
      >
        <ArrowUpDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        {moves.map((m) => (
          <DropdownMenuItem
            key={m.label}
            disabled={m.disabled}
            onClick={m.onSelect}
          >
            {m.label}
          </DropdownMenuItem>
        ))}
        {targets.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Move to project</DropdownMenuLabel>
              {targets.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => onMoveTo(t.id)}>
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

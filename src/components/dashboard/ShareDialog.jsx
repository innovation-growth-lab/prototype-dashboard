import {Check, Copy} from 'lucide-react';
import {useEffect, useId, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

// The sharer's name, remembered in their browser for next time.
const FROM_KEY = 'prototype-dashboard-from-v1';

// The address for the links picked to share (`ids`), with the sharer's name,
// to copy. Only ever rendered in the browser, after Done is pressed.
export function ShareDialog({ids, onBack}) {
  const id = useId();
  const [from, setFrom] = useState('');
  const [copied, setCopied] = useState(false);
  const urlRef = useRef(null);

  useEffect(() => {
    try {
      setFrom(localStorage.getItem(FROM_KEY) ?? '');
    } catch {}
  }, []);

  // Wherever the page is: localhost under `npm run dev`, the live address on
  // the live site. Ids are [a-z0-9-], so the commas can stay as they are.
  const name = from.trim();
  const url =
    `${window.location.origin}${import.meta.env.BASE_URL}?shared=${ids.join(',')}` +
    (name ? `&from=${encodeURIComponent(name)}` : '');
  const links = ids.length === 1 ? '1 link' : `${ids.length} links`;

  function changeFrom(value) {
    setFrom(value);
    setCopied(false);
    try {
      localStorage.setItem(FROM_KEY, value.trim());
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard access: select the address to copy by hand.
      urlRef.current?.select();
    }
  }

  return (
    <DialogContent className="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>Share {links}</DialogTitle>
        <DialogDescription>
          Anyone who opens this address sees the dashboard with{' '}
          {ids.length === 1 ? 'this link' : 'these links'} highlighted.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-from`}>
            Your name
            <span className="font-normal text-ink-500">(optional)</span>
          </Label>
          <Input
            id={`${id}-from`}
            value={from}
            onChange={(e) => changeFrom(e.target.value)}
            maxLength={40}
            autoComplete="given-name"
            placeholder="e.g. Kevin"
            aria-describedby={`${id}-from-help`}
          />
          <p id={`${id}-from-help`} className="text-[13px] text-ink-500">
            They’ll see “
            {name
              ? `${name} shared ${links} with you.`
              : `${links} ${ids.length === 1 ? 'was' : 'were'} shared with you.`}
            ”
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-url`}>Address</Label>
          <Input
            id={`${id}-url`}
            ref={urlRef}
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
            className="font-mono text-sm"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          Change selection
        </Button>
        <Button onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy address'}
        </Button>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Address copied' : ''}
        </span>
      </DialogFooter>
    </DialogContent>
  );
}

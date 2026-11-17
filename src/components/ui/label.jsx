import {cn} from 'cn';

// A field label: small and bold, as in the dashboard's mockup.
function Label({className, ...props}) {
  return (
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-tight font-bold text-dark-blue select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export {Label};

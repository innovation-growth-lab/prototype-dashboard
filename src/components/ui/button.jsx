import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {cva} from 'class-variance-authority';
import {cn} from 'cn';
import {Link} from 'react-router';

// shadcn's Button, styled for the dashboard: IGL's colours with rounded
// corners and a navy main action (the brand's own is red and square). Icons go
// in as children; the dashboard puts a + before its label, like the mockup.
//
//   default      The one main action: navy.
//   secondary    A quiet text action ("Rename"), filled on hover.
//   ghost        The same, for icon buttons.
//   link         An underlined text link.
//   outline      A bordered white button, beside the main action.
//   destructive  Confirming a delete: red.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent font-bold leading-tight whitespace-nowrap no-underline transition-colors duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125em]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground not-disabled:hover:bg-navy-hover disabled:bg-grey-200 disabled:text-grey-500',
        secondary:
          'text-dark-blue not-disabled:hover:bg-hover aria-expanded:bg-hover disabled:text-grey-300',
        ghost:
          'text-dark-blue not-disabled:hover:bg-hover aria-expanded:bg-hover disabled:text-grey-300',
        link: 'h-auto! border-0 p-0! text-blue underline underline-offset-3 not-disabled:hover:text-dark-blue disabled:text-grey-300',
        outline:
          'border-line bg-background text-dark-blue not-disabled:hover:bg-surface aria-expanded:bg-surface disabled:text-grey-300',
        destructive:
          'bg-danger text-white not-disabled:hover:bg-danger/90 disabled:bg-grey-200 disabled:text-grey-500',
      },
      size: {
        xs: 'h-8 gap-1.5 px-2.5 text-xs',
        sm: 'h-10 px-3 text-sm font-semibold',
        default: 'h-11 px-4 text-[15px]',
        lg: 'h-12 px-5 text-base',
        'icon-xs': 'size-6 text-xs',
        'icon-sm': 'size-8 text-sm',
        icon: 'size-10 text-base',
        'icon-lg': 'size-12 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// A <button>, or with `to` a link in the app and with `href` a link elsewhere,
// styled the same. (Base UI's `render` prop also works, for other elements.)
function Button({className, variant, size, to, href, ...props}) {
  const classes = cn(buttonVariants({variant, size, className}));
  if (to) return <Link to={to} className={classes} {...props} />;
  if (href) return <a href={href} className={classes} {...props} />;
  return <ButtonPrimitive data-slot="button" className={classes} {...props} />;
}

export {Button, buttonVariants};

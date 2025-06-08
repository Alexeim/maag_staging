
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LockOpen
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHg9IjMiIHk9IjExIiByeD0iMiIgcnk9IjIiIC8+CiAgPHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgOS45LTEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/lock-open
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LockOpen = createLucideIcon('lock-open', [["rect",{"width":"18","height":"11","x":"3","y":"11","rx":"2","ry":"2"}],["path",{"d":"M7 11V7a5 5 0 0 1 9.9-1"}]]) as AstroComponent;

export default LockOpen;

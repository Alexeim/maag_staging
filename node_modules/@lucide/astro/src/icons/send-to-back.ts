
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name SendToBack
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHJ4PSIyIiAvPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Ik03IDE0djFhMiAyIDAgMCAwIDIgMmgxIiAvPgogIDxwYXRoIGQ9Ik0xNCA3aDFhMiAyIDAgMCAxIDIgMnYxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/send-to-back
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const SendToBack = createLucideIcon('send-to-back', [["rect",{"x":"14","y":"14","width":"8","height":"8","rx":"2"}],["rect",{"x":"2","y":"2","width":"8","height":"8","rx":"2"}],["path",{"d":"M7 14v1a2 2 0 0 0 2 2h1"}],["path",{"d":"M14 7h1a2 2 0 0 1 2 2v1"}]]) as AstroComponent;

export default SendToBack;


import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name LampCeiling
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMnY1IiAvPgogIDxwYXRoIGQ9Ik0xNC44MjkgMTUuOTk4YTMgMyAwIDEgMS01LjY1OCAwIiAvPgogIDxwYXRoIGQ9Ik0yMC45MiAxNC42MDZBMSAxIDAgMCAxIDIwIDE2SDRhMSAxIDAgMCAxLS45Mi0xLjM5NGwzLTdBMSAxIDAgMCAxIDcgN2gxMGExIDEgMCAwIDEgLjkyLjYwNnoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/lamp-ceiling
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const LampCeiling = createLucideIcon('lamp-ceiling', [["path",{"d":"M12 2v5"}],["path",{"d":"M14.829 15.998a3 3 0 1 1-5.658 0"}],["path",{"d":"M20.92 14.606A1 1 0 0 1 20 16H4a1 1 0 0 1-.92-1.394l3-7A1 1 0 0 1 7 7h10a1 1 0 0 1 .92.606z"}]]) as AstroComponent;

export default LampCeiling;

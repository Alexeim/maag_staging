
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ZapOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuNTEzIDQuODU2IDEzLjEyIDIuMTdhLjUuNSAwIDAgMSAuODYuNDZsLTEuMzc3IDQuMzE3IiAvPgogIDxwYXRoIGQ9Ik0xNS42NTYgMTBIMjBhMSAxIDAgMCAxIC43OCAxLjYzbC0xLjcyIDEuNzczIiAvPgogIDxwYXRoIGQ9Ik0xNi4yNzMgMTYuMjczIDEwLjg4IDIxLjgzYS41LjUgMCAwIDEtLjg2LS40NmwxLjkyLTYuMDJBMSAxIDAgMCAwIDExIDE0SDRhMSAxIDAgMCAxLS43OC0xLjYzbDQuNTA3LTQuNjQzIiAvPgogIDxwYXRoIGQ9Im0yIDIgMjAgMjAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/zap-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ZapOff = createLucideIcon('zap-off', [["path",{"d":"M10.513 4.856 13.12 2.17a.5.5 0 0 1 .86.46l-1.377 4.317"}],["path",{"d":"M15.656 10H20a1 1 0 0 1 .78 1.63l-1.72 1.773"}],["path",{"d":"M16.273 16.273 10.88 21.83a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4a1 1 0 0 1-.78-1.63l4.507-4.643"}],["path",{"d":"m2 2 20 20"}]]) as AstroComponent;

export default ZapOff;

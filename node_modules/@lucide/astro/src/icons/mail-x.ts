
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name MailX
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjIgMTNWNmEyIDIgMCAwIDAtMi0ySDRhMiAyIDAgMCAwLTIgMnYxMmMwIDEuMS45IDIgMiAyaDkiIC8+CiAgPHBhdGggZD0ibTIyIDctOC45NyA1LjdhMS45NCAxLjk0IDAgMCAxLTIuMDYgMEwyIDciIC8+CiAgPHBhdGggZD0ibTE3IDE3IDQgNCIgLz4KICA8cGF0aCBkPSJtMjEgMTctNCA0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/mail-x
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const MailX = createLucideIcon('mail-x', [["path",{"d":"M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9"}],["path",{"d":"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"}],["path",{"d":"m17 17 4 4"}],["path",{"d":"m21 17-4 4"}]]) as AstroComponent;

export default MailX;

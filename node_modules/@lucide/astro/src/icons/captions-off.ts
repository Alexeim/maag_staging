
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CaptionsOff
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAuNSA1SDE5YTIgMiAwIDAgMSAyIDJ2OC41IiAvPgogIDxwYXRoIGQ9Ik0xNyAxMWgtLjUiIC8+CiAgPHBhdGggZD0iTTE5IDE5SDVhMiAyIDAgMCAxLTItMlY3YTIgMiAwIDAgMSAyLTIiIC8+CiAgPHBhdGggZD0ibTIgMiAyMCAyMCIgLz4KICA8cGF0aCBkPSJNNyAxMWg0IiAvPgogIDxwYXRoIGQ9Ik03IDE1aDIuNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/captions-off
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CaptionsOff = createLucideIcon('captions-off', [["path",{"d":"M10.5 5H19a2 2 0 0 1 2 2v8.5"}],["path",{"d":"M17 11h-.5"}],["path",{"d":"M19 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M7 11h4"}],["path",{"d":"M7 15h2.5"}]]) as AstroComponent;

export default CaptionsOff;

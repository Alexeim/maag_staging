
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name Forklift
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTJINWEyIDIgMCAwIDAtMiAydjUiIC8+CiAgPGNpcmNsZSBjeD0iMTMiIGN5PSIxOSIgcj0iMiIgLz4KICA8Y2lyY2xlIGN4PSI1IiBjeT0iMTkiIHI9IjIiIC8+CiAgPHBhdGggZD0iTTggMTloM201LTE3djE3aDZNNiAxMlY3YzAtMS4xLjktMiAyLTJoM2w1IDUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/forklift
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const Forklift = createLucideIcon('forklift', [["path",{"d":"M12 12H5a2 2 0 0 0-2 2v5"}],["circle",{"cx":"13","cy":"19","r":"2"}],["circle",{"cx":"5","cy":"19","r":"2"}],["path",{"d":"M8 19h3m5-17v17h6M6 12V7c0-1.1.9-2 2-2h3l5 5"}]]) as AstroComponent;

export default Forklift;

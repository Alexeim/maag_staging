
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name CardSim
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTR2NCIgLz4KICA8cGF0aCBkPSJNMTQuMTcyIDJhMiAyIDAgMCAxIDEuNDE0LjU4NmwzLjgyOCAzLjgyOEEyIDIgMCAwIDEgMjAgNy44MjhWMjBhMiAyIDAgMCAxLTIgMkg2YTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yeiIgLz4KICA8cGF0aCBkPSJNOCAxNGg4IiAvPgogIDxyZWN0IHg9IjgiIHk9IjEwIiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiByeD0iMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/card-sim
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const CardSim = createLucideIcon('card-sim', [["path",{"d":"M12 14v4"}],["path",{"d":"M14.172 2a2 2 0 0 1 1.414.586l3.828 3.828A2 2 0 0 1 20 7.828V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"}],["path",{"d":"M8 14h8"}],["rect",{"x":"8","y":"10","width":"8","height":"8","rx":"1"}]]) as AstroComponent;

export default CardSim;

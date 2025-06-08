
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ChartNoAxesCombined
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTZ2NSIgLz4KICA8cGF0aCBkPSJNMTYgMTR2NyIgLz4KICA8cGF0aCBkPSJNMjAgMTB2MTEiIC8+CiAgPHBhdGggZD0ibTIyIDMtOC42NDYgOC42NDZhLjUuNSAwIDAgMS0uNzA4IDBMOS4zNTQgOC4zNTRhLjUuNSAwIDAgMC0uNzA3IDBMMiAxNSIgLz4KICA8cGF0aCBkPSJNNCAxOHYzIiAvPgogIDxwYXRoIGQ9Ik04IDE0djciIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/chart-no-axes-combined
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ChartNoAxesCombined = createLucideIcon('chart-no-axes-combined', [["path",{"d":"M12 16v5"}],["path",{"d":"M16 14v7"}],["path",{"d":"M20 10v11"}],["path",{"d":"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"}],["path",{"d":"M4 18v3"}],["path",{"d":"M8 14v7"}]]) as AstroComponent;

export default ChartNoAxesCombined;

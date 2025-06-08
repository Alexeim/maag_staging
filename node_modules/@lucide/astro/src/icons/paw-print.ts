
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name PawPrint
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMSIgY3k9IjQiIHI9IjIiIC8+CiAgPGNpcmNsZSBjeD0iMTgiIGN5PSI4IiByPSIyIiAvPgogIDxjaXJjbGUgY3g9IjIwIiBjeT0iMTYiIHI9IjIiIC8+CiAgPHBhdGggZD0iTTkgMTBhNSA1IDAgMCAxIDUgNXYzLjVhMy41IDMuNSAwIDAgMS02Ljg0IDEuMDQ1UTYuNTIgMTcuNDggNC40NiAxNi44NEEzLjUgMy41IDAgMCAxIDUuNSAxMFoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/paw-print
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const PawPrint = createLucideIcon('paw-print', [["circle",{"cx":"11","cy":"4","r":"2"}],["circle",{"cx":"18","cy":"8","r":"2"}],["circle",{"cx":"20","cy":"16","r":"2"}],["path",{"d":"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"}]]) as AstroComponent;

export default PawPrint;

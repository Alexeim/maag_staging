
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name DraftingCompass
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTIuOTkgNi43NCAxLjkzIDMuNDQiIC8+CiAgPHBhdGggZD0iTTE5LjEzNiAxMmExMCAxMCAwIDAgMS0xNC4yNzEgMCIgLz4KICA8cGF0aCBkPSJtMjEgMjEtMi4xNi0zLjg0IiAvPgogIDxwYXRoIGQ9Im0zIDIxIDguMDItMTQuMjYiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSI1IiByPSIyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/drafting-compass
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const DraftingCompass = createLucideIcon('drafting-compass', [["path",{"d":"m12.99 6.74 1.93 3.44"}],["path",{"d":"M19.136 12a10 10 0 0 1-14.271 0"}],["path",{"d":"m21 21-2.16-3.84"}],["path",{"d":"m3 21 8.02-14.26"}],["circle",{"cx":"12","cy":"5","r":"2"}]]) as AstroComponent;

export default DraftingCompass;

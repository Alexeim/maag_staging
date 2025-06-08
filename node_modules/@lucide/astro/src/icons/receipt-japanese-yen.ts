
import createLucideIcon from '../createLucideIcon';
import type { AstroComponent } from '../types'

/**
 * @component @name ReceiptJapaneseYen
 * @description Lucide SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAydjIwbDItMSAyIDEgMi0xIDIgMSAyLTEgMiAxIDItMSAyIDFWMmwtMiAxLTItMS0yIDEtMi0xLTIgMS0yLTEtMiAxWiIgLz4KICA8cGF0aCBkPSJtMTIgMTAgMy0zIiAvPgogIDxwYXRoIGQ9Im05IDcgMyAzdjcuNSIgLz4KICA8cGF0aCBkPSJNOSAxMWg2IiAvPgogIDxwYXRoIGQ9Ik05IDE1aDYiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/receipt-japanese-yen
 * @see https://lucide.dev/guide/packages/lucide-astro - Documentation
 *
 * @param {import('../types').IconProps} props - Lucide icons props and any valid SVG attribute
 * @returns {any} Astro Component
 * 
 */
const ReceiptJapaneseYen = createLucideIcon('receipt-japanese-yen', [["path",{"d":"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"}],["path",{"d":"m12 10 3-3"}],["path",{"d":"m9 7 3 3v7.5"}],["path",{"d":"M9 11h6"}],["path",{"d":"M9 15h6"}]]) as AstroComponent;

export default ReceiptJapaneseYen;

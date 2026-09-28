import type Quill from "quill";
import type { Delta } from "quill";
import {
  normalizeStoredRichTextHtml,
  richTextHtmlToText,
} from "@/lib/utils/richText";

// This module is registered in the Alpine entrypoint, which every public page
// loads. Quill is imported on first mount instead, so Vite puts it in its own
// chunk and only the dashboard editors download it.
const loadQuill = () => import("quill");

interface RichTextEditorConfig {
  initialHtml?: string;
  placeholder?: string;
}

// Formats that carry cosmetic styles from external sources (email, web pages).
// We strip these on paste so the page CSS controls appearance, not the source.
const COSMETIC_FORMATS = new Set([
  "background",
  "color",
  "font",
  "size",
  "script",
  "align",
]);

// Delta is passed in because Quill (and its Delta) is only loaded on mount.
function stripCosmeticFormats(
  DeltaClass: typeof Delta,
  _node: Node,
  delta: Delta,
): Delta {
  return new DeltaClass(
    delta.ops
      .filter((op) => {
        // Reject embed ops (images, videos) — insert is an object for embeds, string for text
        return typeof op.insert !== "object";
      })
      .map((op) => {
        if (!op.attributes) return op;
        const cleanAttrs = Object.fromEntries(
          Object.entries(op.attributes).filter(
            ([key]) => !COSMETIC_FORMATS.has(key),
          ),
        );
        return Object.keys(cleanAttrs).length > 0
          ? { ...op, attributes: cleanAttrs }
          : { insert: op.insert };
      }),
  );
}

export default function blockRichTextEditor(
  config: RichTextEditorConfig = {},
) {
  return {
    quill: null as Quill | null,

    async init() {
      // @ts-ignore Alpine ref is available at runtime.
      const editor: HTMLElement & { quill?: Quill } = this.$refs.editor;
      if (editor.quill) {
        return;
      }

      const { default: QuillClass, Delta: DeltaClass } = await loadQuill();

      // While the chunk was loading, the block may have been removed (x-if)
      // or another instance may have mounted on the same node.
      if (!editor.isConnected || editor.quill) {
        return;
      }

      this.quill = new QuillClass(editor, {
        theme: "snow",
        formats: ["bold", "italic", "underline", "link"],
        placeholder: config.placeholder || "Введите текст...",
        modules: {
          clipboard: {
            matchers: [
              [Node.ELEMENT_NODE, stripCosmeticFormats.bind(null, DeltaClass)],
            ],
          },
          toolbar: [["bold", "italic", "underline"], ["link"], ["clean"]],
        },
      });

      // Store editor instance on host node to avoid duplicate mount.
      editor.quill = this.quill;

      const initialHtml = normalizeStoredRichTextHtml(config.initialHtml);
      if (this.quill.root.innerHTML !== initialHtml) {
        this.quill.root.innerHTML = initialHtml || "";
      }

      // `initial` marks the mount-time emit: Quill normalizing the stored
      // value, not a user edit. unsavedChangesGuard relies on it.
      const emitChange = (initial: boolean) => {
        if (!this.quill) {
          return;
        }

        const html = normalizeStoredRichTextHtml(this.quill.root.innerHTML);
        const text = richTextHtmlToText(html);

        // @ts-ignore Alpine dispatch is available at runtime.
        this.$dispatch("rich-text-change", { html, text, initial });
      };

      // Wrapped: Quill calls the handler with (delta, oldDelta, source).
      this.quill.on("text-change", () => emitChange(false));
      emitChange(true);
    },
  };
}

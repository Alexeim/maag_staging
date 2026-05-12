import Quill, { Delta } from "quill";
import {
  normalizeStoredRichTextHtml,
  richTextHtmlToText,
} from "@/lib/utils/richText";

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

function stripCosmeticFormats(_node: Node, delta: Delta): Delta {
  return new Delta(
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

    init() {
      // @ts-ignore Alpine ref is available at runtime.
      if (this.$refs.editor.quill) {
        return;
      }

      // @ts-ignore Alpine ref is available at runtime.
      this.quill = new Quill(this.$refs.editor, {
        theme: "snow",
        formats: ["bold", "italic", "underline", "link"],
        placeholder: config.placeholder || "Введите текст...",
        modules: {
          clipboard: {
            matchVisual: false,
            matchers: [[Node.ELEMENT_NODE, stripCosmeticFormats]],
          },
          toolbar: [["bold", "italic", "underline"], ["link"], ["clean"]],
        },
      });

      // @ts-ignore Store editor instance on host node to avoid duplicate mount.
      this.$refs.editor.quill = this.quill;

      const initialHtml = normalizeStoredRichTextHtml(config.initialHtml);
      if (this.quill.root.innerHTML !== initialHtml) {
        this.quill.root.innerHTML = initialHtml || "";
      }

      const emitChange = () => {
        if (!this.quill) {
          return;
        }

        const html = normalizeStoredRichTextHtml(this.quill.root.innerHTML);
        const text = richTextHtmlToText(html);

        // @ts-ignore Alpine dispatch is available at runtime.
        this.$dispatch("rich-text-change", { html, text });
      };

      this.quill.on("text-change", emitChange);
      emitChange();
    },
  };
}

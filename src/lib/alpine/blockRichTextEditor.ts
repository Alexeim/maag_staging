import Quill from "quill";
import {
  normalizeStoredRichTextHtml,
  richTextHtmlToText,
} from "@/lib/utils/richText";

interface RichTextEditorConfig {
  initialHtml?: string;
  placeholder?: string;
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
        placeholder: config.placeholder || "Введите текст...",
        modules: {
          clipboard: { matchVisual: false },
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

// Loose shape of a content block in the dashboard editors: every block has an
// id and a type; per-type fields (text, url, quoteAuthor, ...) are not
// modelled yet, so they stay `any`. Replacing this with a precise union of
// block types will tighten every editor that uses it.
export type EditorBlock = {
  id: string;
  type: string;
  [field: string]: any;
};

export const generateBlockId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const withBlockMeta = (
  block: Record<string, any>,
  position: number,
): EditorBlock => {
  const existingId =
    typeof block.id === "string" && block.id.trim() ? block.id.trim() : "";

  // Blocks come from the editor or the API unvalidated; each is assumed to
  // carry its `type`, which TypeScript cannot see through the spread.
  return {
    ...block,
    id: existingId || generateBlockId(),
    position,
  } as unknown as EditorBlock;
};

export const reindexContentBlocks = (blocks?: unknown): EditorBlock[] => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .filter(
      (block): block is Record<string, unknown> =>
        Boolean(block) && typeof block === "object",
    )
    .map((block, index) => withBlockMeta(block, index));
};

export const sortAndNormalizeContentBlocks = (
  blocks?: unknown,
): EditorBlock[] => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  const sortableBlocks = blocks
    .filter(
      (block): block is Record<string, unknown> =>
        Boolean(block) && typeof block === "object",
    )
    .map((block, index) => {
      const rawPosition = block.position;
      const position =
        typeof rawPosition === "number" && Number.isFinite(rawPosition)
          ? rawPosition
          : index;

      return {
        block,
        position,
        originalIndex: index,
      };
    })
    .sort((left, right) => {
      if (left.position === right.position) {
        return left.originalIndex - right.originalIndex;
      }

      return left.position - right.position;
    });

  return reindexContentBlocks(sortableBlocks.map(({ block }) => block));
};

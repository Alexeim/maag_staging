export const generateBlockId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const withBlockMeta = (
  block: Record<string, unknown>,
  position: number,
) => {
  const existingId =
    typeof block.id === "string" && block.id.trim() ? block.id.trim() : "";

  return {
    ...block,
    id: existingId || generateBlockId(),
    position,
  };
};

export const reindexContentBlocks = (blocks?: unknown) => {
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

export const sortAndNormalizeContentBlocks = (blocks?: unknown) => {
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

/**
 * The quotes the client uploads in setup 2/4 to compare contractors ("הצעת מחיר קבלן 1", "…2") are the client's own:
 * the contractor who got the job must not read a competitor's offer. Prisma filter for documents a restricted member sees.
 */
export const QUOTE_TITLE = 'הצעת מחיר קבלן';
export const QUOTE_DOCS_HIDDEN = { NOT: { stageId: null, title: { startsWith: QUOTE_TITLE } } } as const;

/** A project-wide document with the quote title – what QUOTE_DOCS_HIDDEN hides and the client sees as a contractor's offer. */
export const looksLikeQuote = (d: { stageId?: unknown; title?: unknown }) =>
  !d.stageId && typeof d.title === 'string' && d.title.trim().startsWith(QUOTE_TITLE);

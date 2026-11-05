/**
 * The quotes the client uploads in setup 2/4 to compare contractors ("הצעת מחיר קבלן 1", "…2") are the client's own:
 * the contractor who got the job must not read a competitor's offer. Prisma filter for documents a restricted member sees.
 */
export const QUOTE_DOCS_HIDDEN = { NOT: { stageId: null, title: { startsWith: 'הצעת מחיר קבלן' } } } as const;

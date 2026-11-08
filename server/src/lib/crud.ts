import type { RequestHandler, Router } from 'express';
import type { ZodObject, ZodRawShape } from 'zod';
import { forbidden, notFound } from './errors.js';
import { assertStage, parse, param } from './http.js';
import { me } from '../middleware/auth.js';
import { access, requireEdit, type Access } from '../middleware/project.js';

/** The subset of a Prisma model delegate that the generic routes use. */
interface Delegate {
  findMany(args: object): Promise<any[]>;
  findFirst(args: object): Promise<any | null>;
  create(args: object): Promise<any>;
  update(args: object): Promise<any>;
  delete(args: object): Promise<any>;
}

interface Options<Shape extends ZodRawShape> {
  model: Delegate;
  input: ZodObject<Shape>;
  map: (row: any) => unknown;
  orderBy?: object;
  /** extra guards for every route (e.g. requireBudget) */
  guard?: RequestHandler[];
  /** extra row filter by what the member may see – applied to list, update and delete alike */
  scope?: (a: Access) => object;
  /** fill in defaults / derived columns before create */
  prepare?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** extra checks on what a member writes (create, and the merged row on update); throw to refuse */
  check?: (a: Access, data: Record<string, unknown>) => void;
  /**
   * The model has an authorId column. A restricted member (contractor / professional) may then change or remove only the
   * rows they added themselves – the client's documents, photos and reminders are not theirs to delete.
   */
  authored?: boolean;
  /** fields a restricted member may still change on rows they didn't add (e.g. ticking a shopping item "done") */
  sharedFields?: string[];
}

/**
 * Standard project-scoped list/create/update/delete routes:
 *   GET /path · POST /path · PATCH /path/:id · DELETE /path/:id
 * Every query is filtered by the project in the url, so ids from another project 404.
 */
export function crud<Shape extends ZodRawShape>(router: Router, path: string, o: Options<Shape>) {
  const guard = o.guard ?? [];

  const scope = (a: Access) => (o.scope ? o.scope(a) : {});
  const own = async (a: Access, id: string) => {
    const row = await o.model.findFirst({ where: { ...scope(a), id, projectId: a.project.id } });
    if (!row) throw notFound();
    return row;
  };
  /** restricted members touch only their own rows (when the model records its author) */
  const mine = (a: Access, userId: string, row: { authorId?: string | null }) => !o.authored || a.seesBudget || row.authorId === userId;
  const checkStage = async (projectId: string, data: Record<string, unknown>) => {
    if (typeof data.stageId === 'string') await assertStage(projectId, data.stageId);
  };

  router.get(path, ...guard, async (req, res) => {
    const rows = await o.model.findMany({ where: { ...scope(access(req)), projectId: access(req).project.id }, orderBy: o.orderBy ?? { createdAt: 'asc' } });
    res.json(rows.map(o.map));
  });

  router.post(path, ...guard, requireEdit, async (req, res) => {
    const a = access(req);
    let data = parse(o.input, req.body) as Record<string, unknown>;
    if (o.prepare) data = o.prepare(data);
    o.check?.(a, data);
    await checkStage(a.project.id, data);
    const row = await o.model.create({ data: { ...data, projectId: a.project.id, ...(o.authored && { authorId: me(req).id }) } });
    res.status(201).json(o.map(row));
  });

  router.patch(`${path}/:id`, ...guard, requireEdit, async (req, res) => {
    const a = access(req);
    const row = await own(a, param(req));
    const data = parse(o.input.partial(), req.body) as Record<string, unknown>;
    if (!mine(a, me(req).id, row)) {
      const allowed = new Set(o.sharedFields ?? []);
      if (Object.keys(data).some((k) => data[k] !== undefined && !allowed.has(k))) throw forbidden('אפשר לערוך רק פריטים שהוספת');
    }
    o.check?.(a, { ...row, ...data });
    await checkStage(a.project.id, data);
    const updated = await o.model.update({ where: { id: row.id }, data });
    res.json(o.map(updated));
  });

  router.delete(`${path}/:id`, ...guard, requireEdit, async (req, res) => {
    const a = access(req);
    const row = await own(a, param(req));
    if (!mine(a, me(req).id, row)) throw forbidden('אפשר למחוק רק פריטים שהוספת');
    await o.model.delete({ where: { id: row.id } });
    res.status(204).end();
  });
}

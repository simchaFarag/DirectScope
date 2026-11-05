import type { RequestHandler, Router } from 'express';
import type { ZodObject, ZodRawShape } from 'zod';
import { notFound } from './errors.js';
import { assertStage, parse, param } from './http.js';
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
  const checkStage = async (projectId: string, data: Record<string, unknown>) => {
    if (typeof data.stageId === 'string') await assertStage(projectId, data.stageId);
  };

  router.get(path, ...guard, async (req, res) => {
    const rows = await o.model.findMany({ where: { ...scope(access(req)), projectId: access(req).project.id }, orderBy: o.orderBy ?? { createdAt: 'asc' } });
    res.json(rows.map(o.map));
  });

  router.post(path, ...guard, requireEdit, async (req, res) => {
    const projectId = access(req).project.id;
    let data = parse(o.input, req.body) as Record<string, unknown>;
    if (o.prepare) data = o.prepare(data);
    await checkStage(projectId, data);
    const row = await o.model.create({ data: { ...data, projectId } });
    res.status(201).json(o.map(row));
  });

  router.patch(`${path}/:id`, ...guard, requireEdit, async (req, res) => {
    const projectId = access(req).project.id;
    await own(access(req), param(req));
    const data = parse(o.input.partial(), req.body) as Record<string, unknown>;
    await checkStage(projectId, data);
    const row = await o.model.update({ where: { id: param(req) }, data });
    res.json(o.map(row));
  });

  router.delete(`${path}/:id`, ...guard, requireEdit, async (req, res) => {
    await own(access(req), param(req));
    await o.model.delete({ where: { id: param(req) } });
    res.status(204).end();
  });
}

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { crud } from '../lib/crud.js';
import { dateIn, fileRef, optionalStage, today } from '../lib/http.js';
import { QUOTE_DOCS_HIDDEN } from '../lib/quotes.js';
import { toContact, toDocument, toGallery, toInspiration, toReminder } from '../lib/serialize.js';

export const archiveRouter = Router();

crud(archiveRouter, '/reminders', {
  model: prisma.reminder,
  input: z.object({ stageId: optionalStage, text: z.string().trim().min(1).max(1000), color: z.enum(['yellow', 'blue']).default('yellow') }),
  map: toReminder,
});

crud(archiveRouter, '/documents', {
  model: prisma.document,
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  input: z.object({
    stageId: optionalStage,
    title: z.string().trim().min(1).max(255),
    date: dateIn.optional(),
    fileName: z.string().max(255).nullish(),
    fileUrl: fileRef.nullish(),
    preview: fileRef.nullish(),
  }),
  prepare: (d) => ({ ...d, date: d.date ?? today() }),
  scope: (a) => (a.seesBudget ? {} : QUOTE_DOCS_HIDDEN),
  map: toDocument,
});

crud(archiveRouter, '/gallery', {
  model: prisma.galleryItem,
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  input: z.object({ title: z.string().trim().min(1).max(255), date: dateIn.optional(), image: fileRef.nullish() }),
  prepare: (d) => ({ ...d, date: d.date ?? today() }),
  map: toGallery,
});

crud(archiveRouter, '/inspiration', {
  model: prisma.inspiration,
  orderBy: { createdAt: 'desc' },
  input: z.object({ title: z.string().trim().min(1).max(120), image: fileRef.nullish() }),
  map: toInspiration,
});

crud(archiveRouter, '/contacts', {
  model: prisma.contact,
  input: z.object({
    name: z.string().trim().min(1).max(120),
    title: z.string().max(120).default(''),
    phone: z.string().trim().min(3).max(20),
    avatar: fileRef.nullish(),
  }),
  map: toContact,
});

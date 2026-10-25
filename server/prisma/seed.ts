/**
 * Loads the app's demo data (src/data/mock.ts) into the database:
 * client "נדב ישראלי" (phone 0527683159) with the "פרויקט בנה ביתך" project, plus a contractor user (0504123538).
 * Safe to re-run: the demo users' projects are deleted and recreated.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as mock from '../../src/data/mock.ts';

const prisma = new PrismaClient();
const date = (s: string) => new Date(`${s}T00:00:00Z`);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

async function main() {
  const client = await prisma.user.upsert({
    where: { phone: '+972527683159' },
    create: { phone: '+972527683159', firstName: 'נדב', lastName: 'ישראלי', gender: 'male', role: 'client' },
    update: {},
  });
  const contractor = await prisma.user.upsert({
    where: { phone: '+972504123538' },
    create: { phone: '+972504123538', firstName: 'אבי', lastName: 'כהן', gender: 'male', role: 'contractor', avatar: '/avatars/a1.jpg' },
    update: {},
  });
  await prisma.project.deleteMany({ where: { ownerId: client.id } });

  const p = mock.mockProject;
  const project = await prisma.project.create({
    data: {
      ownerId: client.id,
      name: p.name,
      type: p.type,
      description: p.description,
      address: p.address,
      estimatedBudget: p.estimatedBudget,
      startDate: date(p.startDate),
      endDate: date(p.endDate),
      onboarded: true,
      members: { create: { name: 'אבי כהן', phone: contractor.phone, userId: contractor.id, role: 'professional', permission: 'edit', avatar: '/avatars/a1.jpg' } },
    },
  });
  const projectId = project.id;

  // mock stage ids ("plumbing"…) → database ids
  const stageId: Record<string, string> = {};
  for (const st of mock.mockStages) {
    const row = await prisma.stage.create({
      data: {
        projectId,
        order: st.order,
        name: st.name,
        icon: st.icon,
        budget: st.budget,
        contractAmount: st.contractAmount,
        paid: st.paid,
        duration: st.duration,
        startDate: date(st.startDate),
        endDate: date(st.endDate),
        memberAvatars: st.memberAvatars,
        tasks: { create: st.tasks.map((t, order) => ({ title: t.title, status: t.status, order })) },
      },
    });
    stageId[st.id] = row.id;
  }
  const sid = (id: string) => stageId[id] ?? Object.values(stageId)[0];

  await prisma.extraExpense.createMany({ data: mock.mockExtras.map(({ id: _, ...e }) => ({ ...e, projectId })) });
  await prisma.receipt.createMany({ data: mock.mockReceipts.map((r) => ({ projectId, stageId: sid(r.stageId), title: r.title, amount: r.amount, date: date(r.date) })) });
  await prisma.shoppingItem.createMany({ data: mock.mockShopping.map((s) => ({ projectId, stageId: sid(s.stageId), title: s.title, done: s.done })) });

  for (const [i, u] of mock.mockUpdates.entries()) {
    await prisma.update.create({
      data: {
        projectId,
        stageId: sid(u.stageId),
        authorId: u.author === 'אבי כהן' ? contractor.id : null,
        authorName: u.author,
        authorTitle: u.authorTitle,
        avatar: u.avatar,
        text: u.text,
        photos: u.photos ?? (u.photo ? [u.photo] : []),
        status: u.status,
        createdAt: hoursAgo(3 + i * 20),
        comments: { create: u.comments.map((c) => ({ authorName: c.author, text: c.text, authorId: c.mine ? client.id : null })) },
      },
    });
  }
  for (const [i, e] of mock.mockExceptions.entries()) {
    await prisma.exceptionReq.create({
      data: {
        projectId,
        stageId: sid(e.stageId),
        authorId: contractor.id,
        authorName: e.author,
        authorTitle: e.authorTitle,
        avatar: e.avatar,
        title: e.title,
        description: e.description,
        amount: e.amount,
        photos: e.photos ?? [],
        status: e.status,
        createdAt: hoursAgo(10 + i * 38),
      },
    });
  }

  await prisma.reminder.createMany({ data: mock.mockReminders.map((r) => ({ projectId, stageId: sid(r.stageId), text: r.text, color: r.color })) });
  await prisma.document.createMany({
    data: mock.mockDocs.map((d) => ({ projectId, stageId: d.stageId === 'general' ? null : sid(d.stageId), title: d.title, date: date(d.date) })),
  });
  await prisma.galleryItem.createMany({ data: mock.mockGallery.map((g) => ({ projectId, title: g.title, date: date(g.date), image: g.image })) });
  await prisma.inspiration.createMany({ data: mock.mockInspiration.map((x) => ({ projectId, title: x.title, image: x.image })) });
  await prisma.contact.createMany({ data: mock.mockContacts.map(({ id: _, ...c }) => ({ ...c, projectId })) });

  console.log(`Seeded project ${projectId} – log in as 0527683159 (client) or 0504123538 (contractor)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

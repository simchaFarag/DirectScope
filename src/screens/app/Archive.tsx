import { ArrowUpDown, BookUser, ClipboardList, FileText, Filter, Image as ImageIcon, MessageCircle, Phone, Plus, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TabScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, Chip, Lightbox, Modal, Button, Field, Select } from '@/components/ui';
import { useStore } from '@/data/store';
import { pickDocument, pickImages } from '@/lib/files';
import { cn, fmtDate } from '@/lib/format';
import { useStageOptions } from './Updates';

const tabs = [
  { id: 'docs', label: 'מסמכים', icon: FileText },
  { id: 'gallery', label: 'גלריה', icon: ImageIcon },
  { id: 'people', label: 'אנשים', icon: BookUser },
  { id: 'inspire', label: 'השראה', icon: Star },
  { id: 'info', label: 'תיעוד', icon: ClipboardList },
] as const;

type Tab = (typeof tabs)[number]['id'];

/** Upload a document: file + title + stage */
function DocUpload({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDoc } = useStore();
  const toast = useToast();
  const options = useStageOptions();
  const [file, setFile] = useState<{ name: string; preview?: string }>();
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState<string>('general');
  const close = () => {
    setFile(undefined);
    setTitle('');
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title="העלאת מסמך">
      <div className="space-y-4">
        <button
          onClick={() =>
            pickDocument().then((f) => {
              if (!f) return;
              setFile(f);
              if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
            })
          }
          className="checker flex h-28 w-full flex-col items-center justify-center gap-1 rounded-lg text-body"
        >
          <span className="rounded-lg bg-white/90 px-3 py-1">{file ? `📄 ${file.name}` : 'בחירת קובץ (PDF / Word / תמונה)'}</span>
        </button>
        <Field label="שם המסמך" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: תעודת אחריות" />
        <Select placeholder="שלב" options={options} value={stage} onChange={setStage} />
        <Button
          block
          disabled={!file || !title}
          onClick={() => {
            addDoc({ title, stageId: stage, fileName: file!.name, preview: file!.preview });
            toast('המסמך נשמר בארכיון');
            close();
          }}
        >
          שמירה
        </Button>
      </div>
    </Modal>
  );
}

export function Archive() {
  const nav = useNavigate();
  const toast = useToast();
  const { tab = 'gallery' } = useParams<{ tab: Tab }>();
  const { s, addGallery } = useStore();
  const [q, setQ] = useState('');
  const [asc, setAsc] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>();
  const [showFilter, setShowFilter] = useState(false);
  const [viewer, setViewer] = useState<{ images: { src: string; caption?: string }[]; index: number } | null>(null);
  const [docOpen, setDocOpen] = useState(false);

  const match = (...t: (string | undefined)[]) => !q || t.some((x) => x?.includes(q));
  const byStage = (id: string) => !stageFilter || id === stageFilter;
  const sortByDate = <T extends { date: string }>(a: T[]) => [...a].sort((x, y) => (asc ? 1 : -1) * x.date.localeCompare(y.date));
  const stageName = (id: string) => (id === 'general' ? 'כללי' : (s.stages.find((st) => st.id === id)?.name.split(' ')[0] ?? ''));

  const docs = sortByDate(s.docs.filter((d) => match(d.title) && byStage(d.stageId)));
  const gallery = sortByDate(s.gallery.filter((g) => match(g.title)));
  const info = s.updates.filter((u) => u.status === 'approved' && match(u.text, u.author) && byStage(u.stageId));

  const fab = () => {
    if (tab === 'inspire') nav('/app/inspiration/upload');
    else if (tab === 'info') nav('/app/updates/new');
    else if (tab === 'docs') setDocOpen(true);
    else if (tab === 'people') nav('/app/share/new');
    else
      pickImages({ multiple: true }).then((imgs) => {
        imgs.forEach((img) => addGallery('תמונה חדשה', img));
        if (imgs.length) toast(`${imgs.length} תמונות נוספו לגלריה`);
      });
  };

  return (
    <TabScreen>
      <div className="no-scrollbar flex justify-around overflow-x-auto bg-bg px-2 py-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => nav(`/app/archive/${id}`, { replace: true })} className={cn('flex min-w-[60px] flex-col items-center gap-1 text-caption', tab === id ? 'font-medium text-primary' : 'text-ink')}>
            <Icon size={24} strokeWidth={1.4} />
            {label}
            <span className={cn('h-0.5 w-6 rounded-full', tab === id ? 'bg-accent' : 'bg-transparent')} />
          </button>
        ))}
      </div>

      <div className="animate-fade-up space-y-4 px-6" key={tab}>
        <div className="flex items-center gap-2 rounded-full border border-primary-100 bg-white px-4 py-2.5">
          <Search size={18} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש" className="flex-1 bg-transparent text-body focus:outline-none" />
        </div>
        {tab !== 'inspire' && (
          <div className="flex gap-2">
            <button onClick={() => setShowFilter(!showFilter)} className="relative flex h-8 items-center gap-1 rounded-full border border-primary-100 bg-white px-3 text-caption">
              <Filter size={14} className="text-primary" /> סינון
              {stageFilter && <span className="absolute -top-0.5 left-1 h-2 w-2 rounded-full bg-danger" />}
            </button>
            <button onClick={() => setAsc(!asc)} className="flex h-8 items-center gap-1 rounded-full border border-primary-100 bg-white px-3 text-caption">
              <ArrowUpDown size={14} /> לפי תאריך {asc ? '↑' : '↓'}
            </button>
          </div>
        )}
        {showFilter && (
          <div className="flex flex-wrap gap-2">
            {[undefined, 'general', ...s.stages.map((st) => st.id)].map((id) => (
              <button key={id ?? 'all'} onClick={() => setStageFilter(id)} className={cn('h-7 rounded-full px-3 text-caption', stageFilter === id ? 'bg-primary text-white' : 'bg-primary-50')}>
                {id ? stageName(id) : 'הכל'}
              </button>
            ))}
          </div>
        )}

        {tab === 'docs' && (
          <div className="space-y-3">
            {docs.map((d) => (
              <button key={d.id} onClick={() => nav(`/app/doc/${d.id}`)} className="card-soft flex w-full items-center gap-3 p-4 text-right">
                <img src={d.preview ?? '/img/doc.png'} alt="" className="h-10 w-8 rounded object-cover shadow-sm4" />
                <div className="flex-1">
                  <p className="text-body font-medium">{d.title}</p>
                  <p className="text-body text-muted">{fmtDate(d.date)}</p>
                </div>
                <Chip className="self-start">{stageName(d.stageId)}</Chip>
              </button>
            ))}
            {!docs.length && <p className="py-6 text-center text-body text-muted">לא נמצאו מסמכים</p>}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  g.image &&
                  setViewer({
                    images: gallery.filter((x) => x.image).map((x) => ({ src: x.image!, caption: x.title })),
                    index: gallery.filter((x) => x.image).indexOf(g),
                  })
                }
                className={cn('relative aspect-[162/136] overflow-hidden rounded-lg text-right', !g.image && 'checker')}
                aria-label={g.title}
              >
                {g.image && <img src={g.image} alt="" className="h-full w-full object-cover" />}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-white/0 p-2 pt-6">
                  <p className="text-body font-medium">{g.title}</p>
                  <p className="text-caption">{fmtDate(g.date)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'people' && (
          <div className="space-y-3">
            {s.contacts
              .filter((c) => match(c.name, c.title))
              .map((c) => (
                <div key={c.id} className="card-soft flex items-center gap-3 p-4">
                  <button onClick={() => nav(`/app/contact/${c.id}`)} className="flex flex-1 items-center gap-3 text-right">
                    <Avatar src={c.avatar} name={c.name} size={44} />
                    <span className="flex-1">
                      <span className="block text-body font-medium">{c.name}</span>
                      <span className="block text-body text-muted">{c.title}</span>
                      <span className="block text-body text-muted">{c.phone}</span>
                    </span>
                  </button>
                  <a href={`tel:${c.phone}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white" aria-label={`התקשר ל${c.name}`}>
                    <Phone size={20} />
                  </a>
                  <a href={`https://wa.me/972${c.phone.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white" aria-label={`וואטסאפ ל${c.name}`}>
                    <MessageCircle size={20} />
                  </a>
                </div>
              ))}
            {s.members.map((m) => (
              <div key={m.id} className="card-soft flex items-center gap-3 p-4">
                <button onClick={() => nav(`/app/share/${m.id}`)} className="flex flex-1 items-center gap-3 text-right">
                  <Avatar src={m.avatar} name={m.name} size={44} />
                  <span className="flex-1">
                    <span className="block text-body font-medium">{m.name}</span>
                    <span className="block text-body text-muted">שותף · {m.permission === 'edit' ? 'עריכה' : 'צפייה'}</span>
                  </span>
                </button>
                <a href={`tel:${m.phone}`} className="grid h-9 w-9 place-items-center" aria-label={`התקשר ל${m.name}`}>
                  <Phone size={20} />
                </a>
              </div>
            ))}
          </div>
        )}

        {tab === 'inspire' && (
          <div className="columns-2 gap-3 [&>*]:mb-3">
            {[...new Set(s.inspiration.map((i) => i.title))]
              .filter((cat) => match(cat))
              .map((cat, idx) => {
                const imgs = s.inspiration.filter((i) => i.title === cat && i.image);
                return (
                  <button
                    key={cat}
                    onClick={() => nav(`/app/archive/inspire/${encodeURIComponent(cat)}`)}
                    className={cn('relative block w-full break-inside-avoid overflow-hidden rounded-lg', !imgs.length && 'checker', idx % 3 === 0 ? 'h-48' : 'h-32')}
                  >
                    {imgs[0] && <img src={imgs[0].image} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 text-caption">
                      {cat} · {imgs.length}
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            {info.map((u) => {
              const photos = u.photos?.length ? u.photos : u.photo ? [u.photo] : [];
              return (
                <article key={u.id} className="card-soft p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={u.avatar} name={u.author} />
                    <div className="flex-1">
                      <p className="text-body font-medium">{u.author}</p>
                      <p className="text-caption text-muted">{u.authorTitle}</p>
                    </div>
                    <span className="text-left text-caption text-muted">{u.date ? fmtDate(u.date) : u.time}</span>
                  </div>
                  <p className="mt-3 text-body">{u.text}</p>
                  {photos.length > 0 && (
                    <button onClick={() => setViewer({ images: photos.map((src) => ({ src })), index: 0 })} className="mt-3 block w-full">
                      <img src={photos[0]} alt="" className="aspect-[2/1] w-full rounded-lg object-cover" />
                    </button>
                  )}
                  <div className="mt-3 flex justify-start">
                    <Chip>{stageName(u.stageId)}</Chip>
                  </div>
                </article>
              );
            })}
            {!info.length && <p className="py-6 text-center text-body text-muted">עדכונים שאושרו יופיעו כאן</p>}
          </div>
        )}
      </div>

      <button onClick={fab} className="fixed bottom-28 left-[max(1.5rem,calc(50%-191px))] z-20 grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-bar" aria-label="הוספה">
        <Plus size={28} />
      </button>
      <Lightbox images={viewer?.images ?? []} index={viewer?.index ?? null} onClose={() => setViewer(null)} />
      <DocUpload open={docOpen} onClose={() => setDocOpen(false)} />
    </TabScreen>
  );
}

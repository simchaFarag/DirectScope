import { useState } from 'react';
import { Icon, type IconName } from '@/components/FigmaIcon';
import { useNavigate, useParams } from 'react-router-dom';
import { TabScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, Chip, Lightbox, Modal, Button, Field, Select } from '@/components/ui';
import { useStore } from '@/data/store';
import { pickDocument, pickImages } from '@/lib/files';
import { cn, fmtDate } from '@/lib/format';
import { useStageOptions } from './Updates';

/* Figma "label icon" row */
const tabs = [
  { id: 'docs', label: 'מסמכים', icon: 'docs' },
  { id: 'gallery', label: 'גלריה', icon: 'gallery' },
  { id: 'people', label: 'אנשים', icon: 'lContact' },
  { id: 'inspire', label: 'השראה', icon: 'star' },
  { id: 'info', label: 'תיעוד', icon: 'checklist' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[];

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
    <TabScreen white>
      {/* Figma "Archive screen - *": 342px column, 16px gaps */}
      <div className="flex flex-col gap-4 px-6 pt-4 lg:mx-auto lg:max-w-5xl">
        <div className="flex items-start justify-center gap-4 py-0.5">
          {tabs.map(({ id, label, icon }) => (
            <button key={id} onClick={() => nav(`/app/archive/${id}`, { replace: true })} className={cn('flex w-12 flex-col items-center py-0.5', tab === id ? 'gap-2' : 'gap-0.5')}>
              <span className="flex w-full flex-col items-center gap-0.5">
                <Icon name={icon} className={tab === id ? 'text-primary' : 'text-ink'} />
                <span className={cn('whitespace-nowrap text-caption', tab === id ? 'font-medium text-primary' : 'text-ink')}>{label}</span>
              </span>
              {tab === id && <span className="h-0.5 w-6 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-4 rounded-full border border-primary-100 px-4 lg:max-w-md">
          <Icon name="search" className="text-ink" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש" className="flex-1 bg-transparent py-2.5 text-caption placeholder:text-ink focus:outline-none" />
        </label>

        {tab !== 'inspire' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)} className="flex h-8 items-center rounded-full border border-primary-100 pe-4 ps-2 text-caption">
              <span className="relative">
                <Icon name="filter" className={stageFilter ? 'text-primary' : 'text-ink'} />
                {stageFilter && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-danger" />}
              </span>
              סינון
            </button>
            <button onClick={() => setAsc(!asc)} className="flex h-8 items-center rounded-full border border-primary-100 pe-4 ps-2 text-caption">
              <Icon name="sort" className={cn('transition-transform', asc && 'rotate-180')} />
              לפי תאריך
            </button>
          </div>
        )}
        {showFilter && tab !== 'inspire' && (
          <div className="flex flex-wrap gap-2">
            {[undefined, 'general', ...s.stages.map((st) => st.id)].map((id) => (
              <button key={id ?? 'all'} onClick={() => setStageFilter(id)} className={cn('h-7 rounded-full px-3 text-caption', stageFilter === id ? 'bg-primary text-white' : 'bg-primary-50')}>
                {id ? stageName(id) : 'הכל'}
              </button>
            ))}
          </div>
        )}

        <div className="animate-fade-up" key={tab}>
          {/* Figma "doc card" */}
          {tab === 'docs' && (
            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {docs.map((d) => (
                <button key={d.id} onClick={() => nav(`/app/doc/${d.id}`)} className="flex w-full items-center gap-2 overflow-hidden rounded-lg bg-bg p-4 text-right lg:bg-white">
                  <img src={d.preview ?? '/img/doc.png'} alt="" className="h-8 w-8 shrink-0 rounded-[5.333px] object-cover" />
                  <span className="flex flex-col gap-1.5 whitespace-nowrap">
                    <span className="max-w-[180px] truncate text-body font-medium leading-4 tracking-[0.042px]">{d.title}</span>
                    <span className="text-body text-muted">{fmtDate(d.date)}</span>
                  </span>
                  <span className="flex flex-1 self-stretch">
                    <Chip className="ms-auto h-4 rounded-lg">{stageName(d.stageId)}</Chip>
                  </span>
                </button>
              ))}
              {!docs.length && <p className="py-6 text-center text-body text-muted lg:col-span-full">לא נמצאו מסמכים</p>}
            </div>
          )}

          {/* Figma "doc square" 162×136 */}
          {tab === 'gallery' && (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  className={cn('relative flex h-[136px] items-end overflow-hidden rounded-lg p-2 text-right', !g.image && 'checker')}
                  aria-label={g.title}
                >
                  {g.image && <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  {/* keeps the Figma caption readable over a real photo */}
                  {g.image && <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 to-white/0" />}
                  <span className="relative flex flex-col gap-1.5 whitespace-nowrap">
                    <span className="max-w-[180px] truncate text-body font-medium leading-4 tracking-[0.042px]">{g.title}</span>
                    <span className="text-body text-muted">{fmtDate(g.date)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Figma "phone card" */}
          {tab === 'people' && (
            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              {[
                ...s.contacts.filter((c) => match(c.name, c.title)).map((c) => ({ id: c.id, name: c.name, role: c.title, phone: c.phone, avatar: c.avatar, to: `/app/contact/${c.id}` })),
                ...s.members.filter((m) => match(m.name)).map((m) => ({ id: m.id, name: m.name, role: `שותף · ${m.permission === 'edit' ? 'עריכה' : 'צפייה'}`, phone: m.phone, avatar: m.avatar, to: `/app/share/${m.id}` })),
              ].map((c) => (
                <div key={c.id} className="flex items-center gap-4 rounded-lg bg-bg p-4 lg:bg-white">
                  <button onClick={() => nav(c.to)} className="flex items-center gap-4 text-right">
                    <Avatar src={c.avatar} name={c.name} size={40} />
                    <span className="flex flex-col gap-1 whitespace-nowrap">
                      <span className="text-body font-medium leading-4 tracking-[0.042px]">{c.name}</span>
                      <span className="text-body text-muted">{c.role}</span>
                      <span className="text-body text-muted">{c.phone}</span>
                    </span>
                  </button>
                  <span className="flex flex-1 items-center justify-end gap-4">
                    <a href={`tel:${c.phone}`} aria-label={`התקשר ל${c.name}`}>
                      <Icon name="call" />
                    </a>
                    <a href={`https://wa.me/972${c.phone.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener" aria-label={`וואטסאפ ל${c.name}`}>
                      <Icon name="chat" />
                    </a>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Figma "doc square – only name" */}
          {tab === 'inspire' && (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...new Set(s.inspiration.map((i) => i.title))]
                .filter((cat) => match(cat))
                .map((cat) => {
                  const img = s.inspiration.find((i) => i.title === cat && i.image)?.image;
                  return (
                    <button key={cat} onClick={() => nav(`/app/archive/inspire/${encodeURIComponent(cat)}`)} className={cn('relative flex h-[136px] items-end overflow-hidden rounded-lg p-2 text-right', !img && 'checker')}>
                      {img && <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      {img && <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/95 to-white/0" />}
                      <span className="relative max-w-[180px] truncate whitespace-nowrap text-body font-medium leading-4 tracking-[0.042px]">{cat}</span>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Figma "info card" */}
          {tab === 'info' && (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start">
              {info.map((u) => {
                const photos = u.photos?.length ? u.photos : u.photo ? [u.photo] : [];
                return (
                  <article key={u.id} className="flex flex-col items-start gap-4 rounded-2xl bg-bg p-4 lg:bg-white">
                    <div className="flex w-full items-center gap-4">
                      <Avatar src={u.avatar} name={u.author} size={40} />
                      <div className="flex flex-col whitespace-nowrap text-caption">
                        <span>{u.author}</span>
                        <span className="text-muted">{u.authorTitle}</span>
                      </div>
                      {/* Figma: date over time ("21.01.26" / "14:30"); a stored "date · time" is split, else date + relative time */}
                      <div className="flex flex-1 flex-col items-end whitespace-nowrap text-caption text-muted">
                        {(u.time.includes(' · ') ? u.time.split(' · ') : [u.date && fmtDate(u.date).replace(/\.\d\d(\d\d)$/, '.$1'), u.time]).map((x, i) => x && <span key={i}>{x}</span>)}
                      </div>
                    </div>
                    <p className="w-full text-body">{u.text}</p>
                    {photos.length > 0 && (
                      <button onClick={() => setViewer({ images: photos.map((src) => ({ src })), index: 0 })} className="block h-[136px] w-full overflow-hidden rounded-lg">
                        <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                      </button>
                    )}
                    <Chip className="h-4 rounded-lg">{stageName(u.stageId)}</Chip>
                  </article>
                );
              })}
              {!info.length && <p className="py-6 text-center text-body text-muted lg:col-span-full">עדכונים שאושרו יופיעו כאן</p>}
            </div>
          )}
        </div>
      </div>

      {/* Figma "icon buttoms" 56px – not on the תיעוד tab */}
      {tab !== 'info' && (
        <button onClick={fab} className="fixed bottom-[100px] lg:bottom-10 right-[max(22px,calc(50%-173px))] z-20 grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-[0_0_5px_rgba(62,165,244,0.1)] lg:right-[max(2.5rem,calc(50%-488px))]" aria-label="הוספה">
          <Icon name="fabAdd" />
        </button>
      )}
      <Lightbox images={viewer?.images ?? []} index={viewer?.index ?? null} onClose={() => setViewer(null)} />
      <DocUpload open={docOpen} onClose={() => setDocOpen(false)} />
    </TabScreen>
  );
}

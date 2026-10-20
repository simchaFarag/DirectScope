import { Download, MessageCircle, Phone, Plus, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heading, SubScreen } from '@/components/layout';
import { useToast } from '@/components/toast';
import { Avatar, BottomActions, Button, Chip, Field, Lightbox, SectionTitle, UploadSlot } from '@/components/ui';
import { useStore } from '@/data/store';
import { fmtDate, ils } from '@/lib/format';

function useStageName() {
  const { s } = useStore();
  return (id: string) => (id === 'general' ? 'כללי' : (s.stages.find((st) => st.id === id)?.name ?? ''));
}

/** Share via the OS share sheet when available (mock otherwise) */
function useShare() {
  const toast = useToast();
  return (title: string) => {
    if (navigator.share) navigator.share({ title, text: `${title} – DirectScope` }).catch(() => {});
    else toast('הקישור לשיתוף הועתק', 'info');
  };
}

/** Document / receipt viewer – opens from the archive docs list and the stage expense list */
export function FileViewer({ kind }: { kind: 'doc' | 'receipt' }) {
  const { id } = useParams();
  const { s } = useStore();
  const toast = useToast();
  const share = useShare();
  const stageName = useStageName();
  const [zoom, setZoom] = useState<number | null>(null);
  const item = kind === 'doc' ? s.docs.find((d) => d.id === id) : s.receipts.find((r) => r.id === id);
  if (!item) return <SubScreen title="לא נמצא">{null}</SubScreen>;
  const preview = item.preview ?? '/img/doc.png';
  const fileName = 'fileName' in item && item.fileName ? item.fileName : `${item.title}.pdf`;

  return (
    <SubScreen title={kind === 'doc' ? 'מסמך' : 'אסמכתא'}>
      <div className="space-y-5 px-6 pb-6">
        <button onClick={() => setZoom(0)} className="block w-full overflow-hidden rounded-lg bg-white p-4 shadow-blue">
          <img src={preview} alt="" className="mx-auto max-h-[420px] object-contain" />
        </button>
        <div>
          <h1 className="font-display text-h2 font-bold">{item.title}</h1>
          <p className="text-body text-muted">{fileName}</p>
        </div>
        <dl className="card divide-y divide-line px-4 text-body">
          <div className="flex justify-between py-3">
            <dt className="text-muted">שלב</dt>
            <dd>
              <Chip>{stageName(item.stageId)}</Chip>
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-muted">תאריך</dt>
            <dd>{fmtDate(item.date)}</dd>
          </div>
          {'amount' in item && (
            <div className="flex justify-between py-3">
              <dt className="text-muted">סכום</dt>
              <dd className="font-semibold">{ils(item.amount)}</dd>
            </div>
          )}
        </dl>
      </div>
      <BottomActions>
        <Button className="flex-1" onClick={() => toast('ההורדה תהיה זמינה אחרי חיבור לשרת', 'info')}>
          <Download size={16} /> הורדה
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => share(item.title)}>
          <Share2 size={16} /> שיתוף
        </Button>
      </BottomActions>
      <Lightbox images={[{ src: preview, caption: item.title }]} index={zoom} onClose={() => setZoom(null)} />
    </SubScreen>
  );
}

/** Contact card – opens when tapping a contact's name (designer usability note) */
export function ContactPage() {
  const { id } = useParams();
  const { s } = useStore();
  const nav = useNavigate();
  const c = s.contacts.find((x) => x.id === id);
  if (!c) return <SubScreen title="לא נמצא">{null}</SubScreen>;
  const updates = s.updates.filter((u) => u.author === c.name);
  const wa = `https://wa.me/972${c.phone.replace(/\D/g, '').replace(/^0/, '')}`;
  return (
    <SubScreen title="איש קשר">
      <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-2">
        <Avatar src={c.avatar} name={c.name} size={96} />
        <h1 className="font-display text-h2 font-bold">{c.name}</h1>
        <p className="text-body text-muted">{c.title}</p>
        <p className="text-body" dir="ltr">
          {c.phone}
        </p>
        <div className="mt-2 flex gap-3">
          <a href={`tel:${c.phone}`} className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-btn font-medium text-white">
            <Phone size={16} /> חיוג
          </a>
          <a href={wa} target="_blank" rel="noopener" className="flex h-10 items-center gap-2 rounded-full border border-primary bg-white px-5 text-btn font-medium">
            <MessageCircle size={16} /> וואטסאפ
          </a>
        </div>
      </div>
      <div className="px-6 pb-10">
        <SectionTitle>עדכונים אחרונים</SectionTitle>
        <div className="space-y-3">
          {updates.map((u) => (
            <button key={u.id} onClick={() => nav('/app/updates')} className="card block w-full p-4 text-right">
              <div className="flex justify-between text-caption text-muted">
                <span>{u.time}</span>
                <Chip>{s.stages.find((st) => st.id === u.stageId)?.name.split(' ')[0]}</Chip>
              </div>
              <p className="mt-2 text-body">{u.text}</p>
            </button>
          ))}
          {!updates.length && <p className="text-body text-muted">אין עדכונים מאיש קשר זה</p>}
        </div>
      </div>
    </SubScreen>
  );
}

/** Inspiration category page – opens from a tile in Archive → השראה */
export function InspirationCategory() {
  const { cat = '' } = useParams();
  const category = decodeURIComponent(cat);
  const { s } = useStore();
  const nav = useNavigate();
  const [zoom, setZoom] = useState<number | null>(null);
  const items = s.inspiration.filter((i) => i.title === category && i.image);
  return (
    <SubScreen title="לוח השראה">
      <Heading title={category} sub={`${items.length} תמונות`} />
      <div className="grid grid-cols-2 gap-3 px-6 pb-28 lg:grid-cols-3">
        {items.map((it, i) => (
          <button key={it.id} onClick={() => setZoom(i)} className="overflow-hidden rounded-lg">
            <img src={it.image} alt="" className="aspect-square w-full object-cover" />
          </button>
        ))}
        <UploadSlot className="aspect-square" onAdd={() => nav(`/app/inspiration/upload?cat=${encodeURIComponent(category)}`)} label="הוספת תמונה" />
      </div>
      <BottomActions>
        <Button block onClick={() => nav(`/app/inspiration/upload?cat=${encodeURIComponent(category)}`)}>
          <Plus size={16} /> הוספת תמונה ל{category}
        </Button>
      </BottomActions>
      <Lightbox images={items.map((i) => ({ src: i.image!, caption: i.title }))} index={zoom} onClose={() => setZoom(null)} />
    </SubScreen>
  );
}

/** Project details + dates – opens from the pencil on the schedule "תאריכים" card */
export function ProjectEdit() {
  const nav = useNavigate();
  const toast = useToast();
  const { s, setProject } = useStore();
  const [name, setName] = useState(s.project.name);
  const [address, setAddress] = useState(s.project.address);
  const [start, setStart] = useState(s.project.startDate);
  const [end, setEnd] = useState(s.project.endDate);
  const bad = end < start;
  return (
    <SubScreen title="פרטי פרויקט" sheet>
      <Heading title="עריכת פרויקט" sub="שם, כתובת ותאריכים" />
      <div className="space-y-5 px-6">
        <Field label="שם הפרויקט" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="כתובת הנכס" value={address} onChange={(e) => setAddress(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="התחלה" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <Field label="סיום (משוער)" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        {bad && <p className="text-caption text-danger">תאריך הסיום לפני תאריך ההתחלה</p>}
      </div>
      <BottomActions>
        <Button
          block
          disabled={!name || bad}
          onClick={() => {
            setProject({ name, address, startDate: start, endDate: end });
            toast('פרטי הפרויקט עודכנו');
            nav(-1);
          }}
        >
          שמירה
        </Button>
      </BottomActions>
    </SubScreen>
  );
}

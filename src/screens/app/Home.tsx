import { AlertTriangle, ArrowUpLeft, CalendarClock, ClipboardList, Maximize, TrendingUp, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TabScreen } from '@/components/layout';
import { Gauge, ProgressBar } from '@/components/ui';
import { stageProgress, useStore, useTotals } from '@/data/store';
import { cn, fmtDate, greeting, ils } from '@/lib/format';
import { useState } from 'react';

export function Home() {
  const nav = useNavigate();
  const { s } = useStore();
  const t = useTotals();
  const isContractor = s.user.role === 'contractor';
  const current = s.stages.find((st) => stageProgress(st) < 100) ?? s.stages[s.stages.length - 1];
  const doneStage = [...s.stages].reverse().find((st) => stageProgress(st) === 100);
  const pendingEx = s.exceptions.find((e) => e.status === 'pending');
  const daily = s.updates.filter((u) => u.photo).slice(0, 5);
  const [slide, setSlide] = useState(0);
  if (!daily.length) daily.push({ id: 'placeholder', stageId: current.id, author: '', authorTitle: '', time: 'היום', text: 'עוד אין עדכונים עם תמונה', status: 'approved', comments: [] });

  return (
    <TabScreen home>
      <div className="animate-fade-up space-y-6 px-6">
        <div className="flex items-center gap-3">
          <span className="text-[40px] leading-none">⛅</span>
          <div>
            <h1 className="text-lg font-medium">
              {greeting()} {s.user.firstName},
            </h1>
            <p className="text-body text-muted">כמה טוב שחזרת הביתה</p>
          </div>
        </div>

        {/* Budget card — the client cares most about money */}
        <section className="card relative overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <span className="text-caption">{isContractor ? 'סכום חוזה' : 'ניהול תקציב'}</span>
            <button onClick={() => nav('/app/budget')} className="text-caption underline">
              הצג עוד
            </button>
          </div>
          {isContractor ? (
            <div className="py-6 text-center">
              <p className="text-body text-primary">סכום חוזה קבלן</p>
              <p className="font-display text-h1 font-bold text-primary">{ils(s.stages.reduce((a, st) => a + st.contractAmount, 0))}</p>
            </div>
          ) : (
            <>
              <Gauge value={t.total ? t.paid / t.total : 0}>
                <p className="text-body font-medium text-primary">תשלום עד כה</p>
                <p className="font-display text-h1 font-bold text-primary">{ils(t.paid)}</p>
              </Gauge>
              <div className="mt-2 flex justify-between">
                <div>
                  <p className="text-lg font-semibold">{ils(t.total)}</p>
                  <p className="text-caption text-muted">סה״כ מעודכן</p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold">{ils(t.remaining)}</p>
                  <p className="text-caption text-muted">יתרה לתשלום</p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Project status */}
        <button onClick={() => nav('/app/schedule')} className="block w-full text-right">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-body">סטטוס פרויקט</span>
            <span className="font-display text-h3 font-bold">{t.progress}% הושלמו!</span>
          </div>
          <ProgressBar value={t.progress} className="border border-primary-100" />
          <p className="mt-2 flex items-center gap-1 text-caption">
            <CalendarClock size={14} className="text-primary" /> {t.daysLeft} יום נותרו לסיום המשוער
          </p>
        </button>

        {/* Daily updates – swipe for previous days (designer note) */}
        <div>
          <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6" onScroll={(e) => setSlide(Math.round(Math.abs(e.currentTarget.scrollLeft) / (e.currentTarget.clientWidth - 36)))}>
            {daily.map((u) => {
              const st = s.stages.find((x) => x.id === u.stageId) ?? current;
              return (
                <button key={u.id} onClick={() => nav('/app/updates')} className="card block w-[calc(100%-12px)] shrink-0 snap-center overflow-hidden text-right">
                  <div className="relative aspect-[340/418] bg-cover bg-center" style={{ backgroundImage: `url(${u.photo ?? '/img/house.png'})` }}>
                    <span className="absolute right-3 top-3 rounded bg-white px-2 py-0.5 text-caption">עידכון יומי</span>
                    <span className="absolute left-3 top-3 rounded-full bg-success-soft px-2 py-0.5 text-caption text-success-dark">{u.date ? fmtDate(u.date) : u.time}</span>
                    <span className="absolute bottom-3 left-3 grid h-8 w-8 place-items-center rounded-full bg-white">
                      <Maximize size={16} />
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-body">
                      שלב בנייה: <span className="font-display text-h3 font-bold">{st.name}</span>
                    </p>
                    <p className="line-clamp-1 text-caption text-muted">{u.text}</p>
                    <div className="mt-1 flex gap-4 text-caption">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={14} className="text-primary" /> {st.tasks.length} משימות
                      </span>
                      {!isContractor && (
                        <span className="flex items-center gap-1">
                          <Wallet size={14} className="text-primary" /> {ils(st.paid)} / {ils(st.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {daily.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {daily.map((u, i) => (
                <span key={u.id} className={cn('h-1.5 rounded-full transition-all', i === slide ? 'w-4 bg-primary' : 'w-1.5 bg-primary-200')} />
              ))}
            </div>
          )}
        </div>

        {/* Quick status cards */}
        <div className="no-scrollbar -mx-6 flex gap-3 overflow-x-auto px-6">
          {pendingEx && (
            <button onClick={() => nav('/app/exceptions')} className="flex min-w-[240px] items-center gap-3 rounded-lg bg-gradient-to-l from-accent-soft to-white p-3 text-right shadow-blue">
              <AlertTriangle className="text-accent-dark" size={32} />
              <div className="flex-1">
                <p className="text-body font-medium">{s.stages.find((st) => st.id === pendingEx.stageId)?.name}</p>
                <p className="text-caption text-muted">{isContractor ? 'ממתין לאישור הלקוח' : 'שינוי מחכה לאישורך'}</p>
              </div>
              <ArrowUpLeft size={18} />
            </button>
          )}
          {doneStage && (
            <button onClick={() => nav(`/app/schedule/${doneStage.id}`)} className="flex min-w-[240px] items-center gap-3 rounded-lg bg-gradient-to-l from-success-soft/60 to-white p-3 text-right shadow-blue">
              <TrendingUp className="text-success" size={32} />
              <div className="flex-1">
                <p className="text-body font-medium">{doneStage.name}</p>
                <p className="text-caption text-muted">השלב הושלם בהצלחה</p>
              </div>
            </button>
          )}
        </div>

        {/* Recent documents */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-caption">מסמכים אחרונים</span>
            <button onClick={() => nav('/app/archive/gallery')} className="text-caption underline">
              צפייה בגלריה
            </button>
          </div>
          <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
            {['/img/doc.png', '/img/thumb1.png', '/img/thumb2.png', '/img/thumb3.png', '/img/doc.png'].map((src, i) => (
              <button key={i} onClick={() => nav(i === 0 || i === 4 ? '/app/archive/docs' : '/app/archive/gallery')} className="shrink-0">
                <img src={src} alt="" className="h-[72px] w-[72px] rounded-lg bg-white object-cover shadow-blue" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </TabScreen>
  );
}

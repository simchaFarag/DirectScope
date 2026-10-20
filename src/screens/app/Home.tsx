import { Icon } from '@/components/FigmaIcon';
import { useNavigate } from 'react-router-dom';
import { TabScreen } from '@/components/layout';
import { Gauge, ProgressBar } from '@/components/ui';
import { stageProgress, useStore, useTotals } from '@/data/store';
import { fmtDate, greeting, ils } from '@/lib/format';

export function Home() {
  const nav = useNavigate();
  const { s } = useStore();
  const t = useTotals();
  const isContractor = s.user.role === 'contractor';
  const current = s.stages.find((st) => stageProgress(st) < 100) ?? s.stages[s.stages.length - 1];
  const doneStage = [...s.stages].reverse().find((st) => stageProgress(st) === 100);
  const pendingEx = s.exceptions.find((e) => e.status === 'pending');
  const daily = s.updates.filter((u) => u.photo).slice(0, 5);
  if (!daily.length) daily.push({ id: 'placeholder', stageId: current.id, author: '', authorTitle: '', time: 'היום', text: 'עוד אין עדכונים עם תמונה', status: 'approved', comments: [] });

  return (
    <TabScreen home>
      <div className="animate-fade-up space-y-8 px-6 pt-4">
        <div className="flex items-start gap-2 px-[25px]">
          <img src="/img/weather.svg" alt="" className="h-12 w-12" />
          <div>
            <h1 className="text-lg">
              {greeting()} {s.user.firstName},
            </h1>
            <p className="text-body text-muted">כמה טוב שחזרת הביתה</p>
          </div>
        </div>

        {/* Desktop: budget | daily update | status + quick cards + docs (mobile keeps the Figma order) */}
        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-6 lg:space-y-0 xl:grid-cols-3">
        {/* Budget card — the client cares most about money */}
        <section className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl bg-white p-4 shadow-[0_0_5px_rgba(62,165,244,0.1)] lg:col-start-1 lg:row-start-1 xl:row-span-3">
          <img src="/img/card-clouds.svg" alt="" className="pointer-events-none absolute left-[13.5%] right-[15.8%] top-[7.8%] w-[70.7%]" />
          <div className="relative flex w-full items-center justify-between">
            <span className="flex h-6 items-center rounded bg-white px-2 text-caption">{isContractor ? 'סכום חוזה' : 'ניהול תקציב'}</span>
            <button onClick={() => nav('/app/budget')} className="text-body leading-4 tracking-[0.042px] underline">
              הצג עוד
            </button>
          </div>
          {isContractor ? (
            <div className="relative py-6 text-center">
              <p className="text-body text-primary">סכום חוזה קבלן</p>
              <p className="font-display text-h1 font-bold text-primary">{ils(s.stages.reduce((a, st) => a + st.contractAmount, 0))}</p>
            </div>
          ) : (
            <div className="relative flex w-full flex-col items-center gap-6">
              <Gauge value={t.total ? t.paid / t.total : 0}>
                <p className="font-display text-h3 font-bold text-primary">תשלום עד כה</p>
                <p className="font-display text-[24px] font-bold leading-[28px] text-primary">{ils(t.paid)}</p>
              </Gauge>
              <div className="flex w-full items-start justify-between whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <p className="text-lg font-semibold leading-5">{ils(t.total)}</p>
                  <p className="text-body text-muted">סה״כ מעודכן</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-lg font-semibold leading-5">{ils(t.remaining)}</p>
                  <p className="text-body text-muted">יתרה לתשלום</p>
                </div>
              </div>
              <img src="/img/card-tree.svg" alt="" className="pointer-events-none absolute left-[29%] top-[79%] w-[6.1%]" />
            </div>
          )}
        </section>

        {/* Project status */}
        <button onClick={() => nav('/app/schedule')} className="flex w-full flex-col gap-2 text-right lg:col-start-2 lg:row-start-1 lg:rounded-2xl lg:bg-white lg:p-4 lg:shadow-[0_0_5px_rgba(62,165,244,0.1)] xl:col-start-3">
          <div className="flex w-full items-start justify-between">
            <span className="text-lg">סטטוס פרויקט</span>
            <span className="font-display text-h3 font-bold">{t.progress}% הושלמו!</span>
          </div>
          <ProgressBar value={t.progress} className="shadow-[0_0_3px_rgba(31,78,121,0.2)]" />
          <p className="flex items-center gap-2 text-body">
            <Icon name="date" size={16} className="text-primary" /> {t.daysLeft} יום נותרו לסיום המשוער
          </p>
        </button>

        {/* Daily updates – swipe for previous days (designer note) */}
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-2 xl:col-start-2 xl:row-span-3 xl:row-start-1">
          <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
            {daily.map((u) => {
              const st = s.stages.find((x) => x.id === u.stageId) ?? current;
              return (
                <button key={u.id} onClick={() => nav('/app/updates')} className="block w-full shrink-0 snap-center rounded-2xl bg-white text-right shadow-[0_0_5px_rgba(62,165,244,0.1)] lg:w-full">
                  <div className="relative flex aspect-[340/418] flex-col justify-between rounded-2xl bg-cover bg-center p-4" style={{ backgroundImage: `url(${u.photo ?? '/img/house.png'})` }}>
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 items-center rounded bg-bg px-2 text-caption">עידכון יומי</span>
                      <span className="flex h-4 items-center rounded-lg bg-success-soft px-2 text-caption text-success-dark">{u.date ? fmtDate(u.date) : u.time}</span>
                    </div>
                    <span className="grid h-8 w-8 place-items-center self-end rounded-full bg-white shadow-[0_0_5px_rgba(62,165,244,0.1)]">
                      <Icon name="resize" />
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-2 px-4 pb-4 pt-2">
                    <p className="flex items-start gap-1 text-lg">
                      שלב בנייה: <span className="font-display text-h3 font-bold">{st.name}</span>
                    </p>
                    <div className="flex items-center gap-4 text-caption">
                      <span className="flex items-center gap-2">
                        <Icon name="task" size={16} className="text-primary" /> {st.tasks.length} משימות
                      </span>
                      {!isContractor && (
                        <span className="flex items-center gap-2">
                          <Icon name="wallet" size={16} className="text-primary" /> {ils(st.paid)} / {ils(st.budget)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick status cards (Figma: white, 240×64, coloured glow behind the text) */}
        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-2 xl:col-start-3">
          {pendingEx && (
            <button onClick={() => nav('/app/exceptions')} className="relative flex h-16 w-full items-center gap-4 overflow-hidden rounded-lg bg-white px-4 py-2 text-right lg:shadow-[0_0_5px_rgba(62,165,244,0.1)]">
              <span className="absolute left-[42px] top-[17px] h-8 w-[120px] blur-[40px]" style={{ backgroundImage: 'linear-gradient(46.3deg, rgba(242,153,74,0.4) 47%, rgba(242,153,74,0) 98%)' }} />
              <img src="/img/stage-warning.svg" alt="" className="relative h-12 w-[39px]" />
              <div className="relative min-w-0 whitespace-nowrap">
                <p className="truncate text-body">{s.stages.find((st) => st.id === pendingEx.stageId)?.name}</p>
                <p className="text-body text-muted">{isContractor ? 'ממתין לאישור הלקוח' : 'שינוי מחכה לאישורך'}</p>
              </div>
              <Icon name="gettin" className="relative mr-auto" />
            </button>
          )}
          {doneStage && (
            <button onClick={() => nav(`/app/schedule/${doneStage.id}`)} className="relative flex h-16 w-full items-center gap-4 overflow-hidden rounded-lg bg-white px-4 py-2 text-right lg:shadow-[0_0_5px_rgba(62,165,244,0.1)]">
              <span className="absolute right-14 top-[17px] h-8 w-[120px] blur-[40px]" style={{ backgroundImage: 'linear-gradient(46.3deg, rgba(47,191,113,0.4) 47%, rgba(47,191,113,0) 98%)' }} />
              <img src="/img/stage-done.svg" alt="" className="relative h-12 w-12" />
              <div className="relative min-w-0 whitespace-nowrap">
                <p className="truncate text-body">{doneStage.name}</p>
                <p className="text-body text-muted">השלב הושלם בהצלחה</p>
              </div>
            </button>
          )}
        </div>

        {/* Recent documents */}
        <section className="flex flex-col gap-2.5 py-4 lg:col-start-2 lg:row-start-3 lg:rounded-2xl lg:bg-white lg:p-4 lg:shadow-[0_0_5px_rgba(62,165,244,0.1)] xl:col-start-3">
          <div className="flex items-center justify-between">
            <span className="flex h-6 items-center rounded bg-bg px-2 text-caption">מסמכים אחרונים</span>
            <button onClick={() => nav('/app/archive/gallery')} className="text-body leading-4 tracking-[0.042px] underline">
              צפייה בגלריה
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {['/img/doc.png', '/img/thumb1.png', '/img/thumb2.png', '/img/thumb3.png', '/img/doc.png'].map((src, i) => (
              <button key={i} onClick={() => nav(i === 0 || i === 4 ? '/app/archive/docs' : '/app/archive/gallery')} className="block">
                <img src={src} alt="" className="aspect-square w-full rounded-lg bg-white object-cover lg:border lg:border-primary-100" />
              </button>
            ))}
          </div>
        </section>
        </div>
      </div>
    </TabScreen>
  );
}

import type {
  Contact,
  DocItem,
  ExceptionReq,
  ExtraExpense,
  GalleryItem,
  Inspiration,
  Member,
  Project,
  Receipt,
  Reminder,
  ShoppingItem,
  Stage,
  Update,
  User,
} from './types';

/** ISO date offset from today, so the demo always looks current */
const d = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const av = (n: number) => `/avatars/a${n}.${n === 6 ? 'png' : 'jpg'}`;

export const mockUser: User = {
  firstName: 'נדב',
  lastName: 'ישראלי',
  phone: '527683159',
  gender: 'male',
  role: 'client',
};

export const mockProject: Project = {
  name: 'פרויקט בנה ביתך',
  type: 'renovation',
  description: '',
  address: 'הרצל 12, תל אביב',
  estimatedBudget: 270000,
  startDate: d(-20),
  endDate: d(14),
};

const tasks = (titles: string[], done: number, inProgress = 0) =>
  titles.map((title, i) => ({
    id: `${title}-${i}`,
    title,
    status: (i < done ? 'done' : i < done + inProgress ? 'inProgress' : 'todo') as 'done' | 'inProgress' | 'todo',
  }));

export const mockStages: Stage[] = [
  {
    id: 'demolition',
    order: 1,
    name: 'פירוק ופינוי',
    icon: 'demolition',
    budget: 10000,
    contractAmount: 10000,
    paid: 10000,
    duration: 'שבוע',
    startDate: d(-20),
    endDate: d(-12),
    tasks: tasks(
      ['ניתוק תשתיות', 'פירוק חלונות, דלתות ונגרות', 'הריסת קירות ומבנה', 'פינוי פסולת למכולות ולאתר מורשה', 'ניקוי ויישור השטח לשלב הבא'],
      5,
    ),
    memberAvatars: [av(1), av(2), av(3)],
  },
  {
    id: 'plumbing',
    order: 2,
    name: 'צנרת (אינסטלציה)',
    icon: 'plumbing',
    budget: 40000,
    contractAmount: 32000,
    paid: 25000,
    duration: 'שבועיים',
    startDate: d(-11),
    endDate: d(2),
    tasks: tasks(['פירוק צנרת ישנה', 'הנחת קווי מים', 'הנחת קווי ביוב', 'בדיקת לחץ', 'סגירת קירות'], 4, 1),
    memberAvatars: [av(4), av(5)],
  },
  {
    id: 'electric',
    order: 3,
    name: 'חשמל',
    icon: 'electric',
    budget: 35000,
    contractAmount: 30000,
    paid: 15000,
    duration: 'שבוע',
    startDate: d(3),
    endDate: d(8),
    tasks: tasks(['תכנון נקודות', 'השחלת צנרת', 'הנחת תשתיות קומה א׳', 'הנחת תשתיות קומה ב׳', 'לוח חשמל'], 3),
    memberAvatars: [av(7), av(8), av(1)],
  },
  {
    id: 'ceramic',
    order: 4,
    name: 'קרמיקה',
    icon: 'ceramic',
    budget: 30000,
    contractAmount: 28000,
    paid: 0,
    duration: 'שבועיים',
    startDate: d(9),
    endDate: d(14),
    tasks: tasks(['איטום', 'ריצוף', 'חיפוי קירות', 'רובה וגימור'], 0),
    memberAvatars: [av(2)],
  },
];

export const mockExtras: ExtraExpense[] = [{ id: 'x1', kind: 'architect', title: 'אדריכלית', amount: 15000 }];

export const mockReceipts: Receipt[] = [
  { id: 'r1', stageId: 'plumbing', title: 'חשבונית פינוי פסולת', amount: 4000, date: '2025-04-16' },
  { id: 'r2', stageId: 'plumbing', title: 'צנרת ואביזרים', amount: 6000, date: '2025-04-18' },
  { id: 'r3', stageId: 'demolition', title: 'השכרת מכולה', amount: 1800, date: '2025-04-03' },
];

export const mockShopping: ShoppingItem[] = [
  { id: 's1', stageId: 'plumbing', title: 'אסלה תלויה + ניאגרה', done: false },
  { id: 's2', stageId: 'plumbing', title: 'כיור רחצה', done: false },
  { id: 's3', stageId: 'plumbing', title: 'ברז מטבח נשלף', done: true },
];

export const mockUpdates: Update[] = [
  {
    id: 'u1',
    stageId: 'demolition',
    author: 'אבי כהן',
    authorTitle: 'קבלן ראשי',
    avatar: av(1),
    time: 'לפני 10 שעות',
    text: 'הריסת הקירות הושלמה. הפסולת פונתה. מחר מתחילים צנרת.',
    photo: '/img/thumb1.png',
    photos: ['/img/thumb1.png', '/img/thumb2.png'],
    date: d(0),
    status: 'pending',
    comments: [],
  },
  {
    id: 'u2',
    stageId: 'electric',
    date: d(0),
    author: 'יוסי גולן',
    authorTitle: 'חשמלאי',
    avatar: av(7),
    time: 'לפני 3 שעות',
    text: "הנחת תשתיות החשמל הושלמה בקומה א'. ממתין לאישורך להמשיך לקומה ב'.",
    status: 'pending',
    comments: [],
  },
  {
    id: 'u3',
    stageId: 'demolition',
    author: 'מירה לוי',
    authorTitle: 'אדריכלית',
    avatar: av(3),
    time: '20.01.26 · 09:15',
    text: 'אישרתי את פתרון הצנרת החלופי לאחר בדיקה באתר.',
    photo: '/img/house.png',
    date: d(-2),
    status: 'approved',
    comments: [],
  },
];

mockUpdates.push({
  id: 'u4',
  stageId: 'demolition',
  author: 'אבי כהן',
  authorTitle: 'קבלן ראשי',
  avatar: av(1),
  time: 'לפני 3 ימים',
  date: d(-3),
  text: 'פירוק החלונות והדלתות הושלם. הנגרות פונתה.',
  photo: '/img/thumb3.png',
  status: 'approved',
  comments: [{ id: 'c1', author: 'נדב', text: 'מעולה, תודה!', mine: true }],
});

export const mockExceptions: ExceptionReq[] = [
  {
    id: 'e1',
    stageId: 'plumbing',
    author: 'אבי כהן',
    authorTitle: 'קבלן ראשי',
    avatar: av(1),
    time: 'לפני 10 שעות',
    title: 'החלפת קו ביוב ראשי (רקוב)',
    description: 'במהלך פירוק הרצפה התגלה שקו הביוב הראשי רקוב ויש להחליפו לפני המשך העבודה.',
    amount: 4000,
    status: 'pending',
  },
  {
    id: 'e2',
    stageId: 'demolition',
    author: 'אבי כהן',
    authorTitle: 'קבלן ראשי',
    avatar: av(1),
    time: 'לפני יומיים',
    title: 'פינוי פסולת נוסף',
    description: 'כמות הפסולת הייתה גדולה מהמשוער ונדרשה מכולה נוספת.',
    amount: 2000,
    status: 'approved',
  },
];

export const mockReminders: Reminder[] = [
  { id: 'm1', stageId: 'demolition', text: 'לא לשכוח לבדוק מה השכן אמר לגבי הפסולת שהגיעה אליו', color: 'yellow' },
  { id: 'm2', stageId: 'demolition', text: 'להזמין מכולה נוספת ליום חמישי', color: 'blue' },
  { id: 'm3', stageId: 'demolition', text: 'לצלם את הקיר הדרומי לפני ההריסה', color: 'yellow' },
];

export const mockDocs: DocItem[] = [
  { id: 'd1', stageId: 'demolition', title: 'היתר הריסה חתום', date: '2025-04-16' },
  { id: 'd2', stageId: 'general', title: 'תכנית אדריכלית סופית', date: '2025-04-20' },
  { id: 'd3', stageId: 'general', title: 'חוזה קבלן', date: '2026-01-01' },
  { id: 'd4', stageId: 'general', title: 'הצעת מחיר קבלן א', date: '2025-12-15' },
  { id: 'd5', stageId: 'electric', title: 'מפרט טכני חשמל', date: '2025-04-22' },
  { id: 'd6', stageId: 'plumbing', title: 'תכנית צנרת', date: '2025-04-22' },
];

export const mockGallery: GalleryItem[] = [
  { id: 'g1', title: 'הריסה הושלמה', date: '2025-04-16', image: '/img/thumb1.png' },
  { id: 'g2', title: 'עידכון יומי', date: '2025-04-16', image: '/img/house.png' },
  { id: 'g3', title: 'תיעוד קיר', date: '2025-04-16', image: '/img/thumb2.png' },
  { id: 'g4', title: 'לפני ההתחלה', date: '2025-04-16', image: '/img/thumb3.png' },
  { id: 'g5', title: 'חלונות', date: '2025-04-16', image: '/img/thumb2.png' },
  { id: 'g6', title: 'תקרה', date: '2025-04-16', image: '/img/thumb1.png' },
];

/** Inspiration board items – `title` is the category (חדר אמבט, סלון...). Categories without an image show as empty tiles. */
export const mockInspiration: Inspiration[] = ['חדר אמבט', 'סלון', 'חלונות', 'תאורה', 'מקלחת', 'ספה', 'צבע', 'חזית'].map((title, i) => ({
  id: `i${i}`,
  title,
  image: i < 3 ? ['/img/thumb3.png', '/img/house.png', '/img/thumb2.png'][i] : undefined,
}));

export const mockContacts: Contact[] = [
  { id: 'c1', name: 'אבי כהן', title: 'קבלן ראשי', phone: '050-4123538', avatar: av(1) },
  { id: 'c2', name: 'מירה לוי', title: 'אדריכלית', phone: '052-9876543', avatar: av(3) },
  { id: 'c3', name: 'יוסי גולן', title: 'חשמלאי', phone: '054-1112233', avatar: av(7) },
];

export const mockMembers: Member[] = [];

export const faq: { topic: string; items: { q: string; a: string }[] }[] = [
  {
    topic: 'הקמת פרויקט',
    items: [
      {
        q: 'איך מקימים פרויקט חדש?',
        a: "לחץ על כפתור '+' בדף הבית ובחר 'פרויקט חדש'. מלא את פרטי הפרויקט — שם, כתובת, סוג הבנייה ותקציב משוער. לאחר מכן תוכל להעלות תכניות אדריכליות והצעות מחיר לבדיקה.",
      },
      {
        q: 'כמה הצעות מחיר אני יכול להעלות לבדיקה?',
        a: 'ניתן להעלות עד 2 הצעות מחיר לכל פרויקט. המערכת תבצע השוואה בין ההצעות ומול מחיר השוק ותציג לך ניתוח מפורט.',
      },
      {
        q: 'מה קורה אחרי שאני מאשר את הפרויקט?',
        a: 'לאחר האישור, הקבלן מקבל גישה לפרויקט ויכול להתחיל לעדכן התקדמות, לתעד שלבים ולשלוח עדכונים לאישורך.',
      },
    ],
  },
  {
    topic: 'עדכונים ואישורים',
    items: [
      { q: 'איך מאשרים עדכון מהקבלן?', a: "במסך העדכונים לחץ 'אישור' על העדכון. עדכונים שאושרו עוברים לארכיון תחת 'תיעוד'." },
      { q: 'מה זו חריגה?', a: 'חריגה היא עלות שלא הייתה בחוזה המקורי. הקבלן שולח בקשה ואתה מאשר או דוחה אותה.' },
      { q: 'אפשר להגיב לעדכון?', a: "כן, לחץ 'הוסף הערה' כדי לפתוח שרשור תגובות עם הכותב." },
    ],
  },
  {
    topic: 'תשלומים',
    items: [
      { q: 'כמה עולה המנוי?', a: 'המנוי החודשי עולה ₪64 ומתחדש אוטומטית.' },
      { q: 'איך מחליפים כרטיס אשראי?', a: "בתפריט ← עדכון אמצעי תשלום ← 'שנה כרטיס אשראי'." },
    ],
  },
  {
    topic: 'מסמכים וקבצים',
    items: [
      { q: 'איפה נמצאים המסמכים?', a: "בטאב 'ארכיון' ← 'מסמכים', מסודרים לפי שלבים." },
      { q: 'אילו קבצים אפשר להעלות?', a: 'PDF, Word ותמונות.' },
    ],
  },
];

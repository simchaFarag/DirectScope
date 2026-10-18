import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Interstitial, Otp, PhoneLogin, Profile, Splash } from '@/screens/onboarding/Auth';
import { BudgetSplit, CheckResults, ProjectDetails, UploadDocs } from '@/screens/onboarding/Setup';
import { ExpenseForm, InspirationBoard, InspirationUpload, MemberForm, ShareList, StageEdit, StageNew } from '@/screens/shared/Forms';
import { Home } from '@/screens/app/Home';
import { Schedule, StageSchedule, TasksEdit } from '@/screens/app/Schedule';
import { Budget, ExceptionForm, ExceptionsScreen, ReceiptForm, StageBudget } from '@/screens/app/Budget';
import { Archive } from '@/screens/app/Archive';
import { ReminderForm, UpdateForm, UpdatesScreen } from '@/screens/app/Updates';
import { Help, Payment, ProfileScreen, Terms } from '@/screens/app/Misc';
import { ContactPage, FileViewer, InspirationCategory, ProjectEdit } from '@/screens/app/Details';

/** Route map – mirrors docs/SPEC.md §3 */
export const screens: { path: string; name: string; group: string }[] = [
  { group: 'כניסה', path: '/', name: 'Splash / Welcome' },
  { group: 'כניסה', path: '/login/phone', name: 'מספר טלפון' },
  { group: 'כניסה', path: '/login/otp', name: 'קוד אימות' },
  { group: 'כניסה', path: '/login/profile', name: 'יצירת פרופיל' },
  { group: 'הקמת פרויקט', path: '/setup/details', name: '1/4 פרטי הפרויקט' },
  { group: 'הקמת פרויקט', path: '/setup/docs', name: '2/4 העלאת מסמכים' },
  { group: 'הקמת פרויקט', path: '/setup/results', name: '3/4 נתוני הבדיקה' },
  { group: 'הקמת פרויקט', path: '/setup/budget', name: '4/4 חלוקה תקציבית' },
  { group: 'הקמת פרויקט', path: '/setup/expense', name: 'הוספת הוצאה' },
  { group: 'הקמת פרויקט', path: '/setup/inspiration', name: 'לוח השראה' },
  { group: 'הקמת פרויקט', path: '/setup/share', name: 'שיתוף' },
  { group: 'אפליקציה', path: '/app/home', name: 'בית' },
  { group: 'אפליקציה', path: '/app/budget', name: 'תקציב' },
  { group: 'אפליקציה', path: '/app/budget/plumbing', name: 'תקציב שלב' },
  { group: 'אפליקציה', path: '/app/schedule', name: 'זמנים' },
  { group: 'אפליקציה', path: '/app/schedule/demolition', name: 'זמנים – שלב' },
  { group: 'אפליקציה', path: '/app/schedule/demolition/tasks', name: 'עריכת משימות' },
  { group: 'אפליקציה', path: '/app/archive/docs', name: 'ארכיון' },
  { group: 'אפליקציה', path: '/app/doc/d1', name: 'צפייה במסמך' },
  { group: 'אפליקציה', path: '/app/receipts/r1', name: 'צפייה באסמכתא' },
  { group: 'אפליקציה', path: '/app/contact/c1', name: 'איש קשר' },
  { group: 'אפליקציה', path: '/app/archive/inspire/סלון', name: 'קטגוריית השראה' },
  { group: 'אפליקציה', path: '/app/project/edit', name: 'עריכת פרויקט' },
  { group: 'אפליקציה', path: '/app/updates', name: 'עדכונים / התראות' },
  { group: 'אפליקציה', path: '/app/updates/new', name: 'עדכון חדש' },
  { group: 'אפליקציה', path: '/app/reminder/new', name: 'הוספת תזכורת' },
  { group: 'אפליקציה', path: '/app/exceptions', name: 'אישורי חריגה' },
  { group: 'אפליקציה', path: '/app/exceptions/new', name: 'שליחת אישור חריגה' },
  { group: 'אפליקציה', path: '/app/receipt/new', name: 'הוספת אסמכתא' },
  { group: 'תפריט', path: '/app/payment', name: 'אמצעי תשלום' },
  { group: 'תפריט', path: '/app/share', name: 'שיתוף אנשי קשר' },
  { group: 'תפריט', path: '/app/help', name: 'עזרה' },
  { group: 'תפריט', path: '/app/terms', name: 'תנאי שימוש' },
];

function ScreensIndex() {
  const groups = [...new Set(screens.map((s) => s.group))];
  return (
    <div className="space-y-6 p-6">
      <h1 className="font-display text-h1 font-bold">מפת מסכים</h1>
      {groups.map((g) => (
        <section key={g}>
          <h2 className="mb-2 text-lg font-semibold">{g}</h2>
          <ul className="card divide-y divide-line">
            {screens
              .filter((s) => s.group === g)
              .map((s) => (
                <li key={s.path}>
                  <Link to={s.path} className="flex justify-between px-4 py-3 text-body">
                    {s.name}
                    <span className="text-caption text-muted" dir="ltr">
                      {s.path}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Splash />} />
        <Route path="/screens" element={<ScreensIndex />} />

        {/* Login */}
        <Route path="/login/phone" element={<PhoneLogin />} />
        <Route path="/login/otp" element={<Otp />} />
        <Route path="/login/verified" element={<Interstitial text="האימות בוצע בהצלחה!" next="/login/profile" bg="/img/bg-verified.png" />} />
        <Route path="/login/profile" element={<Profile />} />

        {/* Project setup */}
        <Route path="/setup/details" element={<ProjectDetails />} />
        <Route path="/setup/docs" element={<UploadDocs />} />
        <Route path="/setup/checking" element={<Interstitial loading text="בבדיקה. בונים לך משהו טוב :)" next="/setup/checked" bg="/img/bg-check.png" delay={2200} />} />
        <Route path="/setup/checked" element={<Interstitial text="הבדיקה בוצעה בהצלחה!" next="/setup/results" bg="/img/bg-check.png" />} />
        <Route path="/setup/results" element={<CheckResults />} />
        <Route path="/setup/budget" element={<BudgetSplit />} />
        <Route path="/setup/expense" element={<ExpenseForm />} />
        <Route path="/setup/stage/:id" element={<StageEdit />} />
        <Route path="/setup/inspiration" element={<InspirationBoard />} />
        <Route path="/setup/inspiration/upload" element={<InspirationUpload />} />
        <Route path="/setup/share" element={<ShareList />} />
        <Route path="/setup/share/new" element={<MemberForm />} />
        <Route path="/setup/share/:id" element={<MemberForm />} />

        {/* Main app */}
        <Route path="/app" element={<Navigate to="/app/home" replace />} />
        <Route path="/app/home" element={<Home />} />
        <Route path="/app/budget" element={<Budget />} />
        <Route path="/app/budget/:stageId" element={<StageBudget />} />
        <Route path="/app/schedule" element={<Schedule />} />
        <Route path="/app/schedule/:stageId" element={<StageSchedule />} />
        <Route path="/app/schedule/:stageId/tasks" element={<TasksEdit />} />
        <Route path="/app/archive" element={<Navigate to="/app/archive/gallery" replace />} />
        <Route path="/app/archive/:tab" element={<Archive />} />
        <Route path="/app/archive/inspire/:cat" element={<InspirationCategory />} />
        <Route path="/app/doc/:id" element={<FileViewer kind="doc" />} />
        <Route path="/app/receipts/:id" element={<FileViewer kind="receipt" />} />
        <Route path="/app/contact/:id" element={<ContactPage />} />
        <Route path="/app/project/edit" element={<ProjectEdit />} />
        <Route path="/app/updates" element={<UpdatesScreen />} />
        <Route path="/app/updates/new" element={<UpdateForm />} />
        <Route path="/app/reminder/new" element={<ReminderForm />} />
        <Route path="/app/exceptions" element={<ExceptionsScreen />} />
        <Route path="/app/exceptions/new" element={<ExceptionForm />} />
        <Route path="/app/receipt/new" element={<ReceiptForm />} />
        <Route path="/app/expense/new" element={<ExpenseForm />} />
        <Route path="/app/stage/new" element={<StageNew />} />
        <Route path="/app/stage/:id/edit" element={<StageEdit />} />
        <Route path="/app/inspiration/upload" element={<InspirationUpload />} />
        <Route path="/app/share" element={<ShareList />} />
        <Route path="/app/share/new" element={<MemberForm />} />
        <Route path="/app/share/:id" element={<MemberForm />} />
        <Route path="/app/payment" element={<Payment />} />
        <Route path="/app/help" element={<Help />} />
        <Route path="/app/terms" element={<Terms />} />
        <Route path="/app/profile" element={<ProfileScreen />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

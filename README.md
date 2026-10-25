# DirectScope

אפליקציה לניהול פרויקטי בנייה ושיפוץ בין לקוח לקבלן. המסכים בנויים לפי קובץ ה-Figma ‏`DirectScope` (דף ready for dev).

- האפיון המלא: [docs/SPEC.md](docs/SPEC.md)
- טכנולוגיות: Vite, React 18, TypeScript, Tailwind CSS, React Router

## הרצה

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # בנייה לפרודקשן לתיקיית dist
```

- **בטלפון:** כשהטלפון מחובר לאותה רשת Wi-Fi כמו המחשב, פותחים בדפדפן של הטלפון את כתובת ה-Network ש-`npm run dev` מדפיס (לדוגמה `http://192.168.2.5:5173`). כך עובדים גם המצלמה והגלריה.
- `/` – מסך פתיחה, ומשם כל זרימת ההרשמה והקמת הפרויקט
- `/screens` – רשימה של כל המסכים, עם קישור ישיר לכל אחד
- בתפריט ☰ יש מתג **לקוח / קבלן** להצגת המסכים כפי שכל תפקיד רואה אותם, וכפתור "התחלה מחדש" שמאפס את נתוני הדמו

## מבנה

```
src/
  components/   layout (AppBar, BottomNav, Drawer, StageTabs), ui (Button, Field, Ring, Gauge, Modal...), icons
  data/         types, mock (נתוני דמו), store (state גלובלי + localStorage)
  screens/
    onboarding/ Auth (פתיחה, טלפון, אימות, פרופיל), Setup (הקמת פרויקט 1–4)
    shared/     Forms (הוספת הוצאה, עריכת שלב, לוח השראה, שיתוף)
    app/        Home, Budget, Schedule, Archive, Updates, Misc (עזרה, תנאי שימוש, תשלום, פרופיל)
```

כרגע המסכים שומרים את הנתונים מקומית בדפדפן. השרת (Node + MySQL) נמצא ב-[server/](server/README.md): אימות בטלפון, מסד נתונים, העלאת קבצים והרשאות. החיבור מצד האפליקציה עובר דרך `src/lib/api.ts`.

```bash
docker compose up -d      # MySQL מקומי
npm run server:dev        # API ב-http://localhost:4000
```

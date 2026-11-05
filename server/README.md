# DirectScope – שרת (API)

Node.js 20+ · Express 5 · TypeScript · Prisma · MySQL/MariaDB

## הרצה מקומית

```bash
# 1. מסד נתונים מקומי (מתיקיית הפרויקט הראשית). דורש Docker Desktop פתוח
docker compose up -d

# 2. השרת
cd server
cp .env.example .env        # ערכי ברירת המחדל מתאימים ל-docker compose
npm install
npm run db:deploy           # יוצר את כל הטבלאות
npm run db:seed             # טוען את נתוני הדמו (לא חובה)
npm run dev                 # http://localhost:4000/api/health
```

במקביל, בתיקייה הראשית: `npm run dev`. ‏Vite מעביר את `/api` ואת `/uploads` לשרת, כך שהאפליקציה והשרת עובדים על אותה כתובת.

**התחברות בפיתוח:** טלפון `0527683159` (לקוח מהדמו) או `0504123538` (קבלן), קוד `123456` (הערך של `OTP_DEV_CODE`). הקוד האמיתי שנשלח מודפס גם בלוג של השרת.

## פקודות

| פקודה | מה עושה |
|---|---|
| `npm run dev` | שרת פיתוח עם טעינה מחדש אוטומטית |
| `npm run build` / `npm start` | בנייה לתיקיית `dist` והרצה בפרודקשן |
| `npm run db:migrate` | אחרי שינוי ב-`prisma/schema.prisma`: יוצר migration חדש ומריץ אותו |
| `npm run db:deploy` | מריץ migrations קיימים (בשרת הפרודקשן) |
| `npm run db:seed` | נתוני דמו |
| `npm run db:studio` | ממשק גרפי לצפייה ועריכה של הטבלאות |

## מבנה

```
prisma/schema.prisma   כל הטבלאות (משתמשים, פרויקטים, שלבים, משימות, תקציב, עדכונים, חריגות, ארכיון...)
prisma/migrations/     ה-SQL שיוצר את הטבלאות
prisma/seed.ts         טוען את src/data/mock.ts למסד
src/config.ts          קריאה ובדיקה של משתני הסביבה (.env)
src/app.ts             Express: אבטחה, CORS, לוגים, נתיבים
src/middleware/        התחברות (JWT), הרשאות פרויקט, טיפול בשגיאות
src/routes/            הנתיבים (ראו טבלה)
src/lib/serialize.ts   ממיר רשומות DB למבנה ש-React כבר משתמש בו (src/data/types.ts)
deploy/                PM2 ו-nginx לשרת
```

## הרשאות

| מי | מה מותר |
|---|---|
| יוצר הפרויקט (לקוח) | הכל, כולל אישור עדכונים וחריגות וניהול שותפים |
| שותף משפחה/משפץ עם "עריכה" | יצירה ועריכה של תוכן, כולל אישור עדכונים וחריגות |
| שותף עם הרשאת "צפייה" | קריאה בלבד, ותגובות על עדכונים |
| **מוגבל**: שותף שהוזמן כ"בעל מקצוע", או מי שנרשם כקבלן | לא רואה את התקציב (רק סכום החוזה, בלי הוצאות נוספות וקבלות). לא משנה סכומים: לא תקציב, לא סכום חוזה (שינוי כזה עובר כבקשת חריגה), ולא את התקציב המשוער. לא מוסיף או מוחק שלבים. סטטוס משימה משתנה רק דרך "השלמת משימה", והעדכון ממתין לאישור הלקוח |

ההרשאות נקבעות לפי ההזמנה לפרויקט (`middleware/project.ts`). התפקיד בפרופיל נבחר פעם אחת בהרשמה ואי אפשר לשנות אותו אחר כך.

**הזמנה:** לכל שותף נוצר קישור אישי (`/invite?t=…`) שנשלח בוואטסאפ. השותף מצטרף לפרויקט רק כשהוא פותח את הקישור ונכנס עם מספר הטלפון שהוזמן (`POST /api/invites/accept`). הקישור חד-פעמי. הוספת מספר טלפון לבדה לא נותנת גישה. הזמנות ישנות בלי קישור (מלפני השינוי) עדיין מתחברות בכניסה לפי מספר הטלפון.

**התנתקות:** `POST /api/auth/logout` מבטל את כל הטוקנים של המשתמש (`tokenVersion`).

## נתיבים (כולם תחת `/api`)

כל הנתיבים חוץ מ-`auth` ו-`health` דורשים כותרת `Authorization: Bearer <token>`.

```
GET    /health                                      בדיקת שרת + מסד נתונים

POST   /auth/otp/request        { phone }           שליחת קוד SMS
POST   /auth/otp/verify         { phone, code }     → { token, user, isNew }
POST   /auth/logout                                 מבטל את כל הטוקנים של המשתמש
POST   /invites/accept          { token }           הצטרפות לפרויקט מקישור ההזמנה → { projectId }

GET    /me  ·  PATCH /me                            פרופיל (שם, תפקיד, מגדר, תמונה)
POST   /me/accept-terms
GET|PUT|DELETE /me/subscription                     מנוי (4 ספרות אחרונות בלבד)

POST   /uploads                 multipart "files"   → [{ url, name, size, type }]  (עד 6 קבצים; סוג הקובץ נבדק לפי התוכן; url יחסי /uploads/…)

GET    /projects  ·  POST /projects                 רשימה / יצירה (אפשר לשלוח stages ביחד)
GET|PATCH|DELETE /projects/:pid
GET    /projects/:pid/state                         כל נתוני הפרויקט בקריאה אחת (המבנה של State בצד הלקוח)

/projects/:pid/
  stages            GET POST · PATCH DELETE /:id
  stages/:id/tasks  PUT (מחליף את רשימת המשימות) · POST /:taskId/complete { note?, photo? }
  extras            GET POST · PATCH DELETE /:id    הוצאות נוספות
  receipts          GET POST · DELETE /:id           קבלות (מעדכנות את "שולם" בשלב)
  shopping          GET POST · PATCH DELETE /:id    רשימת קניות
  updates           GET (?status=) POST · DELETE /:id · POST /:id/approve · /:id/reject { reason } · /:id/comments { text }
  exceptions        GET POST · POST /:id/status { status, reason? }
  reminders | documents | gallery | inspiration | contacts   GET POST · PATCH DELETE /:id
  members           GET POST · PATCH DELETE /:id    שותפים (רק יוצר הפרויקט)
```

שגיאות חוזרות תמיד במבנה `{ error: { code, message } }`. ההודעה בעברית ואפשר להציג אותה למשתמש כמו שהיא.

## העלאה לשרת (vm6 / CloudPanel)

1. **מסד נתונים:** ב-CloudPanel → Databases → Add Database. רושמים את שם המסד, שם המשתמש והסיסמה.
2. **קוד:** מעתיקים את תיקיית `server` לשרת, למשל `/home/<site-user>/directscope-server`.
3. **‎.env:** מעתיקים את `.env.example` ומעדכנים:
   ```
   NODE_ENV=production
   PUBLIC_URL=https://directscope.212.150.53.124.nip.io
   CORS_ORIGINS=https://directscope.212.150.53.124.nip.io
   TRUST_PROXY=1
   DATABASE_URL=mysql://<user>:<password>@127.0.0.1:3306/<db>
   JWT_SECRET=<מחרוזת אקראית>
   OTP_DEV_CODE=
   SMS_PROVIDER=twilio        # או console עד שיש ספק SMS
   ```
4. **התקנה:**
   ```bash
   npm ci && npm run build && npm run db:deploy
   npm i -g pm2
   pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
   ```
5. **nginx:** ב-CloudPanel → Sites → האתר → Vhost, מדביקים את התוכן של `deploy/nginx-api.conf` בתוך בלוק ה-`server` (מעל `location /`) ושומרים.
6. בודקים: `https://<domain>/api/health` צריך להחזיר `{"ok":true,"db":"up"}`.

**עדכון גרסה:** `git pull && npm ci && npm run build && npm run db:deploy && pm2 restart directscope-api`

**גיבוי:** הקבצים שהועלו נמצאים ב-`uploads/` (או בנתיב שהוגדר ב-`UPLOAD_DIR`), והמסד מגובה דרך CloudPanel → Databases → Export. צריך לגבות את שניהם.

## החלפה ל-PostgreSQL

ב-`prisma/schema.prisma` משנים `provider = "postgresql"`, מעדכנים את `DATABASE_URL`, מוחקים את `prisma/migrations` ומריצים `npm run db:migrate -- --name init`.

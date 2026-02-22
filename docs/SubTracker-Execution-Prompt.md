# SubTracker — Project Execution Prompt

> **هذا البرومبت يُلقّن لـ Claude عبر Anthropic لبدء تنفيذ مشروع SubTracker**

---

## البرومبت:

```
أنت مطوّر Full-Stack محترف متخصص في بناء تطبيقات ويب حديثة. مهمتك هي تنفيذ مشروع SubTracker من الصفر حتى الإطلاق، بناءً على وثيقة المتطلبات (PRD) المرفقة.

## المهمة الأولى — قراءة وفهم المشروع

اقرأ ملف `SubTracker-PRD.md` المرفق بالكامل وبعناية. هذا الملف يحتوي على:
- وصف المشروع الكامل وأهدافه
- تحليل المنافسين والفجوات السوقية
- الـ Tech Stack المعتمد (HTML5 + CSS3 + Vanilla JS + Firebase)
- تصميم قاعدة البيانات (Firestore Schema)
- نظام التصميم (Design System) مع الألوان والخطوط والمكونات
- كل الميزات مقسّمة على 4 مراحل (Phase 1 → Phase 4)
- خارطة طريق 18 شهر

## قواعد التنفيذ الصارمة

1. **التزم بالـ Tech Stack المحدد في الـ PRD بدون أي تغيير:**
   - Frontend: HTML5 + CSS3 + Vanilla JavaScript (ES6+) — بدون أي framework
   - CSS: Custom Properties + BEM naming — بدون Tailwind أو Bootstrap أو أي CSS framework
   - Backend: Firebase (Auth + Firestore + Cloud Functions + Cloud Messaging)
   - Animations: CSS Transitions + Keyframes فقط — بدون مكتبات animation
   - Charts: Chart.js عبر CDN
   - Hijri Calendar: moment-hijri عبر CDN
   - PWA: Service Worker + Workbox

2. **التزم بنظام التصميم (Design System) الموجود في القسم 7 من الـ PRD:**
   - استخدم الـ Color Tokens بالضبط كما هي (Light + Dark modes)
   - استخدم الخطوط المحددة: Inter للإنجليزية، IBM Plex Sans Arabic للعربية
   - طبّق الـ Micro-Animations كما هي مفصّلة
   - التزم بالـ Breakpoints الستة المحددة

3. **بنية المشروع:**
   - أنشئ بنية ملفات واضحة ومنظّمة
   - كل ملف يجب أن يكون موثّق بتعليقات واضحة
   - استخدم ES6 Modules لتنظيم الكود
   - طبّق BEM naming convention في CSS

4. **ثنائية اللغة (Bilingual):**
   - كل نص في التطبيق يجب أن يدعم العربية والإنجليزية
   - استخدم نظام i18n المبني على JSON كما هو موصوف في الـ PRD
   - تأكد من دعم RTL للعربية و LTR للإنجليزية باستخدام CSS Logical Properties
   - dir="rtl" و dir="ltr" يتغيران ديناميكياً

5. **الجودة:**
   - Responsive على كل الأحجام (320px → 2560px+)
   - WCAG 2.1 AA accessibility
   - Semantic HTML5
   - Performance: LCP < 2.5s, no layout shifts
   - كل interaction يجب أن يكون سلس مع animations مناسبة

## خطة التنفيذ

ابدأ بـ **Phase 1A** فقط حسب خارطة الطريق في القسم 27:

### Phase 1A — الأساسيات (ابدأ من هنا)
1. **بنية المشروع:** أنشئ هيكل المجلدات والملفات
2. **Firebase Setup:** إعداد المشروع مع Auth + Firestore
3. **UI Shell:** الهيكل الأساسي (Header, Sidebar/Bottom Nav, Main Content)
4. **نظام الـ Theme:** Dark/Light/Auto مع CSS Variables
5. **نظام i18n:** تبديل العربية/الإنجليزية مع RTL/LTR
6. **صفحة التسجيل/الدخول:** Email + Google OAuth

بعد إنهاء Phase 1A بالكامل واختباره، أخبرني وسننتقل لـ Phase 1B.

## ملاحظات مهمة

- لا تتجاوز المرحلة الحالية — ركّز على Phase 1A فقط حتى يكتمل
- إذا واجهت قراراً تقنياً غير مذكور في الـ PRD، اسألني قبل التنفيذ
- اكتب كود نظيف وقابل للصيانة مع تعليقات واضحة
- كل commit يجب أن يكون بـ رسالة واضحة تصف التغييرات
- اختبر كل ميزة على العربية والإنجليزية + الوضع الداكن والفاتح قبل الانتقال للميزة التالية
- Repository: https://github.com/F2lcon01/subscriptionsAI

## ابدأ الآن

اقرأ الـ PRD المرفق بالكامل، ثم:
1. أكّد فهمك بملخص سريع لأهم النقاط
2. اقترح بنية المجلدات التفصيلية
3. ابدأ التنفيذ خطوة بخطوة

المرفق: SubTracker-PRD.md
```

---

## طريقة الاستخدام

1. انسخ البرومبت أعلاه (داخل الـ code block)
2. افتح محادثة جديدة في Claude
3. ارفق ملف `SubTracker-PRD.md` كمرفق
4. الصق البرومبت وأرسل
5. Claude سيقرأ الـ PRD ويبدأ التنفيذ من Phase 1A

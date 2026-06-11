// سند agent service — the single brain behind every AI copilot in the app.
// Today: deterministic mock intelligence. Tomorrow: swap each function's body
// for a call to the FastAPI/LLM backend; every screen keeps working untouched.
//
// Design rule across the whole product: the agent SUGGESTS, a human APPROVES.

import type { MockContact } from "./mock-data";

/* ================= Agent identities =================
 * Every copilot has a name and a clear role, so staff know exactly
 * which "colleague" produced each suggestion.
 */
export const AGENTS = {
  response:   { name: "مُغيث",  role: "وكيل الاستجابة" },   // hotline: suggests guidance + actions
  ops:        { name: "راصد",   role: "وكيل العمليات" },    // live: area surges, logistics, anomalies
  routing:    { name: "دليل",   role: "وكيل التوجيه" },     // map cells: team & hospital routing
  prediction: { name: "بصير",   role: "وكيل التنبؤ" },      // map +4h forecast layer
  triage:     { name: "فارز",   role: "وكيل الفرز" },       // hotline queue ordering
  discharge:  { name: "موثِّق", role: "وكيل التوثيق" },     // discharge summary drafting
} as const;

/* ================= «مُغيث» Response Agent (hotline) =================
 * A medical copilot. From the transcript + health record it produces, in the
 * order a clinician works:
 *  1. diagnosis — brief clinical assessment (read by the care provider, not the pilgrim)
 *  2. treatment — recommended handling / first-line management
 *  3. questions — triage questions to ask the caller to complete the picture
 *  4. guidance — what to tell the pilgrim (voiced in their language on approval)
 *  5. action — operational step (dispatch/supply/notify) pending approval
 *  6. fieldBrief — organized case summary pushed to the responding team
 */
export type DiagnosisSeverity = "critical" | "urgent" | "normal";

export interface ContactSuggestion {
  diagnosis: { title: string; detail: string; severity: DiagnosisSeverity };
  treatment: string;
  questions: string[];
  guidance: string;
  action?: { label: string; detail: string };
  fieldBrief: string[];
}

const CONTACT_SUGGESTIONS: Record<string, ContactSuggestion> = {
  C001: {
    diagnosis: {
      title: "اشتباه متلازمة شريان تاجي حادة (ACS)",
      detail: "ألم صدر مع ضيق تنفس لدى حاج بتاريخ قلبي — يُعامل كنوبة قلبية حتى يثبت العكس.",
      severity: "critical",
    },
    treatment: "منع أي مجهود فوراً · وضعية جلوس مسندة · أسبرين ٣٠٠مغ مضغاً إن لم توجد حساسية · مراقبة الوعي والتنفس حتى وصول الفريق.",
    questions: [
      "هل الألم ينتشر إلى الذراع أو الفك أو الظهر؟",
      "منذ متى بدأ الألم بالضبط؟",
      "هل لديك حساسية من الأسبرين؟",
      "هل تتعرق بشكل غير طبيعي الآن؟",
    ],
    guidance: "ابقَ في مكانك تماماً ولا تبذل أي مجهود. أرخِ ملابسك واجلس مستنداً إلى شيء ثابت. الفريق الطبي في الطريق إليك الآن.",
    action: { label: "إرسال فريق قلب فوراً", detail: "أقرب فريق متاح: فريق الرعاية ج (~٤ د) + إشعار المستشفى الميداني بمنى لتجهيز سرير قلب" },
    fieldBrief: [
      "الشكوى: ألم صدر + ضيق تنفس — اشتباه ACS",
      "الخلفية: تاريخ قلبي معروف، يتناول أسبرين ٧٥مغ",
      "أُعطي إرشاد: راحة تامة، وضعية جلوس",
      "الموقع: قرب الخيمة الخضراء، منى",
      "جهّزوا: ECG، أسبرين، أكسجين — الأولوية قصوى",
    ],
  },
  C002: {
    diagnosis: {
      title: "إجهاد حراري مبكر (ما قبل ضربة الشمس)",
      detail: "دوخة وحرارة محسوسة عالية وعدم القدرة على المشي — مرحلة قابلة للعكس إذا بُرّدت خلال دقائق.",
      severity: "urgent",
    },
    treatment: "نقل فوري للظل · تبريد سطحي (بلل الوجه والرقبة) · ماء بارد على دفعات صغيرة · مراقبة مستوى الوعي.",
    questions: [
      "هل تشعرين بغثيان أو تقيأتِ؟",
      "هل توقف التعرق لديكِ؟ (علامة خطر)",
      "متى آخر مرة شربتِ فيها ماء؟",
      "هل تشعرين بتشوش في الرؤية أو صداع؟",
    ],
    guidance: "انتقلي إلى أقرب ظل فوراً واشربي ماءً بارداً ببطء. بللي وجهكِ ورقبتكِ بالماء. لا تمشي وحدك، اطلبي مساعدة من بجانبك.",
    action: { label: "توجيهها لأقرب نقطة مياه", detail: "نقطة المياه رقم ١٢ تبعد ٨٠ متراً من موقعها — إرسال الاتجاهات على هاتفها" },
    fieldBrief: [
      "الشكوى: دوخة + حرارة — إجهاد حراري مبكر",
      "العلامة الفارقة المطلوبة: هل توقف التعرق؟",
      "أُعطي إرشاد: ظل + تبريد + ماء تدريجي",
      "الموقع: محور المشاة، منى",
      "جهّزوا: محاليل ترطيب وكمادات تبريد",
    ],
  },
  C003: {
    diagnosis: {
      title: "لا حالة طبية ظاهرة — ضياع عن المجموعة",
      detail: "انفصال عن المجموعة MYS-447 مع توتر؛ يُراقب الإجهاد الحراري لطول البقاء في الشمس.",
      severity: "normal",
    },
    treatment: "طمأنة وتثبيت الموقع عبر لوحة إرشادية مرقّمة · إبقاؤه في الظل أثناء انتظار المرشد · تقييم سريع لأعراض الحر.",
    questions: [
      "ما رقم أقرب لوحة إرشادية مكتوبة بجانبك؟",
      "هل تشعر بدوار أو عطش شديد؟",
      "منذ متى وأنت تحت الشمس؟",
      "هل معك هاتف يمكن لمرشد مجموعتك الاتصال به؟",
    ],
    guidance: "لا تقلق، سنوصلك بمجموعتك. ابقَ في الظل قرب أقرب لوحة إرشادية مرقّمة وأخبرني بالرقم المكتوب عليها.",
    action: { label: "إشعار مرشد المجموعة MYS-447", detail: "مخيم المجموعة: منى قطاع B-7 — مشاركة موقع الحاج مع المرشد" },
    fieldBrief: [
      "الحالة: حاج تائه — لا شكوى طبية حالياً",
      "المجموعة: MYS-447 · المخيم: منى B-7",
      "أُعطي إرشاد: البقاء بالظل قرب لوحة مرقّمة",
      "المطلوب: مرشد المجموعة لا فريق طبي",
      "راقبوا: علامات إجهاد حراري عند الوصول",
    ],
  },
  C004: {
    diagnosis: {
      title: "هبوط سكر حاد (اشتباه دون ٧٠ مغ/دل)",
      detail: "مريضة سكري تشعر بتوعك شديد دون مصدر سكر متاح — خطر فقدان وعي خلال دقائق.",
      severity: "critical",
    },
    treatment: "سكر سريع فموياً فوراً إن كانت واعية (عصير/حلوى من المحيطين) · جلوكاجون عضلي إذا تدهور الوعي · لا تُترك وحدها إطلاقاً.",
    questions: [
      "هل ما زالتِ واعية وقادرة على البلع؟",
      "متى آخر جرعة إنسولين وكم كانت؟",
      "متى آخر وجبة أكلتِها؟",
      "هل يوجد أحد بجانبكِ الآن؟",
    ],
    guidance: "اطلبي من أقرب شخص بجانبكِ قطعة حلوى أو عصيراً فوراً — لا تنتظري الفريق. ابقي جالسة ولا تمشي. الفريق في الطريق ومعه علاج السكر.",
    action: { label: "إرسال فريق مع جلوكاجون", detail: "حالة سكري حرجة — فريق التدخل السريع (~٣ د) إلى العمود الأبيض المُشار إليه" },
    fieldBrief: [
      "الشكوى: هبوط سكر حاد — مريضة سكري",
      "الوعي: واعية حالياً، تتحدث عبر المحادثة",
      "أُعطي إرشاد: سكر فموي فوري من المحيطين",
      "الموقع: قرب عمود أبيض — يُدقق عند الاقتراب",
      "جهّزوا: جلوكاجون، جلوكوميتر، محلول جلوكوز",
    ],
  },
  C005: {
    diagnosis: {
      title: "انقطاع دواء ضغط (أملوديبين)",
      detail: "ليس طارئاً الآن، لكن الانقطاع في حر ٤٧° يرفع خطر ارتفاع الضغط خلال ٢٤–٤٨ ساعة.",
      severity: "normal",
    },
    treatment: "صرف بديل وتوصيله خلال ساعات · قياس ضغط وقائي عند التسليم · تجنب المجهود والحر حتى وصول الدواء.",
    questions: [
      "متى أخذت آخر جرعة؟",
      "هل تشعر بصداع أو زغللة في النظر؟",
      "هل لديك أمراض أخرى أو أدوية أخرى انقطعت؟",
    ],
    guidance: "سنوصل دواء الضغط إلى موقعك خلال ساعة بإذن الله. استمر على آخر جرعة متوفرة لديك وتجنّب المجهود والحر حتى يصلك.",
    action: { label: "طلب صرف من صيدلية المخيم", detail: "أملوديبين ٥مغ — يُسلَّم مع الجولة القادمة للوحدة المتنقلة م١" },
    fieldBrief: [
      "الطلب: تجديد أملوديبين ٥مغ — غير طارئ",
      "آخر جرعة: تُسأل عند التواصل",
      "التسليم: مع جولة الوحدة المتنقلة م١",
      "عند التسليم: قياس ضغط وتوثيق القراءة",
    ],
  },
  C006: {
    diagnosis: {
      title: "جفاف متوسط مع إنهاك حراري",
      detail: "ضعف ودوار بعد ساعات بلا ماء — يحتاج ترطيباً ونقلاً فعلياً، النصيحة وحدها لا تكفي.",
      severity: "urgent",
    },
    treatment: "إيقاف المشي فوراً · ترطيب فموي تدريجي · نقل بعربة إلى نقطة الرعاية ٤ · تقييم الحاجة لمحاليل وريدية هناك.",
    questions: [
      "هل تبوّلت خلال آخر ٦ ساعات؟",
      "هل تشعر بتشنجات في العضلات؟",
      "هل تستطيع الوقوف دون دوار شديد؟",
    ],
    guidance: "توقف عن المشي الآن واجلس في الظل. اشرب الماء على دفعات صغيرة متتالية ولا تشربه دفعة واحدة. سنرسل من يوصلك إلى نقطة الرعاية القريبة.",
    action: { label: "إرسال عربة نقل + ماء", detail: "نقطة الرعاية ٤ تبعد ٣٠٠م — عربة الجولف رقم ٧ متاحة الآن" },
    fieldBrief: [
      "الشكوى: ضعف ودوار — جفاف بعد ساعات بلا ماء",
      "أُعطي إرشاد: إيقاف المشي + ترطيب تدريجي",
      "النقل: عربة جولف ٧ إلى نقطة الرعاية ٤",
      "هناك: تقييم الحاجة لمحاليل وريدية",
    ],
  },
};

const GENERIC_SUGGESTION: ContactSuggestion = {
  diagnosis: {
    title: "تقييم أولي — البيانات غير مكتملة",
    detail: "لا تتوفر أعراض كافية بعد؛ تُجمع المعلومات مع إبقاء الحاج في وضع آمن.",
    severity: "normal",
  },
  treatment: "جمع الأعراض الأساسية أولاً، وإبقاء الحاج في مكان آمن وظليل حتى اكتمال التقييم.",
  questions: ["ما الذي تشعر به بالضبط الآن؟", "منذ متى بدأت الأعراض؟", "هل لديك أمراض مزمنة أو أدوية؟"],
  guidance: "نحن معك الآن وسنساعدك خطوة بخطوة. ابقَ في مكان آمن وظليل وصف لي ما تشعر به بدقة.",
  fieldBrief: ["حالة غير مصنفة — بانتظار استكمال التقييم"],
};

export function getContactSuggestion(c: MockContact): ContactSuggestion {
  return CONTACT_SUGGESTIONS[c.id] ?? GENERIC_SUGGESTION;
}

/* ================= Ops Agent (live command) =================
 * Watches the vitals + location stream and surfaces area-level intelligence:
 * surges happening now, predictions, logistics gaps, anomalies.
 */
export type InsightType = "surge" | "prediction" | "logistics" | "anomaly";
export type InsightSeverity = "critical" | "warning" | "info";

export interface OpsInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  area: string;
  title: string;
  detail: string;
  action: string;     // suggested action — executes only on operator approval
  confidence: number; // model confidence %
  timeLabel: string;
}

export const OPS_INSIGHTS: OpsInsight[] = [
  {
    id: "I1", type: "surge", severity: "critical", area: "الجمرات",
    title: "تركّز حرج للإجهاد الحراري",
    detail: "١٤٠ حالة حرجة في محيط ٣٠٠م، ٧١٪ منها إجهاد حراري. عيادات الجمرات ممتلئة والحالات الجديدة بلا وجهة قريبة.",
    action: "تجهيز وحدة تبريد متنقلة عند مخرج الجسر + تحويل الاستقبال إلى المستشفى الميداني بمنى",
    confidence: 92, timeLabel: "الآن",
  },
  {
    id: "I2", type: "prediction", severity: "warning", area: "مخيم منى C3",
    title: "توقع ارتفاع الحالات ٤٠٪ خلال ساعتين",
    detail: "عطل التكييف المبلّغ عنه + ذروة الحرارة القادمة (١٥:٠٠–١٧:٠٠) يرفعان معدل البلاغات المتوقع من المخيم.",
    action: "إرسال فني تكييف الآن + وحدة ترطيب وقائية قبل الذروة",
    confidence: 87, timeLabel: "خلال ساعتين",
  },
  {
    id: "I3", type: "logistics", severity: "warning", area: "البوابة الرئيسية",
    title: "مخزون المحاليل أوشك على النفاد",
    detail: "الوحدة المتنقلة م٢ استهلكت ٨٠٪ من المحاليل الوريدية مع استمرار تدفق حالات الجفاف عند البوابة.",
    action: "إعادة تزويد عاجلة من مستودع المستشفى الميداني قبل ١٦:٠٠",
    confidence: 95, timeLabel: "قبل ١٦:٠٠",
  },
  {
    id: "I4", type: "anomaly", severity: "warning", area: "مسار المشاة ٥",
    title: "نمط غير اعتيادي في مكالمات الضياع",
    detail: "١١ بلاغ ضياع من نفس النقطة خلال ٤٠ دقيقة — احتمال انسداد مسار أو تحويلة غير معلنة تشتت المجموعات.",
    action: "تنبيه فرق الإرشاد للتمركز عند التقاطع والتحقق من المسار",
    confidence: 78, timeLabel: "آخر ٤٠ دقيقة",
  },
  {
    id: "I5", type: "prediction", severity: "info", area: "عرفات",
    title: "انخفاض متوقع للحالات بعد المغرب",
    detail: "هبوط الحرارة المتوقع إلى ٣٦° يخفض الحمل ~٣٠٪ — نافذة مناسبة لإراحة الفرق المجهدة.",
    action: "جدولة استبدال فريق التدخل السريع (١١ ساعة عمل) مع بداية النافذة",
    confidence: 83, timeLabel: "بعد المغرب",
  },
];

/* ================= Routing Agent (map cells) =================
 * Click a hot cell → where should these cases go, with how many teams?
 */
export function getCellRecommendation(criticalCount: number, nearestLandmark: string): string {
  if (criticalCount >= 20) {
    return `كثافة حرجة قرب ${nearestLandmark} — وجّه الحالات إلى المستشفى الميداني بمنى (٦ د)؛ عيادات الجمرات ممتلئة. يُنصح بفريقين ووحدة تبريد متنقلة.`;
  }
  if (criticalCount >= 8) {
    return `يُنصح بفريق واحد مزوّد بمحاليل وريدية — أقرب منشأة مستقبِلة: المستشفى الميداني بمنى (٦ د).`;
  }
  return `كثافة منخفضة — تكفي تغطيتها ضمن الجولة القادمة لأقرب وحدة متنقلة، دون سحب فريق من البؤر الأعلى.`;
}

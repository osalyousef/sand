// Agent layer for the field app — mirrors the web dashboard's agent brain
// (dashboard2/lib/agents.ts). Today: deterministic mock intelligence; each
// function's body can later be swapped for an LLM/FastAPI backend call.
//
// Design rule, same as the dashboard: the agent SUGGESTS, a human APPROVES.

import type { RiskLevel } from "@/types";
import type { ScannedPilgrim } from "@/lib/scanned-store";

/* ================= Agent identities ================= */
export const AGENTS = {
  response: { name: "مُغيث", role: "وكيل الاستجابة" },   // medical copilot
  ops: { name: "راصد", role: "وكيل العمليات" },          // surges, logistics
  routing: { name: "دليل", role: "وكيل التوجيه" },        // team & hospital routing
} as const;

/* ================= «راصد» Ops Agent — live insights feed ================= */

export type InsightType = "surge" | "prediction" | "logistics" | "anomaly";
export type InsightSeverity = "critical" | "warning" | "info";

export interface OpsInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  area: string;
  title: string;
  detail: string;
  action: string; // suggested action — executes only on operator approval
  confidence: number; // model confidence %
  timeLabel: string;
}

export const INSIGHT_SEVERITY_COLOR: Record<InsightSeverity, string> = {
  critical: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
};

export const INSIGHT_TYPE_LABEL: Record<InsightType, string> = {
  surge: "تركّز",
  prediction: "توقّع",
  logistics: "إمداد",
  anomaly: "نمط شاذ",
};

export const OPS_INSIGHTS: OpsInsight[] = [
  {
    id: "I1", type: "surge", severity: "critical", area: "الجمرات",
    title: "تركّز حرج للإجهاد الحراري",
    detail: "١٤٠ حالة حرجة، ٧١٪ إجهاد حراري .",
    action: "تجهيز الفرق الطبية",
    confidence: 92, timeLabel: "الآن",
  },
  {
    id: "I2", type: "prediction", severity: "warning", area: "مخيم منى C3",
    title: "توقع ارتفاع الحالات ٤٠٪ خلال ساعتين",
    detail: " ذروة حرارة قادمة (٣:٠٠ - ٥:٠٠) يرفعان البلاغات المتوقعة.",
    action: "التواجد في الاماكن ذات الازدحام العالي",
    confidence: 87, timeLabel: "خلال ساعتين",
  },
  {
    id: "I4", type: "anomaly", severity: "warning", area: "مسار المشاة ٥",
    title: "نمط غير اعتيادي في بلاغات الضياع",
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

/* ================= «دليل» Routing Agent — cell recommendation ================= */

export function getCellRecommendation(
  intensity: number, // normalised cell density ∈ [0,1]
  nearestLandmark: string,
): { headline: string; teams: number } {
  if (intensity >= 0.75) {
    return {
      headline: `كثافة حرجة قرب ${nearestLandmark} — وجّه الحالات إلى المستشفى الميداني بمنى (٦ د)؛ عيادات الجمرات ممتلئة. يُنصح بفريقين ووحدة تبريد متنقلة.`,
      teams: 2,
    };
  }
  if (intensity >= 0.4) {
    return {
      headline: `يُنصح بفريق واحد مزوّد بمحاليل وريدية — أقرب منشأة مستقبِلة: المستشفى الميداني بمنى (٦ د).`,
      teams: 1,
    };
  }
  return {
    headline: `كثافة منخفضة — تكفي تغطيتها ضمن الجولة القادمة لأقرب وحدة متنقلة، دون سحب فريق من البؤر الأعلى.`,
    teams: 0,
  };
}

/* ================= «مُغيث» Response Agent — medical copilot ================= */

export interface ResponseSuggestion {
  diagnosis: { title: string; detail: string; severity: RiskLevel };
  treatment: string;
  questions: string[];
  guidance: string;
  fieldBrief: string[];
}

// Heuristic copilot: from the scanned record's vitals + chronic conditions it
// produces the same clinical structure the dashboard's مُغيث agent returns. The
// dominant abnormality decides the working assessment. Deterministic.
export function getResponseSuggestion(entry: ScannedPilgrim): ResponseSuggestion {
  const { pilgrim, vitals } = entry;
  const hr = vitals.heart_rate ?? 0;
  const temp = vitals.temperature ?? 0;
  const ox = vitals.oxygen_level ?? 100;

  // Cardiac suspicion — heart history with a high heart rate.
  if (pilgrim.has_heart_condition && (hr >= 115 || ox <= 92)) {
    return {
      diagnosis: {
        title: "اشتباه متلازمة شريان تاجي حادة (ACS)",
        detail: "ارتفاع النبض لدى حاج بتاريخ قلبي مع هبوط الأكسجين — يُعامل كنوبة قلبية حتى يثبت العكس.",
        severity: "red",
      },
      treatment: "منع أي مجهود فوراً · وضعية جلوس مسندة · أسبرين ٣٠٠مغ مضغاً إن لم توجد حساسية · أكسجين ومراقبة الوعي حتى وصول الفريق.",
      questions: [
        "هل الألم ينتشر إلى الذراع أو الفك أو الظهر؟",
        "منذ متى بدأت الأعراض بالضبط؟",
        "هل لديه حساسية من الأسبرين؟",
        "هل يتعرّق بشكل غير طبيعي الآن؟",
      ],
      guidance: "ابقَ في مكانك تماماً ولا تبذل أي مجهود. أرخِ ملابسك واجلس مستنداً. الفريق الطبي في الطريق إليك الآن.",
      fieldBrief: [
        `الشكوى: نبض ${hr} · أكسجين ${ox}٪ — اشتباه ACS`,
        "الخلفية: تاريخ قلبي معروف",
        "أُعطي إرشاد: راحة تامة، وضعية جلوس",
        "جهّزوا: ECG، أسبرين، أكسجين — الأولوية قصوى",
      ],
    };
  }

  // Heat stress / heat stroke — high temperature.
  if (temp >= 39) {
    return {
      diagnosis: {
        title: temp >= 40 ? "اشتباه ضربة شمس" : "إجهاد حراري متقدم",
        detail: `حرارة الجسم ${temp}°م في أجواء بالغة الحرارة — مرحلة قابلة للعكس إذا بُرّدت خلال دقائق.`,
        severity: temp >= 40 ? "red" : "yellow",
      },
      treatment: "نقل فوري للظل · تبريد سطحي (بلل الوجه والرقبة) · ماء بارد على دفعات صغيرة · مراقبة مستوى الوعي.",
      questions: [
        "هل يشعر بغثيان أو تقيّأ؟",
        "هل توقف التعرّق لديه؟ (علامة خطر)",
        "متى آخر مرة شرب فيها ماء؟",
        "هل يشعر بتشوش في الرؤية أو صداع؟",
      ],
      guidance: "انتقل إلى أقرب ظل فوراً واشرب ماءً بارداً ببطء. بلّل وجهك ورقبتك بالماء ولا تمشِ وحدك.",
      fieldBrief: [
        `الشكوى: حرارة ${temp}°م — إجهاد حراري`,
        "العلامة الفارقة المطلوبة: هل توقف التعرّق؟",
        "أُعطي إرشاد: ظل + تبريد + ماء تدريجي",
        "جهّزوا: محاليل ترطيب وكمادات تبريد",
      ],
    };
  }

  // Diabetic emergency — diabetic with abnormal vitals.
  if (pilgrim.has_diabetes && (hr >= 110 || ox <= 93)) {
    return {
      diagnosis: {
        title: "اشتباه اضطراب سكري حاد",
        detail: "مريض سكري مع علامات حيوية غير مستقرة — يُقيّم هبوط/ارتفاع السكر فوراً.",
        severity: "red",
      },
      treatment: "قياس سكر فوري · سكر سريع فموياً إن كان واعياً ويعاني هبوطاً · لا يُترك وحده إطلاقاً حتى وصول الفريق.",
      questions: [
        "هل ما زال واعياً وقادراً على البلع؟",
        "متى آخر جرعة إنسولين وكم كانت؟",
        "متى آخر وجبة أكلها؟",
        "هل يوجد أحد بجانبه الآن؟",
      ],
      guidance: "اطلب من أقرب شخص قطعة حلوى أو عصيراً إن شعرت بهبوط — لا تنتظر. ابقَ جالساً ولا تمشِ. الفريق في الطريق.",
      fieldBrief: [
        "الشكوى: اضطراب سكري مشتبه",
        `الوعي: يُؤكَّد عند التواصل · نبض ${hr}`,
        "أُعطي إرشاد: سكر فموي فوري عند الهبوط",
        "جهّزوا: جلوكاجون، جلوكوميتر، محلول جلوكوز",
      ],
    };
  }

  // Stable / low-acuity baseline.
  return {
    diagnosis: {
      title: "حالة مستقرة — متابعة وقائية",
      detail: "العلامات الحيوية ضمن النطاق المقبول؛ يُكتفى بالمتابعة وإبقاء الحاج في وضع آمن وظليل.",
      severity: "green",
    },
    treatment: "ترطيب فموي منتظم · بقاء في الظل وتجنّب المجهود في ذروة الحر · إعادة تقييم عند أي تغيّر.",
    questions: [
      "هل يشعر بأي ألم أو دوار الآن؟",
      "متى آخر مرة شرب فيها ماء؟",
      "هل لديه أدوية مزمنة لم يأخذها اليوم؟",
    ],
    guidance: "أنت بخير حالياً. ابقَ في مكان ظليل، اشرب الماء بانتظام، وتواصل معنا فوراً عند أي تغيّر.",
    fieldBrief: [
      "الحالة: مستقرة — لا تدخّل عاجل",
      `العلامات: نبض ${hr} · حرارة ${temp}° · أكسجين ${ox}٪`,
      "المطلوب: متابعة وقائية فقط",
    ],
  };
}

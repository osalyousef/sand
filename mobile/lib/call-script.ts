// Pre-scripted bilingual exchange used by the fake call demo.
// Each turn auto-plays at the given delay (ms after previous turn).

export type Turn =
  | {
      role: "pilgrim";
      original: string;       // pilgrim's language
      translation: string;    // Arabic for the coordinator
      durationMs: number;     // how long the "speech" lasts
      delayMs?: number;       // delay before this turn starts
    }
  | {
      role: "coordinator";
      original: string;       // Arabic typed by coordinator
      translation: string;    // pilgrim's language (spoken back)
      durationMs: number;
      delayMs?: number;
    };

export interface CallerProfile {
  name: string;
  language: string;       // human label, Arabic
  languageCode: string;   // ISO-ish, e.g. "id"
  flag: string;           // emoji
  location: string;
  age: number;
}

export const DEMO_CALLER: CallerProfile = {
  name: "سيتي نور حسنة",
  language: "إندونيسية",
  languageCode: "id",
  flag: "🇮🇩",
  location: "منى",
  age: 62,
};

export const DEMO_SCRIPT: Turn[] = [
  {
    role: "pilgrim",
    original: "Halo, tolong! Saya tersesat di Mina dan saya merasa pusing.",
    translation: "مرحبًا، أرجوكم! أنا تائهة في منى وأشعر بدوار شديد.",
    durationMs: 4200,
    delayMs: 800,
  },
  {
    role: "pilgrim",
    original: "Saya punya diabetes dan belum makan sejak pagi.",
    translation: "أعاني من السكري ولم آكل شيئًا منذ الصباح.",
    durationMs: 3800,
    delayMs: 600,
  },
  {
    role: "coordinator",
    original: "ابقي مكانك، الفريق الطبي في طريقه إليك الآن. هل أنتِ قريبة من جسر الجمرات؟",
    translation:
      "Tetap di tempat Anda, tim medis sedang menuju ke sana. Apakah Anda dekat Jembatan Jamarat?",
    durationMs: 4400,
    delayMs: 1500,
  },
  {
    role: "pilgrim",
    original: "Ya, saya bisa melihatnya. Saya duduk di pinggir jalan dekat tenda hijau.",
    translation: "نعم، أراه. أنا جالسة على جانب الطريق بجانب الخيمة الخضراء.",
    durationMs: 4600,
    delayMs: 900,
  },
  {
    role: "coordinator",
    original: "ممتاز. سنصل خلال 4 دقائق. اشربي الماء ببطء ولا تتحركي.",
    translation:
      "Bagus. Kami akan tiba dalam 4 menit. Minum air perlahan dan jangan bergerak.",
    durationMs: 4200,
    delayMs: 1200,
  },
];

// Daily operations report — opens a print-ready RTL page and triggers the
// browser's print dialog (user saves as PDF). No PDF library needed, and the
// browser handles Arabic shaping/RTL natively.

import { MOCK_PILGRIMS, AI_KPIS } from "./mock-data";
import { INSTITUTIONS, INSTITUTION_STATUS_META, RECOVERY_STATS, CURRENT_SHIFT, occupancyPct } from "./ops-data";
import { OPS_INSIGHTS, buildHandoffReport, AGENTS } from "./agents";

export function exportDailyReport() {
  const now = new Date();
  const dateAr = now.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeAr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  const red = MOCK_PILGRIMS.filter(p => p.riskLevel === "red").length;
  const yellow = MOCK_PILGRIMS.filter(p => p.riskLevel === "yellow").length;
  const green = MOCK_PILGRIMS.filter(p => p.riskLevel === "green").length;

  const institutionsRows = INSTITUTIONS.map(i => {
    const pct = occupancyPct(i);
    return `<tr>
      <td>${i.name}</td>
      <td>${i.bedsOccupied} / ${i.bedsTotal}</td>
      <td>${pct}%</td>
      <td>${i.casesToday}</td>
      <td>${INSTITUTION_STATUS_META[i.status].label}</td>
    </tr>`;
  }).join("");

  const insightsRows = OPS_INSIGHTS.map(i => `<tr>
    <td>${i.area}</td>
    <td>${i.title}</td>
    <td>${i.action}</td>
    <td>${i.confidence}%</td>
  </tr>`).join("");

  const handoff = buildHandoffReport(0).replace(/\n/g, "<br/>");

  const html = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>سند — تقرير العمليات اليومي</title>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Segoe UI", Tahoma, sans-serif; color: #1d2b27; margin: 0; padding: 32px; background: #fff; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f4a3e; padding-bottom: 14px; margin-bottom: 20px; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .logo { width: 40px; height: 40px; border-radius: 9px; background: #0f4a3e; color: #fff; font-weight: bold; font-size: 20px; display: flex; align-items: center; justify-content: center; }
  h1 { font-size: 18px; margin: 0; color: #0f4a3e; }
  .sub { font-size: 11px; color: #7b7563; }
  h2 { font-size: 13px; color: #0f4a3e; border-right: 4px solid #b08d57; padding-right: 8px; margin: 22px 0 10px; }
  .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .kpi { border: 1px solid #e6e2d6; border-radius: 10px; padding: 10px; text-align: center; background: #faf8f3; }
  .kpi b { display: block; font-size: 20px; color: #0f4a3e; }
  .kpi.red b { color: #b93232; }
  .kpi span { font-size: 10px; color: #7b7563; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0f4a3e; color: #fff; padding: 6px 8px; text-align: right; }
  td { border: 1px solid #e6e2d6; padding: 6px 8px; }
  tr:nth-child(even) td { background: #faf8f3; }
  .handoff { border: 1px solid #e6e2d6; border-radius: 10px; padding: 12px; font-size: 11px; line-height: 1.9; background: #faf8f3; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e6e2d6; font-size: 10px; color: #7b7563; display: flex; justify-content: space-between; }
  .risk { display: flex; gap: 10px; }
  .risk div { flex: 1; border-radius: 10px; padding: 10px; text-align: center; color: #fff; }
  .risk b { display: block; font-size: 22px; }
  .risk span { font-size: 11px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo">س</div>
      <div>
        <h1>سند — تقرير العمليات اليومي</h1>
        <div class="sub">مركز قيادة صحة الحجاج · وزارة الحج والعمرة</div>
      </div>
    </div>
    <div class="sub" style="text-align:left">${dateAr}<br/>وقت الإصدار: ${timeAr}</div>
  </header>

  <h2>مؤشرات اليوم</h2>
  <div class="kpis">
    <div class="kpi"><b>${AI_KPIS.totalPilgrims}</b><span>حاج تحت المراقبة</span></div>
    <div class="kpi red"><b>${red}</b><span>حالة حرجة</span></div>
    <div class="kpi"><b>${RECOVERY_STATS.today}</b><span>تعافوا اليوم (+${RECOVERY_STATS.today - RECOVERY_STATS.yesterday})</span></div>
    <div class="kpi"><b>${AI_KPIS.avgResponseTime}</b><span>متوسط الاستجابة</span></div>
    <div class="kpi"><b>${AI_KPIS.predictionAccuracy}%</b><span>دقة التنبؤ</span></div>
  </div>

  <h2>توزيع مستوى الخطورة</h2>
  <div class="risk">
    <div style="background:#b93232"><b>${red}</b><span>خطر</span></div>
    <div style="background:#a3741d"><b>${yellow}</b><span>تحذير</span></div>
    <div style="background:#0f4a3e"><b>${green}</b><span>آمن</span></div>
  </div>

  <h2>المنشآت الصحية</h2>
  <table>
    <thead><tr><th>المنشأة</th><th>الأسرّة</th><th>الإشغال</th><th>حالات اليوم</th><th>الحالة</th></tr></thead>
    <tbody>${institutionsRows}</tbody>
  </table>

  <h2>رؤى «${AGENTS.ops.name}» — ${AGENTS.ops.role}</h2>
  <table>
    <thead><tr><th>المنطقة</th><th>الرؤية</th><th>الإجراء المقترح</th><th>الثقة</th></tr></thead>
    <tbody>${insightsRows}</tbody>
  </table>

  <h2>موجز الوردية — صاغه «${AGENTS.handoff.name}» ${AGENTS.handoff.role}</h2>
  <div class="handoff">${handoff}</div>

  <footer>
    <span>أُعد بمساعدة وكلاء سند الأذكياء (${AGENTS.ops.name}، ${AGENTS.response.name}، ${AGENTS.handoff.name}) — روجع واعتُمد بشرياً</span>
    <span>المعتمد: ${CURRENT_SHIFT.supervisor} · ${CURRENT_SHIFT.name}</span>
  </footer>

  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=920,height=720");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

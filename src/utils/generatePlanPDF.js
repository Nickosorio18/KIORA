/* ═══════════════════════════════════════════════════════
   KYŌRA — Generador de Plan Descargable
   Abre una ventana print-friendly con el plan estilizado.
   El usuario puede guardar como PDF desde el diálogo
   nativo del navegador (Ctrl+P → Guardar como PDF).
   Sin dependencias externas.
   ═══════════════════════════════════════════════════════ */

/**
 * Genera y abre una vista imprimible del plan de comidas.
 *
 * @param {object} params
 * @param {Array<{label: string, name: string, time: string, calories: number, protein: number}>} params.meals
 * @param {string} [params.userName] — nombre del usuario
 * @param {string} [params.date] — fecha (default: hoy)
 * @param {string} [params.agentText] — texto del agente (tips, explicaciones)
 */
/**
 * Mini-markdown renderer for PDF tips: handles **bold**, *italic*, ### headings,
 * - bullets, and line breaks. Intentionally minimal (no tables/code/links).
 */
function renderInlineMarkdown(text) {
  const escape = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const lines = text.split("\n");
  const out = [];
  let inList = false;
  const flushList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  const inline = (s) => escape(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  for (const raw of lines) {
    const l = raw.trimEnd();
    if (!l.trim()) { flushList(); continue; }
    if (/^###\s+/.test(l)) { flushList(); out.push(`<h4>${inline(l.replace(/^###\s+/, ""))}</h4>`); continue; }
    if (/^##\s+/.test(l))  { flushList(); out.push(`<h4>${inline(l.replace(/^##\s+/, ""))}</h4>`); continue; }
    if (/^[-•]\s+/.test(l)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${inline(l.replace(/^[-•]\s+/, ""))}</li>`);
      continue;
    }
    flushList();
    out.push(`<p>${inline(l)}</p>`);
  }
  flushList();
  return out.join("");
}

export function generatePlanPDF({ meals, userName = "Usuario", date, agentText }) {
  const today = date || new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProt = meals.reduce((s, m) => s + (m.protein || 0), 0);

  const mealsHTML = meals
    .map(
      (m) => `
      <tr>
        <td class="time">${m.time || "—"}</td>
        <td class="label">${m.label}</td>
        <td class="name">${m.name}</td>
        <td class="num">${m.calories} kcal</td>
        <td class="num">${m.protein}g</td>
      </tr>`
    )
    .join("");

  const tipsHTML = agentText
    ? `<div class="tips">
        <h3>Notas de tu coach</h3>
        ${renderInlineMarkdown(agentText)}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan KYŌRA — ${today}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Jost', system-ui, sans-serif;
      color: #1A1A2E;
      background: #FFF;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #C8A96E;
    }

    .brand {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #1A1A2E;
    }

    .brand span { color: #C8A96E; }

    .meta {
      text-align: right;
      font-size: 12px;
      color: #6B6B80;
      line-height: 1.6;
    }

    .meta strong { color: #1A1A2E; font-weight: 500; }

    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 600;
      color: #1A1A2E;
      margin-bottom: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }

    thead th {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9A9189;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #E8D5A3;
    }

    thead th:nth-child(4),
    thead th:nth-child(5) { text-align: right; }

    tbody tr { border-bottom: 1px solid rgba(200,169,110,.1); }

    td {
      padding: 10px;
      font-size: 13px;
      vertical-align: middle;
    }

    td.time {
      color: #9A9189;
      font-size: 12px;
      width: 50px;
    }

    td.label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #C8A96E;
      width: 80px;
    }

    td.name { font-weight: 400; }

    td.num {
      text-align: right;
      color: #6B6B80;
      font-size: 12px;
      white-space: nowrap;
    }

    .totals {
      display: flex;
      gap: 24px;
      margin-bottom: 28px;
      padding: 14px 16px;
      background: rgba(200,169,110,.05);
      border: 1px solid rgba(200,169,110,.15);
      border-radius: 6px;
    }

    .total-item {
      font-size: 12px;
      color: #6B6B80;
    }

    .total-item strong {
      font-size: 16px;
      color: #1A1A2E;
      font-weight: 600;
    }

    .tips {
      margin-bottom: 28px;
      padding: 16px;
      background: #FAF8F5;
      border-left: 3px solid #C8A96E;
      border-radius: 0 6px 6px 0;
    }

    .tips h3 {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #C8A96E;
      margin-bottom: 8px;
    }

    .tips p {
      font-size: 13px;
      line-height: 1.6;
      color: #6B6B80;
      margin-bottom: 8px;
    }

    .tips h4 {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 10px 0 6px;
    }

    .tips ul {
      list-style: none;
      margin: 4px 0 10px;
      padding-left: 4px;
    }

    .tips li {
      font-size: 13px;
      line-height: 1.6;
      color: #6B6B80;
      padding-left: 14px;
      position: relative;
    }

    .tips li::before {
      content: "•";
      color: #C8A96E;
      position: absolute;
      left: 0;
      font-weight: 600;
    }

    .tips strong { color: #1A1A2E; font-weight: 600; }
    .tips em { font-style: italic; color: #6B6B80; }

    /* Page break avoidance for print */
    table, .totals, .tips { page-break-inside: avoid; }
    .tips h4, .tips li { page-break-inside: avoid; }
    tr { page-break-inside: avoid; page-break-after: auto; }

    .disclaimer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid rgba(200,169,110,.15);
      font-size: 10px;
      color: #9A9189;
      line-height: 1.6;
      text-align: center;
    }

    .print-note {
      text-align: center;
      margin-bottom: 24px;
      padding: 10px;
      background: #F0EBE3;
      border-radius: 6px;
      font-size: 12px;
      color: #6B6B80;
    }

    @media print {
      body { padding: 20px; }
      .print-note { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-note">Usa <strong>Ctrl+P</strong> (o Cmd+P) → <strong>Guardar como PDF</strong> para descargar tu plan.</div>

  <div class="header">
    <div class="brand">KY<span>Ō</span>RA</div>
    <div class="meta">
      <strong>${userName}</strong><br>
      ${today}
    </div>
  </div>

  <h2>Tu Plan de Alimentación</h2>

  <table>
    <thead>
      <tr>
        <th>Hora</th>
        <th>Tipo</th>
        <th>Comida</th>
        <th>Calorías</th>
        <th>Proteína</th>
      </tr>
    </thead>
    <tbody>
      ${mealsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-item"><strong>${totalCal}</strong> kcal totales</div>
    <div class="total-item"><strong>${totalProt}g</strong> proteína total</div>
    <div class="total-item"><strong>${meals.length}</strong> comidas</div>
  </div>

  ${tipsHTML}

  <div class="disclaimer">
    ⚕ KYŌRA ofrece orientación nutricional general basada en evidencia. No sustituye la asesoría médica profesional.
    Ante cualquier síntoma o condición de salud, consulta a un médico o nutriólogo certificado.
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Tu navegador bloqueó la ventana emergente. Permite pop-ups para kyora y vuelve a intentar.");
    return;
  }
  win.document.write(html);
  win.document.close();
  // Auto-trigger print dialog after a brief delay for fonts to load
  setTimeout(() => win.print(), 600);
}

/* ═══════════════════════════════════════════════════════
   generateWeeklyPlanPDF
   Genera una vista imprimible del plan semanal completo
   (7 días + lista de compras + rutina de ejercicio).
   ═══════════════════════════════════════════════════════ */

const e = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function dayLabel(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("es", {
      day: "numeric", month: "long",
    });
  } catch { return iso; }
}

function buildDayHTML(day, exDay) {
  const meals = day.meals || [];
  const totals = day.totals || meals.reduce(
    (a, m) => ({ calories: a.calories + (m.calories || 0), protein: a.protein + (m.protein || 0), carbs: a.carbs + (m.carbs || 0), fats: a.fats + (m.fats || 0) }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const mealsHTML = meals.map((m) => `
    <div class="meal">
      <div class="meal-head">
        <span class="meal-label">${e(m.label)}</span>
        <span class="meal-name">${e(m.name)}</span>
        <span class="meal-macros">${m.calories ?? 0} kcal · ${m.protein ?? 0}g prot · ${m.carbs ?? 0}g carb · ${m.fats ?? 0}g gras</span>
      </div>
      ${m.description ? `<p class="meal-desc">${e(m.description)}</p>` : ""}
      ${m.ingredients?.length ? `
        <div class="meal-ing-wrap">
          <span class="meal-ing-label">Ingredientes:</span>
          ${m.ingredients.map((i) => `<span class="meal-ing">${e(i)}</span>`).join("")}
        </div>` : ""}
      ${m.recipe ? `<div class="meal-recipe">${e(m.recipe)}</div>` : ""}
    </div>`).join("");

  const exercisesHTML = exDay?.exercises?.length ? `
    <div class="ex-section">
      <div class="section-title">Entrenamiento</div>
      ${exDay.exercises.map((ex) => `
        <div class="ex-item">
          <span class="ex-name">${e(ex.name)}</span>
          <span class="ex-meta">${buildExMeta(ex)}</span>
          ${ex.notes ? `<span class="ex-notes">${e(ex.notes)}</span>` : ""}
        </div>`).join("")}
    </div>` : "";

  return `
    <div class="day-block">
      <div class="day-head">
        <span class="day-name">${e(day.day?.charAt(0).toUpperCase() + day.day?.slice(1) || "")}</span>
        <span class="day-date">${dayLabel(day.date)}</span>
        <span class="day-totals">${totals.calories} kcal · ${totals.protein}g P · ${totals.carbs}g C · ${totals.fats}g G</span>
      </div>
      <div class="section-title">Nutrición</div>
      ${mealsHTML || "<p class='empty'>Sin comidas registradas</p>"}
      ${exercisesHTML}
    </div>`;
}

function buildExMeta(ex) {
  if (ex.type === "cardio" || ex.type === "hiit" || ex.type === "flexibility") {
    return `${ex.duration || 0} min`;
  }
  const w = ex.weight > 0 ? ` · ${ex.weight} kg` : "";
  return `${ex.sets || 0} sets × ${ex.reps || 0} reps${w}`;
}

function buildShoppingHTML(list) {
  if (!list?.length) return "";
  return `
    <div class="shopping-block">
      <div class="block-title">Lista de Compras</div>
      ${list.map((sect) => `
        <div class="shop-cat">
          <div class="shop-cat-name">${e(sect.category)}</div>
          <ul class="shop-list">
            ${(sect.items || []).map((it) => `
              <li><span>${e(it.name)}</span><span class="shop-qty">${e(it.quantity)}</span></li>`).join("")}
          </ul>
        </div>`).join("")}
    </div>`;
}

export function generateWeeklyPlanPDF(plan, userName = "Usuario") {
  const { title, profileSnapshot, days = [], exerciseRoutine, shoppingList, notes, createdAt } = plan;

  const createdStr = createdAt
    ? new Date(createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });

  const targetsHTML = profileSnapshot ? `
    <div class="targets">
      <div class="target"><span class="target-val">${profileSnapshot.caloriesTarget ?? "—"}</span><span class="target-lbl">kcal</span></div>
      <div class="target"><span class="target-val">${profileSnapshot.proteinTarget ?? "—"}g</span><span class="target-lbl">proteína</span></div>
      <div class="target"><span class="target-val">${profileSnapshot.carbsTarget ?? "—"}g</span><span class="target-lbl">carbos</span></div>
      <div class="target"><span class="target-val">${profileSnapshot.fatsTarget ?? "—"}g</span><span class="target-lbl">grasas</span></div>
    </div>` : "";

  const daysHTML = days.map((day, i) => {
    const exDay = Array.isArray(exerciseRoutine) ? exerciseRoutine[i] : null;
    return buildDayHTML(day, exDay);
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${e(title || "Plan KYŌRA")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Jost',system-ui,sans-serif;color:#1A1A2E;background:#FFF;font-size:13px;line-height:1.5}
    .page{max-width:800px;margin:0 auto;padding:36px 40px 48px}

    /* Print hint */
    .print-hint{background:#FAF1E0;border:1px solid rgba(200,169,110,.35);border-radius:6px;padding:10px 16px;font-size:11.5px;color:#6B5A35;margin-bottom:24px;text-align:center}
    .print-hint strong{color:#1A1A2E}
    @media print{.print-hint{display:none}}

    /* Header */
    .doc-header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:16px;border-bottom:2px solid #C8A96E;margin-bottom:24px}
    .brand{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;letter-spacing:6px;color:#1A1A2E}
    .brand span{color:#C8A96E}
    .doc-meta{text-align:right;font-size:11px;color:#6B6B80;line-height:1.7}
    .doc-meta strong{display:block;font-size:13px;font-weight:600;color:#1A1A2E}

    /* Plan title + targets */
    .plan-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:600;color:#1A1A2E;margin-bottom:4px}
    .plan-sub{font-size:11px;color:#9A9189;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px}
    .targets{display:flex;gap:12px;margin-bottom:28px}
    .target{background:rgba(200,169,110,.07);border:1px solid rgba(200,169,110,.2);border-radius:6px;padding:10px 14px;text-align:center;min-width:80px}
    .target-val{display:block;font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#1A1A2E}
    .target-lbl{display:block;font-size:10px;font-weight:400;color:#9A9189;letter-spacing:.1em;text-transform:uppercase;margin-top:2px}

    /* Day block */
    .day-block{margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid rgba(200,169,110,.15)}
    .day-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px;padding:8px 12px;background:#FAF8F5;border-left:3px solid #C8A96E;border-radius:0 4px 4px 0}
    .day-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:#1A1A2E;text-transform:capitalize}
    .day-date{font-size:11px;color:#9A9189;flex:1}
    .day-totals{font-size:11px;font-weight:500;color:#6B6B80;background:rgba(200,169,110,.1);padding:3px 8px;border-radius:3px;white-space:nowrap}

    /* Section title */
    .section-title{font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C8A96E;margin:10px 0 7px}

    /* Meals */
    .meal{margin-bottom:9px;padding:9px 10px;border:1px solid rgba(200,169,110,.12);border-radius:4px;page-break-inside:avoid}
    .meal-head{display:flex;align-items:baseline;gap:8px;margin-bottom:3px;flex-wrap:wrap}
    .meal-label{font-size:9px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#C8A96E;min-width:62px}
    .meal-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:600;color:#1A1A2E;flex:1}
    .meal-macros{font-size:10px;color:#9A9189;white-space:nowrap}
    .meal-desc{font-size:11.5px;color:#6B6B80;margin-bottom:5px;font-style:italic}
    .meal-ing-wrap{margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;align-items:center}
    .meal-ing-label{font-size:9.5px;font-weight:600;color:#9A9189;letter-spacing:.08em;margin-right:2px}
    .meal-ing{font-size:10.5px;color:#1A1A2E;background:rgba(200,169,110,.07);border:1px solid rgba(200,169,110,.18);border-radius:3px;padding:1px 6px}
    .meal-recipe{margin-top:7px;font-family:'Playfair Display',Georgia,serif;font-size:12px;color:#6B6B80;line-height:1.65;white-space:pre-line;border-top:1px solid rgba(200,169,110,.1);padding-top:6px}

    /* Exercises */
    .ex-section{margin-top:10px}
    .ex-item{display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1px solid rgba(200,169,110,.08)}
    .ex-name{font-family:'Playfair Display',serif;font-size:12.5px;font-weight:600;color:#1A1A2E;flex:1}
    .ex-meta{font-size:10.5px;color:#6B6B80;white-space:nowrap}
    .ex-notes{font-size:10.5px;color:#9A9189;font-style:italic}

    /* Shopping */
    .shopping-block{page-break-before:always;padding-top:8px}
    .block-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:#1A1A2E;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(200,169,110,.25)}
    .shop-cat{margin-bottom:14px;page-break-inside:avoid}
    .shop-cat-name{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#C8A96E;margin-bottom:5px}
    .shop-list{list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:2px 12px}
    .shop-list li{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(200,169,110,.07);font-size:12px}
    .shop-qty{color:#9A9189;font-size:11px;white-space:nowrap}

    /* Notes */
    .plan-notes{margin-top:20px;padding:14px 16px;background:#FAF8F5;border-left:3px solid #C8A96E;border-radius:0 4px 4px 0;font-family:'Playfair Display',Georgia,serif;font-size:12.5px;color:#1A1A2E;line-height:1.7;font-style:italic;page-break-inside:avoid}

    /* Footer / disclaimer */
    .disclaimer{margin-top:36px;padding-top:14px;border-top:1px solid rgba(200,169,110,.15);font-size:9.5px;color:#9A9189;line-height:1.6;text-align:center}

    .empty{font-size:11.5px;color:#9A9189;font-style:italic;padding:6px 0}
  </style>
</head>
<body>
  <div class="page">
    <div class="print-hint">
      Usa <strong>Ctrl+P</strong> (o Cmd+P) → selecciona <strong>"Guardar como PDF"</strong> para descargar.
    </div>

    <div class="doc-header">
      <div class="brand">KY<span>Ō</span>RA</div>
      <div class="doc-meta">
        <strong>${e(userName)}</strong>
        Generado el ${e(createdStr)}
      </div>
    </div>

    <div class="plan-title">${e(title || "Plan Semanal")}</div>
    <div class="plan-sub">Objetivos diarios</div>
    ${targetsHTML}

    ${daysHTML}
    ${buildShoppingHTML(shoppingList)}
    ${notes ? `<div class="plan-notes">${e(notes)}</div>` : ""}

    <div class="disclaimer">
      ⚕ KYŌRA ofrece orientación nutricional general basada en evidencia científica. No reemplaza la asesoría médica profesional.<br>
      Ante cualquier síntoma, condición de salud o duda clínica, consulta a un médico o nutriólogo certificado.
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes");
  if (!win) {
    alert("Tu navegador bloqueó la ventana emergente. Permite pop-ups para este sitio e intenta de nuevo.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 900);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Inspection } from "@/types/inspection";

const STATUS_LABEL: Record<string, string> = {
  YES: "✓ Yes",
  NO: "✗ No",
  NA: "N/A",
  UNKNOWN: "—",
};

export function exportInspectionPdf(inspection: Inspection) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const { header, checklist } = inspection;

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Title ──────────────────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Construction Safety Inspection Report", pageW / 2, 20, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageW / 2,
    27,
    { align: "center" }
  );
  doc.setTextColor(0);

  // ── Inspection header info ─────────────────────────────────────────────────
  autoTable(doc, {
    startY: 33,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    head: [["Field", "Value"]],
    body: [
      ["Company", header.company_name || "—"],
      ["Jobsite Address", header.jobsite_address || "—"],
      ["Superintendent", header.superintendent || "—"],
      ["Date / Time", header.date_time ? new Date(header.date_time).toLocaleString() : "—"],
      ["Inspectors", header.inspectors.length ? header.inspectors.join(", ") : "—"],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
    },
  });

  // ── Checklist sections ─────────────────────────────────────────────────────
  for (const section of checklist) {
    const sectionY = (doc as any).lastAutoTable.finalY + 8;

    // Section heading
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(section.name, margin, sectionY);

    const rows = section.items.map((item) => {
      const evidenceText = item.evidence
        .map((e) => e.snippet_text)
        .filter(Boolean)
        .join("; ");
      const confidencePct =
        item.status === "UNKNOWN" ? "—" : `${Math.round(item.confidence * 100)}%`;

      return [
        item.item_number.toString(),
        item.question_text,
        STATUS_LABEL[item.status] ?? item.status,
        confidencePct,
        evidenceText || item.notes || "—",
      ];
    });

    autoTable(doc, {
      startY: sectionY + 4,
      margin: { left: margin, right: margin },
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
      head: [["#", "Question", "Status", "Confidence", "Evidence / Notes"]],
      body: rows,
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 72 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: "auto" },
      },
      didParseCell(data) {
        if (data.column.index === 2 && data.section === "body") {
          const val = String(data.cell.raw);
          if (val.startsWith("✓")) data.cell.styles.textColor = [22, 163, 74];
          else if (val.startsWith("✗")) data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
  }

  // ── Summary footer ─────────────────────────────────────────────────────────
  const allItems = checklist.flatMap((s) => s.items);
  const counts = {
    YES: allItems.filter((i) => i.status === "YES").length,
    NO: allItems.filter((i) => i.status === "NO").length,
    NA: allItems.filter((i) => i.status === "NA").length,
    UNKNOWN: allItems.filter((i) => i.status === "UNKNOWN").length,
  };

  const summaryY = (doc as any).lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: summaryY,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.5, halign: "center" },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    head: [["Compliant (Yes)", "Non-Compliant (No)", "Not Applicable", "Unassessed"]],
    body: [[counts.YES, counts.NO, counts.NA, counts.UNKNOWN]],
  });

  // ── Page numbers ───────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, doc.internal.pageSize.getHeight() - 8, {
      align: "right",
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10);
  const siteName = header.jobsite_address?.replace(/[^a-z0-9]/gi, "_").slice(0, 30) || "inspection";
  doc.save(`SiteSafe_${siteName}_${dateStr}.pdf`);
}


import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import hospitalMap from "../data/hospital-map.json";

const checkpoints = hospitalMap.nodes.filter(
  (node) => typeof node.qrCode === "string" && node.qrCode.trim().length > 0
);

function QRCodePage({ onBack }) {
  async function downloadPDF() {
    const pdf = new jsPDF("p", "mm", "a4");

    const qrElements = document.querySelectorAll(".qr-print-item");

    for (let i = 0; i < qrElements.length; i++) {
      const element = qrElements[i];

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");

      const margin = 15;
      const maxWidth = 80;
      const maxHeight = 80;
      const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imageWidth = canvas.width * scale;
      const imageHeight = canvas.height * scale;

      const column = i % 2;
      const row = Math.floor((i % 6) / 2);

      const cellX = margin + column * 95;
      const cellY = margin + row * 90;
      const x = cellX + (maxWidth - imageWidth) / 2;
      const y = cellY + (maxHeight - imageHeight) / 2;

      pdf.addImage(
        imageData,
        "PNG",
        x,
        y,
        imageWidth,
        imageHeight
      );

      // Add a new page after every 6 QR codes
      if ((i + 1) % 6 === 0 && i + 1 < qrElements.length) {
        pdf.addPage();
      }
    }

    pdf.save("hospital-QR-codes.pdf");
  }

  return (
    <div style={{ padding: "30px" }}>
      <button type="button" onClick={onBack} className="icon-button" aria-label="Back to home">
        ← Back
      </button>
      <h1>Hospital QR Codes</h1>

      <button
        type="button"
        onClick={downloadPDF}
        className="primary-button"
        style={{
          marginBottom: "30px",
          padding: "12px 20px",
          fontSize: "16px",
        }}
      >
        Download All QR Codes as PDF
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "30px",
        }}
      >
        {checkpoints.map((node) => (
          <div
            key={node.id}
            className="qr-print-item"
            style={{
              background: "white",
              padding: "15px",
              textAlign: "center",
              border: "1px solid #ddd",
            }}
          >
            <QRCodeSVG
              value={node.qrCode}
              size={250}
              level="H"
              marginSize={4}
            />

            <h3>{node.name}</h3>
            <p>{node.qrCode}</p>
            <p>Floor: {node.floor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QRCodePage;

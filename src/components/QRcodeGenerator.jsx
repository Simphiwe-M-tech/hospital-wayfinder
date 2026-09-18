import { QRCodeSVG } from "qrcode.react";

function QRCodeGenerator({ node }) {
  return (
    <div className="qr-code">
      <QRCodeSVG
        value={node.id}
        size={300}
      />

      <h3>{node.name}</h3>
      <p>{node.id}</p>
      <p>Floor: {node.floor}</p>
    </div>
  );
}

export default QRCodeGenerator;
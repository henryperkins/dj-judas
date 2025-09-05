import QRCode from 'react-qr-code';

type QrShareCardProps = {
  url: string;
  label?: string;
  size?: number;
};

export default function QrShareCard({ url, label = 'Scan to open', size = 180 }: QrShareCardProps) {
  return (
    <div className="qr-share-card">
      <div className="qr-wrap" aria-label={`QR code for ${url}`}>
        <QRCode value={url} size={size} level="M" fgColor="currentColor" bgColor="transparent" />
      </div>
      <div className="qr-meta">
        <p className="qr-label">{label}</p>
        <p className="qr-url" title={url}>{url}</p>
      </div>
    </div>
  );
}

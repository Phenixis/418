'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

export default function QrCodePage() {
    const searchParams = useSearchParams();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isQrPageHydrated, setIsQrPageHydrated] = useState(false);

    const codePin = useMemo(() => {
        return searchParams.get('codePin')?.trim() ?? '';
    }, [searchParams]);

    if (!codePin) {
        notFound();
    }

    useEffect(() => {
        setIsQrPageHydrated(true);
    }, []);

    const handleDownloadAs = (format: 'png' | 'jpeg') => {
        const canvas = canvasRef.current ?? document.querySelector<HTMLCanvasElement>('main canvas');
        if (!canvas) return;

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';
        const dataUrl = canvas.toDataURL(mimeType);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qr-code.${extension}`;
        link.click();
    };

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white p-4">
            <QRCodeCanvas ref={canvasRef} value={codePin} size={900} className="h-80vh] w-auto" />
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => handleDownloadAs('png')}
                    disabled={!isQrPageHydrated}
                    className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800"
                    aria-label="Télécharger le QR code en PNG"
                >
                    <Download size={18} />
                    Télécharger en PNG
                </button>
                <button
                    type="button"
                    onClick={() => handleDownloadAs('jpeg')}
                    disabled={!isQrPageHydrated}
                    className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800"
                    aria-label="Télécharger le QR code en JPG"
                >
                    <Download size={18} />
                    Télécharger en JPG
                </button>
            </div>
        </main>
    );
}

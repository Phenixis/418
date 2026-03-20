"use client";

import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

export default function QRCode({
    codePin,
    className
}: Readonly<{
    codePin: string;
    className?: string
}>) {
    const openImagePopup = () => {
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
            `/api/qr-code?codePin=${encodeURIComponent(codePin)}`,
            'ImagePopup',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes`
        );
    };


    return (
        <button
            type="button"
            className={cn("group/qr-code relative bg-white shadow-md transition-all duration-200 hover:shadow-xl cursor-pointer hover:p-3 hover:rounded-lg", className)}
            onClick={() => openImagePopup()}
            title="Ouvrir dans une nouvelle fenêtre"
            aria-label="Ouvrir le QR code dans une nouvelle fenêtre"
        >
            {/* Animation à améliorer */}
            <span className="pointer-events-none absolute left-4 top-4 size-6 rounded-tl-lg border-l-4 border-t-4 border-black opacity-0 transition-all duration-200 group-hover/qr-code:left-1 group-hover/qr-code:top-1 group-hover/qr-code:opacity-100" />
            <span className="pointer-events-none absolute right-4 top-4 size-6 rounded-tr-lg border-r-4 border-t-4 border-black opacity-0 transition-all duration-200 group-hover/qr-code:right-1 group-hover/qr-code:top-1 group-hover/qr-code:opacity-100" />
            <span className="pointer-events-none absolute bottom-4 left-4 size-6 rounded-bl-lg border-b-4 border-l-4 border-black opacity-0 transition-all duration-200 group-hover/qr-code:left-1 group-hover/qr-code:bottom-1 group-hover/qr-code:opacity-100" />
            <span className="pointer-events-none absolute bottom-4 right-4 size-6 rounded-br-lg border-b-4 border-r-4 border-black opacity-0 transition-all duration-200 group-hover/qr-code:right-1 group-hover/qr-code:bottom-1 group-hover/qr-code:opacity-100" />


            <QRCodeSVG value={codePin} size={100} />
        </button>
    );
}
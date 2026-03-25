"use client";

import { useMemo } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function QrCodePage() {
	const searchParams = useSearchParams();

	const codePin = useMemo(() => {
		return searchParams.get("codePin")?.trim() ?? "";
	}, [searchParams]);

	if (!codePin) {
        notFound();
	}

	return (
		<main className="flex min-h-screen w-full items-center justify-center bg-white p-4">
			<QRCodeSVG
				value={codePin}
				size={1200}
				className="h-[95vh]"
			/>
		</main>
	);
}

"use client";

import dynamic from 'next/dynamic';

const AdminHeaderClientOnly = dynamic(() => import('@/components/general/AdminHeader'), {
    ssr: false,
});

export default function AdminHeaderNoSSR() {
    return <AdminHeaderClientOnly />;
}

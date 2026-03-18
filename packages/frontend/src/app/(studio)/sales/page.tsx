"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to inquiries page by default
        router.replace('/sales/inquiries');
    }, [router]);

    return null;
}

'use client';

import { InstanceFilmEditorScreen } from '@/features/content/films/screens/InstanceFilmEditorScreen';

export default function InstanceFilmEditorPage({ params }: { params: { id: string } }) {
    return <InstanceFilmEditorScreen projectFilmId={parseInt(params.id, 10)} />;
}

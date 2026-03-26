'use client';

import { FilmDetailScreen } from '@/features/content/films/screens/FilmDetailScreen';

export default function FilmDetailPage({ params }: { params: { id: string } }) {
    return <FilmDetailScreen filmId={parseInt(params.id, 10)} />;
}

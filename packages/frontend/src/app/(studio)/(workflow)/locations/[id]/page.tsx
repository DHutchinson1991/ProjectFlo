import { LocationDetailScreen } from '@/features/workflow/locations/screens';

interface PageProps {
    params: { id: string };
}

export default function LocationDetailsPage({ params }: PageProps) {
    return <LocationDetailScreen locationId={Number(params.id)} />;
}

'use client';

import { useParams } from 'next/navigation';
import { DayBlueprintVersionEditor } from '@/features/content/day-blueprints/components/DayBlueprintVersionEditor';

export default function DayBlueprintVersionEditorPage() {
  const params = useParams<{ blueprintId: string; versionId: string }>();
  const blueprintId = Number(params.blueprintId);
  const versionId = Number(params.versionId);

  if (!Number.isFinite(blueprintId) || !Number.isFinite(versionId)) {
    return null;
  }

  return <DayBlueprintVersionEditor blueprintId={blueprintId} versionId={versionId} />;
}

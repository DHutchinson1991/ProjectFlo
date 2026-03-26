"use client";

import { useParams } from "next/navigation";
import { EquipmentDetailScreen } from "@/features/workflow/equipment";

export default function EquipmentDetailPage() {
    const params = useParams();
    const equipmentId = Number(params.id);

    return <EquipmentDetailScreen equipmentId={equipmentId} />;
}

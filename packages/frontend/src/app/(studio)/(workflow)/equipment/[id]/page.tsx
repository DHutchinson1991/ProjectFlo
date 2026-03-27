"use client";
import { useParams } from "next/navigation";
import { EquipmentDetailScreen } from "@/features/workflow/equipment/screens/EquipmentDetailScreen";

export default function EquipmentDetailsPage() {
    const params = useParams();
    const equipmentId = parseInt(params.id as string);
    return <EquipmentDetailScreen equipmentId={equipmentId} />;
}

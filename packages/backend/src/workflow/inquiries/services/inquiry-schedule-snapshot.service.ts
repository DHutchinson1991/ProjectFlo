import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface ScheduleUserDataStash {
    subjects: Array<{ roleName: string; realName: string | null; notes: string | null; count: number | null }>;
    locations: Array<{ locationNumber: number; name: string | null; address: string | null; locationId: number | null; notes: string | null }>;
    crew: Array<{ label: string | null; roleName: string | null; eventDayOrder: number; crewId: number | null }>;
}

interface SwapRestoreResult {
    subjects: { restored: number; unmatched: string[] };
    locations: { restored: number; unmatched: string[] };
    crew: { restored: number; unmatched: string[] };
}

@Injectable()
export class InquiryScheduleSnapshotService {
    async deleteInquiryScheduleSnapshot(inquiryId: number, tx: Prisma.TransactionClient) {
        await tx.projectCrewSlotActivity.deleteMany({ where: { project_crew_slot: { inquiry_id: inquiryId } } });
        await tx.projectDaySubjectActivity.deleteMany({ where: { project_day_subject: { inquiry_id: inquiryId } } });
        await tx.projectLocationActivityAssignment.deleteMany({ where: { project_location_slot: { inquiry_id: inquiryId } } });
        await tx.projectFilmSceneSchedule.deleteMany({ where: { project_film: { inquiry_id: inquiryId } } });
        await tx.projectCrewSlotEquipment.deleteMany({ where: { project_crew_slot: { inquiry_id: inquiryId } } });
        await tx.projectActivityMoment.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectCrewSlot.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectDaySubject.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectLocationSlot.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectFilm.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectActivity.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectEventDay.deleteMany({ where: { inquiry_id: inquiryId } });
    }

    async transferScheduleOwnership(inquiryId: number, projectId: number, tx: Prisma.TransactionClient) {
        const ownerUpdate = { project_id: projectId, inquiry_id: null };
        const where = { inquiry_id: inquiryId };
        await Promise.all([
            tx.projectEventDay.updateMany({ where, data: ownerUpdate }),
            tx.projectActivity.updateMany({ where, data: ownerUpdate }),
            tx.projectActivityMoment.updateMany({ where, data: ownerUpdate }),
            tx.projectDaySubject.updateMany({ where, data: ownerUpdate }),
            tx.projectLocationSlot.updateMany({ where, data: ownerUpdate }),
            tx.projectCrewSlot.updateMany({ where, data: ownerUpdate }),
            tx.projectFilm.updateMany({ where, data: ownerUpdate }),
        ]);
    }

    async stashUserData(inquiryId: number, tx: Prisma.TransactionClient): Promise<ScheduleUserDataStash> {
        const [subjects, locations, crew] = await Promise.all([
            tx.projectDaySubject.findMany({
                where: { inquiry_id: inquiryId, OR: [{ real_name: { not: null } }, { notes: { not: null } }] },
                select: { name: true, real_name: true, notes: true, count: true },
            }),
            tx.projectLocationSlot.findMany({
                where: { inquiry_id: inquiryId, OR: [{ name: { not: null } }, { address: { not: null } }, { notes: { not: null } }] },
                select: { location_number: true, name: true, address: true, location_id: true, notes: true },
            }),
            tx.projectCrewSlot.findMany({
                where: { inquiry_id: inquiryId, crew_id: { not: null } },
                select: { label: true, crew_id: true, job_role: { select: { name: true, display_name: true } }, project_event_day: { select: { order_index: true } } },
            }),
        ]);

        return {
            subjects: subjects.map((subject) => ({ roleName: subject.name, realName: subject.real_name, notes: subject.notes, count: subject.count })),
            locations: locations.map((location) => ({ locationNumber: location.location_number, name: location.name, address: location.address, locationId: location.location_id, notes: location.notes })),
            crew: crew.map((slot) => ({ label: slot.label, roleName: slot.job_role?.display_name ?? slot.job_role?.name ?? null, eventDayOrder: slot.project_event_day?.order_index ?? 0, crewId: slot.crew_id })),
        };
    }

    async restoreUserData(inquiryId: number, stash: ScheduleUserDataStash, tx: Prisma.TransactionClient): Promise<SwapRestoreResult> {
        const result: SwapRestoreResult = { subjects: { restored: 0, unmatched: [] }, locations: { restored: 0, unmatched: [] }, crew: { restored: 0, unmatched: [] } };
        await this.restoreSubjects(inquiryId, stash.subjects, result, tx);
        await this.restoreLocations(inquiryId, stash.locations, result, tx);
        await this.restoreCrew(inquiryId, stash.crew, result, tx);
        return result;
    }

    private async restoreSubjects(inquiryId: number, subjects: ScheduleUserDataStash['subjects'], result: SwapRestoreResult, tx: Prisma.TransactionClient) {
        for (const subject of subjects) {
            if (!subject.realName && !subject.notes) continue;
            const match = await tx.projectDaySubject.findFirst({ where: { inquiry_id: inquiryId, name: { equals: subject.roleName, mode: 'insensitive' } } });
            if (match) {
                await tx.projectDaySubject.update({ where: { id: match.id }, data: { ...(subject.realName && { real_name: subject.realName }), ...(subject.notes && { notes: subject.notes }) } });
                result.subjects.restored++;
            } else {
                result.subjects.unmatched.push(subject.roleName);
            }
        }
    }

    private async restoreLocations(inquiryId: number, locations: ScheduleUserDataStash['locations'], result: SwapRestoreResult, tx: Prisma.TransactionClient) {
        for (const location of locations) {
            if (!location.name && !location.address && !location.notes) continue;
            const match = await tx.projectLocationSlot.findFirst({ where: { inquiry_id: inquiryId, location_number: location.locationNumber } });
            if (match) {
                await tx.projectLocationSlot.update({ where: { id: match.id }, data: { ...(location.name && { name: location.name }), ...(location.address && { address: location.address }), ...(location.locationId && { location_id: location.locationId }), ...(location.notes && { notes: location.notes }) } });
                result.locations.restored++;
            } else {
                result.locations.unmatched.push(location.name || `Slot ${location.locationNumber}`);
            }
        }
    }

    private async restoreCrew(inquiryId: number, crew: ScheduleUserDataStash['crew'], result: SwapRestoreResult, tx: Prisma.TransactionClient) {
        for (const slot of crew) {
            if (!slot.crewId) continue;
            const match = await tx.projectCrewSlot.findFirst({ where: { inquiry_id: inquiryId, job_role: { OR: [{ name: { equals: slot.roleName ?? '', mode: 'insensitive' } }, { display_name: { equals: slot.roleName ?? '', mode: 'insensitive' } }] }, project_event_day: { order_index: slot.eventDayOrder } } });
            if (match) {
                await tx.projectCrewSlot.update({ where: { id: match.id }, data: { crew_id: slot.crewId } });
                result.crew.restored++;
            } else {
                result.crew.unmatched.push(slot.roleName ?? 'Unknown');
            }
        }
    }
}

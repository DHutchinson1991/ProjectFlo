import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

describe('InquiryScheduleSnapshotService', () => {
  let service: InquiryScheduleSnapshotService;
  let tx: {
    projectEventDay: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectActivity: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectActivityMoment: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectDaySubject: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectLocationSlot: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectSpaceSlot: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectCrewSlot: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectFilm: { updateMany: jest.Mock; deleteMany: jest.Mock };
    projectCrewSlotActivity: { deleteMany: jest.Mock };
    projectDaySubjectActivity: { deleteMany: jest.Mock };
    projectLocationActivityAssignment: { deleteMany: jest.Mock };
    projectFilmSceneSchedule: { deleteMany: jest.Mock };
    projectCrewSlotEquipment: { deleteMany: jest.Mock };
  };

  beforeEach(() => {
    service = new InquiryScheduleSnapshotService();
    tx = {
      projectEventDay: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectActivity: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectActivityMoment: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectDaySubject: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectLocationSlot: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectSpaceSlot: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectCrewSlot: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectFilm: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      projectCrewSlotActivity: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      projectDaySubjectActivity: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      projectLocationActivityAssignment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      projectFilmSceneSchedule: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      projectCrewSlotEquipment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
  });

  it('transfers project space slots when moving schedule ownership to a project', async () => {
    await service.transferScheduleOwnership(42, 99, tx as never);

    expect(tx.projectSpaceSlot.updateMany).toHaveBeenCalledWith({
      where: { inquiry_id: 42 },
      data: { project_id: 99, inquiry_id: null },
    });
  });

  it('deletes project space slots when wiping an inquiry schedule snapshot', async () => {
    await service.deleteInquiryScheduleSnapshot(42, tx as never);

    expect(tx.projectSpaceSlot.deleteMany).toHaveBeenCalledWith({
      where: { inquiry_id: 42 },
    });
  });
});

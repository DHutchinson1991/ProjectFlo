import { ProjectTaskReassignService } from './project-task-reassign.service';

describe('ProjectTaskReassignService', () => {
  let service: ProjectTaskReassignService;
  let tx: {
    projectCrewSlot: { findMany: jest.Mock };
    crewJobRole: { findMany: jest.Mock };
    inquiry_tasks: { findMany: jest.Mock; updateMany: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    service = new ProjectTaskReassignService({} as never);
    tx = {
      projectCrewSlot: { findMany: jest.fn() },
      crewJobRole: { findMany: jest.fn().mockResolvedValue([]) },
      inquiry_tasks: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
  });

  it('scopes inquiry crew slot lookup to the target inquiry', async () => {
    tx.projectCrewSlot.findMany.mockResolvedValue([]);

    await service.reassignInquiryTasksFromCrew(tx as never, 77);

    expect(tx.projectCrewSlot.findMany).toHaveBeenCalledWith({
      where: { inquiry_id: 77, crew_id: { not: null } },
      select: { crew_id: true, job_role_id: true },
    });
  });

  it('assigns inquiry tasks only from crew slots on the same inquiry', async () => {
    tx.projectCrewSlot.findMany.mockResolvedValue([
      { crew_id: 5, job_role_id: 10 },
    ]);
    tx.crewJobRole.findMany.mockResolvedValue([
      { crew_id: 5, job_role_id: 10, payment_bracket: { level: 1 } },
    ]);
    tx.inquiry_tasks.findMany.mockResolvedValue([
      { id: 1, job_role_id: 10 },
    ]);

    await service.reassignInquiryTasksFromCrew(tx as never, 77);

    expect(tx.inquiry_tasks.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { assigned_to_id: 5 },
    });
  });
});

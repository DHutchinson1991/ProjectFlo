import { Test, TestingModule } from '@nestjs/testing';
import { ShotType } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { MomentRecordingSetupService } from './moment-recording-setup.service';
import { CameraAimService } from '../../workflow/locations/modules/floor-plans/camera-aim.service';

const buildPrismaTx = () => ({
    momentRecordingSetup: {
        upsert: jest.fn().mockResolvedValue({ id: 41 }),
        findUnique: jest.fn(),
    },
    cameraSubjectAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
    },
});

const buildPrisma = (tx: ReturnType<typeof buildPrismaTx>) => ({
    $transaction: jest.fn((fn) => fn(tx)),
    sceneMoment: {
        findUnique: jest.fn().mockResolvedValue({ id: 7, name: 'First Look' }),
    },
    momentRecordingSetup: {
        findUnique: jest.fn(),
    },
    cameraSubjectAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
    },
});

describe('MomentRecordingSetupService', () => {
    let service: MomentRecordingSetupService;
    let prisma: ReturnType<typeof buildPrisma>;
    let tx: ReturnType<typeof buildPrismaTx>;
    let cameraAim: { aimCamerasForSceneMoment: jest.Mock };

    beforeEach(async () => {
        tx = buildPrismaTx();
        prisma = buildPrisma(tx);
        cameraAim = {
            aimCamerasForSceneMoment: jest.fn().mockResolvedValue({ updatedCameraPositionIds: [] }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MomentRecordingSetupService,
                { provide: PrismaService, useValue: prisma },
                { provide: CameraAimService, useValue: cameraAim },
            ],
        }).compile();

        service = module.get<MomentRecordingSetupService>(MomentRecordingSetupService);
        jest.clearAllMocks();
    });

    it('deduplicates overlapping audio tracks and returns audio assignments immediately', async () => {
        tx.momentRecordingSetup.findUnique.mockResolvedValue({
            id: 41,
            audio_track_ids: [12],
            graphics_enabled: false,
            graphics_title: null,
            camera_assignments: [
                {
                    id: 100,
                    track_id: 11,
                    subject_ids: [101],
                    shot_type: ShotType.CLOSE_UP,
                    enabled: true,
                    track: { name: 'A Cam', type: 'VIDEO' },
                },
                {
                    id: 101,
                    track_id: 12,
                    subject_ids: [201],
                    enabled: true,
                    track: { name: 'Bride Lav', type: 'AUDIO' },
                },
            ],
        });

        const result = await service.upsertRecordingSetup(7, {
            camera_assignments: [
                { track_id: 11, subject_ids: [101], shot_type: ShotType.CLOSE_UP, enabled: true },
                { track_id: 12, subject_ids: [201], enabled: true },
            ],
            audio_track_ids: [12],
        });

        const upsertedTrackIds = tx.cameraSubjectAssignment.upsert.mock.calls.map(
            ([call]) => call.where.recording_setup_id_track_id.track_id,
        );

        expect(upsertedTrackIds).toEqual([11, 12]);
        expect(tx.cameraSubjectAssignment.upsert).toHaveBeenCalledTimes(2);
        expect(result.camera_assignments).toEqual([
            expect.objectContaining({ track_id: 11, subject_ids: [101] }),
        ]);
        expect(result.audio_assignments).toEqual([
            expect.objectContaining({ track_id: 12, subject_ids: [201] }),
        ]);
        expect(result.audio_track_ids).toEqual([12]);
    });

    it('trims over-cap medium-shot subject_ids on save', async () => {
        tx.momentRecordingSetup.findUnique.mockResolvedValue({
            id: 41,
            audio_track_ids: [],
            graphics_enabled: false,
            graphics_title: null,
            camera_assignments: [],
        });

        await service.upsertRecordingSetup(7, {
            camera_assignments: [
                {
                    track_id: 11,
                    subject_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                    shot_type: ShotType.MEDIUM_SHOT,
                    enabled: true,
                },
            ],
        });

        const upsertCall = tx.cameraSubjectAssignment.upsert.mock.calls[0][0];
        expect(upsertCall.create.subject_ids).toHaveLength(3);
        expect(upsertCall.update.subject_ids).toHaveLength(3);
    });

    it('skips shot_type update when assignment is locked', async () => {
        tx.cameraSubjectAssignment.findMany.mockResolvedValue([
            { id: 1, track_id: 11, subject_ids: [101], shot_type: ShotType.WIDE_SHOT, shot_type_locked: true },
        ]);
        tx.momentRecordingSetup.findUnique.mockResolvedValue({
            id: 41,
            audio_track_ids: [],
            graphics_enabled: false,
            graphics_title: null,
            camera_assignments: [],
        });

        await service.upsertRecordingSetup(7, {
            camera_assignments: [
                { track_id: 11, subject_ids: [101], shot_type: ShotType.CLOSE_UP, enabled: true },
            ],
        });

        const upsertCall = tx.cameraSubjectAssignment.upsert.mock.calls[0][0];
        expect(upsertCall.update.shot_type).toBeUndefined();
        expect(upsertCall.update.subject_ids).toEqual([101]);
    });

    it('re-aims cameras when subject_ids change', async () => {
        prisma.cameraSubjectAssignment.findMany.mockResolvedValue([
            { track_id: 11, subject_ids: [101] },
        ]);
        tx.momentRecordingSetup.findUnique.mockResolvedValue({
            id: 41,
            audio_track_ids: [],
            graphics_enabled: false,
            graphics_title: null,
            camera_assignments: [],
        });

        await service.upsertRecordingSetup(7, {
            camera_assignments: [
                { track_id: 11, subject_ids: [101, 202], shot_type: ShotType.MEDIUM_SHOT, enabled: true },
            ],
        });

        expect(cameraAim.aimCamerasForSceneMoment).toHaveBeenCalledWith(7);
    });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ShotType } from '@prisma/client';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { MomentRecordingSetupService } from './moment-recording-setup.service';

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
});

describe('MomentRecordingSetupService', () => {
    let service: MomentRecordingSetupService;
    let prisma: ReturnType<typeof buildPrisma>;
    let tx: ReturnType<typeof buildPrismaTx>;

    beforeEach(async () => {
        tx = buildPrismaTx();
        prisma = buildPrisma(tx);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MomentRecordingSetupService,
                { provide: PrismaService, useValue: prisma },
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
});
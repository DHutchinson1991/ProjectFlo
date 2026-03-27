import { Test, TestingModule } from "@nestjs/testing";
import { ScenesService } from "./scenes.service";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { MediaType } from "@prisma/client";
import { BadRequestException } from "@nestjs/common";
import { CreateSceneDto } from "./dto/create-scene.dto";

const mockPrisma = {
    scenesLibrary: {
        create: jest.fn(),
    },
};

describe("ScenesService", () => {
    let service: ScenesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScenesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get<ScenesService>(ScenesService);
        jest.clearAllMocks();
    });

    it("should create a scene with valid data", async () => {
        const dto: CreateSceneDto = {
            name: "UnitTest Scene",
        };
        const created = { id: 1, ...dto };
        mockPrisma.scenesLibrary.create.mockResolvedValue(created);
        const result = await service.create(dto);
        expect(result).toEqual(created);
        expect(mockPrisma.scenesLibrary.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ name: dto.name }),
        });
    });

    it("should throw BadRequestException if name is missing", async () => {
        const invalidDto = { type: MediaType.VIDEO } as unknown as CreateSceneDto;
        await expect(service.create(invalidDto)).rejects.toThrow(
            BadRequestException,
        );
    });

    it("should throw BadRequestException if type is invalid", async () => {
        const invalidDto = {
            name: "Test",
            type: "INVALID" as MediaType,
        } as CreateSceneDto;
        await expect(service.create(invalidDto)).rejects.toThrow(
            BadRequestException,
        );
    });
});

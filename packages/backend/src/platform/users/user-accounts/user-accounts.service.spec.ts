import { Test, TestingModule } from "@nestjs/testing";
import { UserAccountsService } from "./user-accounts.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("UserAccountsService", () => {
  let service: UserAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserAccountsService>(UserAccountsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});

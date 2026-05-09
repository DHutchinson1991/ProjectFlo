import { Injectable, Logger } from '@nestjs/common';
import { CreatePackageFromEventTypeDto } from './dto/create-package-from-event-type.dto';
import { CreatePackageFromBuilderDto } from '../dto/create-package-from-builder.dto';
import { PackageCreationRunInit, PackageCreationRunLogger } from './run/package-creation-run-logger';
import { CatalogPackageCreator } from './sources/catalog-package-creator.service';
import { InquiryPackageCreator } from './sources/inquiry-package-creator.service';

/**
 * Home of package creation. Controllers inject this service only; it owns
 * the run logger lifecycle, error handling, and dispatches to the right
 * creation strategy based on conceptual level:
 *   - catalog-level creation (admin builds a reusable package from a template)
 *   - inquiry-level creation (client-scoped draft from the Needs Assessment wizard)
 */
@Injectable()
export class PackageCreationService {
  private readonly logger = new Logger(PackageCreationService.name);

  constructor(
    private readonly catalogCreator: CatalogPackageCreator,
    private readonly inquiryCreator: InquiryPackageCreator,
  ) {}

  /**
   * Catalog-level creation. Used by `POST /api/packages/from-template/:packageTemplateId`.
   * Admin-driven; produces a reusable catalog package.
   */
  async createForCatalog(
    brandId: number,
    packageTemplateId: number,
    dto: CreatePackageFromEventTypeDto,
  ) {
    return this.executeCreate(
      {
        brandId,
        source: 'catalog',
        route: 'POST /api/packages/from-template/:packageTemplateId',
        eventTypeId: packageTemplateId,
        packageName: dto.packageName,
      },
      dto,
      `[catalog] package creation failed brand=${brandId} packageTemplate=${packageTemplateId}`,
      (runLogger) => this.catalogCreator.create(brandId, packageTemplateId, dto, runLogger),
    );
  }

  /**
   * Inquiry-level creation. Used by `POST /api/packages/from-builder`.
   * Client-scoped; produces a draft package tied to a Needs Assessment.
   */
  async createForInquiry(
    brandId: number,
    dto: CreatePackageFromBuilderDto,
  ) {
    const pkgName = dto.clientName ? `Custom Package \u2014 ${dto.clientName}` : 'Custom Package';
    return this.executeCreate(
      {
        brandId,
        source: 'inquiry',
        route: 'POST /api/packages/from-builder',
        eventTypeId: dto.packageTemplateId,
        packageName: pkgName,
      },
      dto,
      `[inquiry] package creation failed brand=${brandId}`,
      (runLogger) => this.inquiryCreator.create(brandId, dto, runLogger),
    );
  }

  private async executeCreate<TRequest, TResult>(
    init: PackageCreationRunInit,
    request: TRequest,
    errorPrefix: string,
    buildPackage: (runLogger: PackageCreationRunLogger) => Promise<TResult>,
  ): Promise<TResult> {
    const runLogger = new PackageCreationRunLogger(init);
    runLogger.writeRequest(request);

    try {
      const result = await buildPackage(runLogger);
      runLogger.complete();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`${errorPrefix}: ${message}`, stack);
      runLogger.fail('Package creation failed', { error: message, stack });
      throw err;
    }
  }
}

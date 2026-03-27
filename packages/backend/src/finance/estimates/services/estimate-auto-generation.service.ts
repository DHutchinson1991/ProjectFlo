import { Injectable } from '@nestjs/common';
import { ProjectPackageSnapshotService } from '../../../workflow/projects/project-package-snapshot.service';
import { TaskLibraryService } from '../../../workflow/task-library/task-library.service';
import { AutoEstimateItem, roundMoney } from '../types/estimate-cost.types';
import {
  categorizeOperators,
  buildCrewItemsFromTasks,
  buildCrewItemsFallback,
  buildEquipmentItems,
} from '../mappers/estimate-auto-generation.mapper';

@Injectable()
export class EstimateAutoGenerationService {
  constructor(
    private snapshotService: ProjectPackageSnapshotService,
    private taskLibraryService: TaskLibraryService,
  ) {}

  async buildAutoEstimateItems(
    inquiryId: number,
    packageId: number,
    brandId: number,
  ): Promise<AutoEstimateItem[]> {
    const [scheduleFilms, operators, taskPreview] = await Promise.all([
      this.snapshotService.getFilms({ inquiryId }).catch(() => [] as Record<string, unknown>[]),
      this.snapshotService.getOperators({ inquiryId }).catch(() => [] as Record<string, unknown>[]),
      this.taskLibraryService.previewAutoGenerationForSystem(packageId, brandId, inquiryId).catch(() => null),
    ]);

    const filmNames = scheduleFilms.map(
      (pf: Record<string, unknown>) =>
        (pf.film as Record<string, unknown>)?.name || `Film #${pf.film_id}`,
    ) as string[];
    const items: AutoEstimateItem[] = [];

    if (taskPreview?.tasks) {
      items.push(...buildCrewItemsFromTasks(taskPreview, operators, filmNames));
    } else {
      const { planningCrew, coverageCrew, postProdCrew } = categorizeOperators(operators);
      items.push(...buildCrewItemsFallback(planningCrew, coverageCrew, postProdCrew));
    }

    items.push(...buildEquipmentItems(operators));

    return items
      .filter((item) => item.description.trim().length > 0)
      .map((item) => ({
        ...item,
        quantity: roundMoney(item.quantity),
        unit_price: roundMoney(item.unit_price),
      }));
  }
}


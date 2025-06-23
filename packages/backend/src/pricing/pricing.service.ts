import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PricingModifierType } from "@prisma/client";

interface ComponentPricingResult {
  component_id: number;
  component_name: string;
  total_hours: number;
  base_price: number;
  final_price: number;
  applied_modifiers: {
    name: string;
    multiplier: number;
    type: PricingModifierType;
  }[];
}

interface PricingCalculationParams {
  component_ids: number[];
  wedding_date?: Date;
  delivery_deadline?: Date;
  component_count?: number;
}

interface PricingModifierConditions {
  months?: number[];
  days?: number[];
  locations?: string[];
  min_components?: number;
  days_notice?: { lt?: number; gte?: number };
  day_of_week?: number[];
  component_count?: { gte?: number; lte?: number };
  [key: string]: unknown;
}

@Injectable()
export class PricingService {
  private readonly DEFAULT_HOURLY_RATE = 75.0; // $75/hour base rate

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate comprehensive pricing for multiple components with admin modifiers
   */
  async calculateComponentPricing(
    params: PricingCalculationParams,
  ): Promise<Record<number, ComponentPricingResult>> {
    const { component_ids, wedding_date, delivery_deadline, component_count } =
      params;

    // Get components - task hours now come from base_task_hours field
    const components = await this.prisma.componentLibrary.findMany({
      where: { id: { in: component_ids } },
    });

    // Calculate base pricing from component base task hours
    const basePricing: Record<number, ComponentPricingResult> = {};

    for (const component of components) {
      const totalHours = Number(component.base_task_hours) || 0;

      const basePrice = totalHours * this.DEFAULT_HOURLY_RATE;

      basePricing[component.id] = {
        component_id: component.id,
        component_name: component.name,
        total_hours: totalHours,
        base_price: basePrice,
        final_price: basePrice, // Will be updated with modifiers
        applied_modifiers: [],
      };
    }

    // Get and apply admin-configured modifiers
    const applicableModifiers = await this.getApplicableModifiers(
      wedding_date,
      delivery_deadline,
      component_count || component_ids.length,
    );

    // Apply modifiers to each component
    for (const componentId of component_ids) {
      if (basePricing[componentId]) {
        let finalPrice = basePricing[componentId].base_price;
        const appliedModifiers: {
          name: string;
          multiplier: number;
          type: PricingModifierType;
        }[] = [];

        for (const modifier of applicableModifiers) {
          finalPrice *= Number(modifier.multiplier);
          appliedModifiers.push({
            name: modifier.name,
            multiplier: Number(modifier.multiplier),
            type: modifier.type,
          });
        }

        basePricing[componentId].final_price =
          Math.round(finalPrice * 100) / 100; // Round to 2 decimals
        basePricing[componentId].applied_modifiers = appliedModifiers;
      }
    }

    return basePricing;
  }

  /**
   * Get pricing modifiers that apply to the current conditions
   */
  private async getApplicableModifiers(
    weddingDate?: Date,
    deliveryDeadline?: Date,
    componentCount?: number,
  ) {
    const allModifiers = await this.prisma.pricingModifier.findMany({
      where: { is_active: true },
    });

    return allModifiers.filter((modifier) => {
      const conditions = modifier.conditions as PricingModifierConditions;

      switch (modifier.type) {
        case "PEAK_SEASON":
          if (!weddingDate) return false;
          const month = weddingDate.getMonth() + 1; // getMonth() is 0-indexed
          return conditions.months?.includes(month);

        case "RUSH_JOB":
          if (!weddingDate || !deliveryDeadline) return false;
          const daysNotice = Math.ceil(
            (weddingDate.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return daysNotice < (conditions.days_notice?.lt || Infinity);

        case "DAY_OF_WEEK":
          if (!weddingDate) return false;
          const dayOfWeek = weddingDate.getDay();
          return conditions.day_of_week?.includes(dayOfWeek);

        case "VOLUME_DISCOUNT":
          if (!componentCount) return false;
          return (
            componentCount >= (conditions.component_count?.gte || Infinity)
          );

        case "LOCATION":
          // TODO: Implement location-based pricing when location data is available
          return false;

        default:
          return false;
      }
    });
  }

  /**
   * CRUD operations for pricing modifiers (Admin functionality)
   */

  async getAllModifiers() {
    return this.prisma.pricingModifier.findMany({
      orderBy: [{ is_active: "desc" }, { type: "asc" }, { created_at: "desc" }],
    });
  }

  async getActiveModifiers() {
    return this.prisma.pricingModifier.findMany({
      where: { is_active: true },
      orderBy: { type: "asc" },
    });
  }

  async createModifier(data: {
    name: string;
    type: PricingModifierType;
    multiplier: number;
    conditions?: unknown;
    is_active?: boolean;
  }) {
    return this.prisma.pricingModifier.create({
      data: {
        name: data.name,
        type: data.type,
        multiplier: data.multiplier,
        conditions: data.conditions || {},
        is_active: data.is_active ?? true,
      },
    });
  }

  async updateModifier(
    id: number,
    data: {
      name?: string;
      multiplier?: number;
      conditions?: unknown;
      is_active?: boolean;
    },
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.multiplier !== undefined) updateData.multiplier = data.multiplier;
    if (data.conditions !== undefined) updateData.conditions = data.conditions;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return this.prisma.pricingModifier.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteModifier(id: number) {
    return this.prisma.pricingModifier.delete({
      where: { id },
    });
  }

  async toggleModifierStatus(id: number) {
    const modifier = await this.prisma.pricingModifier.findUnique({
      where: { id },
    });

    if (!modifier) {
      throw new Error("Pricing modifier not found");
    }

    return this.prisma.pricingModifier.update({
      where: { id },
      data: { is_active: !modifier.is_active },
    });
  }

  /**
   * Preview pricing calculation without saving
   */
  async previewPricing(params: PricingCalculationParams) {
    const pricing = await this.calculateComponentPricing(params);

    const summary = {
      total_components: Object.keys(pricing).length,
      total_base_price: Object.values(pricing).reduce(
        (sum, p) => sum + p.base_price,
        0,
      ),
      total_final_price: Object.values(pricing).reduce(
        (sum, p) => sum + p.final_price,
        0,
      ),
      total_hours: Object.values(pricing).reduce(
        (sum, p) => sum + p.total_hours,
        0,
      ),
      modifiers_applied: this.getUniqueModifiers(pricing),
      component_breakdown: pricing,
    };

    return summary;
  }

  private getUniqueModifiers(pricing: Record<number, ComponentPricingResult>) {
    const modifierMap = new Map();

    Object.values(pricing).forEach((component) => {
      component.applied_modifiers.forEach((modifier) => {
        modifierMap.set(modifier.name, modifier);
      });
    });

    return Array.from(modifierMap.values());
  }
}

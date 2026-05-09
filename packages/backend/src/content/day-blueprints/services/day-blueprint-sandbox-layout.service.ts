import { Injectable } from '@nestjs/common';
import { FloorPlanObjectType, Prisma, SpaceType } from '@prisma/client';

type SandboxSpaceKind = 'ceremony' | 'reception' | 'prep' | 'portraits' | 'cocktail' | 'generic';

export interface DayBlueprintSandboxLayout {
  description: string;
  typeTags: SpaceType[];
  objects: Prisma.SpaceSlotObjectCreateManySpace_slotInput[];
  zones: Prisma.SpaceSlotZoneCreateManySpace_slotInput[];
}

@Injectable()
export class DayBlueprintSandboxLayoutService {
  build(params: { label: string; activityName?: string | null; description?: string | null }): DayBlueprintSandboxLayout {
    const kind = this.resolveKind(params);
    const label = this.normalizeLabel(params.label) ?? this.normalizeLabel(params.activityName) ?? 'Sandbox Space';
    const make = this.objectFactory();
    const base = this.roomShell(make, label);
    const layout = this.objectsForKind(kind, make, base, label);

    return {
      description: params.description ?? this.descriptionForKind(kind, label),
      typeTags: this.typeTagsForKind(kind),
      objects: layout,
      zones: this.zonesForKind(kind, label),
    };
  }

  private resolveKind(params: { label: string; activityName?: string | null; description?: string | null }): SandboxSpaceKind {
    const text = [params.label, params.activityName, params.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (/portrait|photoshoot|first look|family group|bridal party/.test(text)) return 'portraits';
    if (/prep|preparation|makeup|hair|dressing|getting ready/.test(text)) return 'prep';
    if (/reception|dinner|toast|dance|first dance|head table|banquet/.test(text)) return 'reception';
    if (/ceremony|vow|altar|aisle|church|chapel|catholic|processional|ring ceremony/.test(text)) return 'ceremony';
    if (/cocktail|line|queue|hour|welcome/.test(text)) return 'cocktail';
    return 'generic';
  }

  private objectsForKind(
    kind: SandboxSpaceKind,
    make: ReturnType<DayBlueprintSandboxLayoutService['objectFactory']>,
    base: Prisma.SpaceSlotObjectCreateManySpace_slotInput[],
    label: string,
  ) {
    switch (kind) {
      case 'ceremony':
        return [
          ...base,
          make('STAGE', 'Ceremony platform', 340, 88, 320, 128),
          make('ARCH', 'Ceremony arch', 410, 112, 180, 42),
          make('ALTAR', 'Altar', 425, 180, 150, 48),
          make('AISLE', 'Aisle', 470, 275, 60, 560),
          ...this.chairRows(make, 155, 345, 260, 7),
          ...this.chairRows(make, 585, 345, 260, 7),
          make('DOOR', 'Entrance', 455, 925, 90, 24),
          make('LABEL', 'Guest seating', 430, 665, 0, 0),
        ];
      case 'reception':
        return [
          ...base,
          make('TABLE_HEAD', 'Head table', 260, 100, 480, 58),
          make('DANCE_FLOOR', 'Dance floor', 350, 390, 300, 230),
          make('DJ_BOOTH', 'DJ booth', 710, 420, 110, 54),
          make('BAR', 'Bar', 120, 820, 220, 48),
          ...this.roundTables(make, [[205, 290], [500, 270], [795, 290], [235, 660], [765, 660], [500, 780]]),
          make('LABEL', 'Reception seating', 425, 710, 0, 0),
        ];
      case 'prep':
        return [
          ...base,
          make('WINDOW', 'Window light', 165, 64, 210, 16),
          make('TABLE_RECT', 'Vanity', 170, 170, 180, 56),
          make('FURNITURE', 'Sofa', 610, 210, 210, 74),
          make('TABLE_RECT', 'Details table', 390, 420, 170, 90),
          make('FURNITURE', 'Wardrobe', 760, 675, 86, 200),
          make('DECORATIVE', 'Mirror', 216, 236, 80, 16),
        ];
      case 'portraits':
        return [
          ...base,
          make('STAGE', 'Portrait backdrop', 305, 115, 390, 56),
          make('FURNITURE', 'Bench', 380, 500, 240, 45),
          make('DECORATIVE', 'Key light zone', 190, 285, 90, 90),
          make('DECORATIVE', 'Fill light zone', 720, 285, 90, 90),
          make('AISLE', 'Standing mark', 470, 270, 60, 250),
        ];
      case 'cocktail':
        return [
          ...base,
          make('BAR', 'Bar', 110, 140, 260, 52),
          make('STAGE', 'Receiving line', 570, 120, 250, 60),
          ...this.roundTables(make, [[210, 370], [500, 380], [780, 370], [330, 650], [670, 650]], 70),
          make('AISLE', 'Guest flow', 460, 230, 80, 600),
        ];
      default:
        return [
          ...base,
          make('TABLE_RECT', 'Working area', 360, 210, 280, 90),
          make('FURNITURE', 'Seating', 180, 560, 220, 62),
          make('FURNITURE', 'Seating', 600, 560, 220, 62),
          make('AISLE', 'Movement lane', 470, 355, 60, 380),
          make('LABEL', label, 455, 500, 0, 0),
        ];
    }
  }

  private roomShell(make: ReturnType<DayBlueprintSandboxLayoutService['objectFactory']>, label: string) {
    return [
      make('LABEL', label, 460, 42, 0, 0),
      make('WALL', 'North wall', 60, 60, 880, 12),
      make('WALL', 'South wall', 60, 928, 880, 12),
      make('WALL', 'West wall', 60, 60, 12, 880),
      make('WALL', 'East wall', 928, 60, 12, 880),
      make('DOOR', 'Entry', 456, 928, 88, 16),
      make('WINDOW', 'Window', 700, 60, 160, 14),
    ];
  }

  private objectFactory() {
    let orderIndex = 0;
    return (
      objectType: keyof typeof FloorPlanObjectType,
      label: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation = 0,
    ): Prisma.SpaceSlotObjectCreateManySpace_slotInput => {
      orderIndex += 1;
      return { object_type: FloorPlanObjectType[objectType], label, x, y, width, height, rotation, order_index: orderIndex };
    };
  }

  private chairRows(make: ReturnType<DayBlueprintSandboxLayoutService['objectFactory']>, x: number, startY: number, width: number, rows: number) {
    return Array.from({ length: rows }, (_, index) => make('CHAIR_ROW', `Guest row ${index + 1}`, x, startY + index * 62, width, 26));
  }

  private roundTables(make: ReturnType<DayBlueprintSandboxLayoutService['objectFactory']>, centers: Array<[number, number]>, size = 84) {
    return centers.map(([x, y], index) => make('TABLE_ROUND', `Table ${index + 1}`, x - size / 2, y - size / 2, size, size));
  }

  private zonesForKind(kind: SandboxSpaceKind, label: string): Prisma.SpaceSlotZoneCreateManySpace_slotInput[] {
    return [{
      name: this.stableKey(label),
      label,
      polygon: [{ x: 60, y: 60 }, { x: 940, y: 60 }, { x: 940, y: 940 }, { x: 60, y: 940 }],
      color: kind === 'ceremony' ? 'rgba(96,165,250,0.10)' : 'rgba(167,139,250,0.09)',
      description: this.descriptionForKind(kind, label),
      order_index: 0,
    }];
  }

  private typeTagsForKind(kind: SandboxSpaceKind): SpaceType[] {
    if (kind === 'ceremony') return [SpaceType.CEREMONY_AREA];
    if (kind === 'reception') return [SpaceType.RECEPTION_HALL];
    if (kind === 'prep') return [SpaceType.BRIDAL_SUITE];
    if (kind === 'portraits') return [SpaceType.OTHER];
    if (kind === 'cocktail') return [SpaceType.COCKTAIL_AREA];
    return [];
  }

  private descriptionForKind(kind: SandboxSpaceKind, label: string) {
    if (kind === 'ceremony') return `${label}: ceremony sandbox with altar, aisle, arch, and guest seating rows.`;
    if (kind === 'reception') return `${label}: reception sandbox with head table, guest tables, dance floor, DJ booth, and bar.`;
    if (kind === 'prep') return `${label}: preparation room sandbox with vanity, sofa, detail table, wardrobe, and window light.`;
    if (kind === 'portraits') return `${label}: portrait sandbox with backdrop, standing mark, bench, and light zones.`;
    if (kind === 'cocktail') return `${label}: cocktail sandbox with bar, guest flow lane, high tables, and receiving line.`;
    return `${label}: generic sandbox room with walls, entry, seating, and a movement lane.`;
  }

  private normalizeLabel(value: string | null | undefined) {
    const trimmed = (value ?? '').trim().replace(/\s+/g, ' ');
    return trimmed.length > 0 ? trimmed : null;
  }

  private stableKey(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sandbox';
  }
}
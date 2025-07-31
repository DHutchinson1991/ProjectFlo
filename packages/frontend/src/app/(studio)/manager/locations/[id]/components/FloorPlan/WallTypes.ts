// Floor Plan Types

export interface Wall {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    material?: string;
}

export interface Room {
    id: string;
    name?: string;
    walls: Wall[];
    area?: number;
    color?: string;
}

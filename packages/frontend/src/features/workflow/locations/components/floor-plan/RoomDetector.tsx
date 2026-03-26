import { Wall, Room } from '../../types/floor-plan/WallTypes';

export class RoomDetector {
    private walls: Wall[];

    constructor(walls: Wall[]) {
        this.walls = walls;
    }

    detectRooms(): Room[] {
        // Placeholder implementation - return empty array for now
        // TODO: Implement room detection algorithm
        return [];
    }
}
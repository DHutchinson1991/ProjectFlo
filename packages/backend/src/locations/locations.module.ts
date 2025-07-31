import { Module } from '@nestjs/common';
import { VenuesModule } from './modules/venues/venues.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { FloorPlansModule } from './modules/floor-plans/floor-plans.module';
import { PlanObjectsModule } from './modules/plan-objects/plan-objects.module';

/**
 * Main Locations module that aggregates all location-related functionality
 * Includes venues, spaces, floor plans, and plan objects
 */
@Module({
    imports: [
        VenuesModule,
        SpacesModule,
        FloorPlansModule,
        PlanObjectsModule,
    ],
})
export class LocationsModule { }

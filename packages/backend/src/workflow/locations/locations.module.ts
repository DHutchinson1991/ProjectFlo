import { Module } from '@nestjs/common';
import { VenuesModule } from './modules/venues/venues.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { FloorPlansModule } from './modules/floor-plans/floor-plans.module';
import { PlanObjectsModule } from './modules/plan-objects/plan-objects.module';
import { GeocodingService } from './geocoding.service';

/**
 * Main Locations module that aggregates all location-related functionality
 * Includes venues, spaces, floor plans, plan objects, and geocoding
 */
@Module({
    imports: [
        VenuesModule,
        SpacesModule,
        FloorPlansModule,
        PlanObjectsModule,
    ],
    providers: [GeocodingService],
    exports: [GeocodingService],
})
export class LocationsModule { }

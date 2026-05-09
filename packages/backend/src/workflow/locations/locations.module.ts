import { Module } from '@nestjs/common';
import { VenuesModule } from './modules/venues/venues.module';
import { FloorPlansModule } from './modules/floor-plans/floor-plans.module';
import { GeocodingService } from './geocoding.service';

/**
 * Main Locations module that aggregates all location-related functionality
 * Includes venues, floor plans, and geocoding
 */
@Module({
    imports: [
        VenuesModule,
        FloorPlansModule,
    ],
    providers: [GeocodingService],
    exports: [GeocodingService, FloorPlansModule],
})
export class LocationsModule { }

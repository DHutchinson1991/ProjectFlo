import { Module } from '@nestjs/common';
import { VenuesModule } from './modules/venues/venues.module';
import { GeocodingService } from './geocoding.service';

/**
 * Main Locations module that aggregates all location-related functionality
 * Includes venues and geocoding
 */
@Module({
    imports: [
        VenuesModule,
    ],
    providers: [GeocodingService],
    exports: [GeocodingService],
})
export class LocationsModule { }

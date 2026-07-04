import {
    computePublicScreens,
    computeScreens,
    formatNiceDate,
    formatShortAddress,
} from './wizard-navigation';
import type { EventTypeConfig, NominatimResult } from '../types';

const baseConfig: EventTypeConfig = {
    dateLabel: 'When is it?',
    guestsLabel: 'How many guests?',
    showGuests: true,
    guestsOptions: [],
    showPartner: true,
    partnerLabel: 'Partner',
    venueLabel: 'Where is it being held?',
    activities: [],
};

const corporateConfig: EventTypeConfig = {
    ...baseConfig,
    showPartner: false,
    showGuests: false,
};

describe('formatShortAddress', () => {
    it('builds a concise address from nominatim parts', () => {
        const result: NominatimResult = {
            place_id: 1,
            lat: '51.38',
            lon: '-2.36',
            display_name: 'Fallback',
            address: {
                house_number: '10',
                road: 'High Street',
                city: 'Bath',
                state: 'Somerset',
                postcode: 'BA1 1AA',
            },
        };

        expect(formatShortAddress(result)).toBe('10 High Street, Bath, Somerset, BA1 1AA');
    });

    it('falls back to display_name when address parts are missing', () => {
        expect(formatShortAddress({ place_id: 2, lat: '0', lon: '0', display_name: 'Venue Hall, UK' })).toBe(
            'Venue Hall, UK',
        );
    });
});

describe('formatNiceDate', () => {
    it('formats ISO dates for display', () => {
        expect(formatNiceDate('2026-03-27')).toBe('Friday, 27 March 2026');
    });

    it('returns null for empty input', () => {
        expect(formatNiceDate(null)).toBeNull();
    });
});

describe('computeScreens', () => {
    it('stops before partner flow until event type is chosen', () => {
        expect(computeScreens({}, baseConfig)).toEqual(['welcome', 'event_type']);
    });

    it('includes partner and package pick flow for wedding bride role', () => {
        const screens = computeScreens(
            {
                event_type: 'wedding',
                contact_role: 'bride',
                package_path: 'pick',
                discovery_call_interest: 'no',
            },
            baseConfig,
        );

        expect(screens).toEqual([
            'welcome',
            'event_type',
            'date',
            'your_name',
            'your_role',
            'partner_role',
            'partner',
            'venue',
            'guests',
            'fork',
            'budget',
            'packages',
            'payment_terms',
            'special',
            'source',
            'call_offer',
            'contact',
            'summary',
        ]);
    });

    it('routes birthday events through birthday_contact', () => {
        const screens = computeScreens(
            { event_type: 'birthday', package_path: 'build', discovery_call_interest: 'yes' },
            baseConfig,
        );

        expect(screens).toContain('birthday_contact');
        expect(screens).toContain('builder');
        expect(screens).toContain('call_details');
    });
});

describe('computePublicScreens', () => {
    it('captures contact before package selection', () => {
        const screens = computePublicScreens(
            { event_type: 'wedding', package_path: 'pick', discovery_call_interest: 'no' },
            baseConfig,
        );

        const forkIndex = screens.indexOf('fork');
        const contactIndex = screens.indexOf('contact');
        const packagesIndex = screens.indexOf('packages');

        expect(contactIndex).toBeGreaterThan(-1);
        expect(forkIndex).toBeGreaterThan(contactIndex);
        expect(packagesIndex).toBeGreaterThan(contactIndex);
        expect(screens[0]).toBe('event_type');
        expect(screens).not.toContain('welcome');
    });

    it('omits partner screens for corporate events', () => {
        const screens = computePublicScreens(
            { event_type: 'corporate', package_path: 'pick', discovery_call_interest: 'no' },
            corporateConfig,
        );

        expect(screens).not.toContain('your_name');
        expect(screens).not.toContain('partner');
        expect(screens).not.toContain('guests');
    });
});

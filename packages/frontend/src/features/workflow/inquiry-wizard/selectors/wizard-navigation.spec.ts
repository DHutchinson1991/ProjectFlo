import { computeScreens, computePublicScreens, formatShortAddress, formatNiceDate } from './wizard-navigation';
import type { EventTypeConfig, NominatimResult } from '../types';

const baseConfig = {
    dateLabel: 'Event date',
    guestsLabel: 'Guest count',
    guestsOptions: [],
    partnerLabel: 'Partner',
    venueLabel: 'Venue',
    activities: [],
};

const weddingConfig: EventTypeConfig = {
    ...baseConfig,
    showPartner: true,
    showGuests: true,
};

const corporateConfig: EventTypeConfig = {
    ...baseConfig,
    showPartner: false,
    showGuests: false,
};

describe('wizard-navigation', () => {
    describe('formatShortAddress', () => {
        it('builds a concise address from structured fields', () => {
            const result: NominatimResult = {
                place_id: 1,
                display_name: 'Full long address',
                lat: '51.38',
                lon: '-2.36',
                address: {
                    house_number: '10',
                    road: 'High Street',
                    city: 'Bath',
                    postcode: 'BA1 1AA',
                },
            };

            expect(formatShortAddress(result)).toBe('10 High Street, Bath, BA1 1AA');
        });

        it('falls back to display_name when address parts are missing', () => {
            expect(
                formatShortAddress({ place_id: 2, display_name: 'Somewhere', lat: '0', lon: '0', address: undefined }),
            ).toBe('Somewhere');
        });
    });

    describe('formatNiceDate', () => {
        it('formats ISO date strings for display', () => {
            expect(formatNiceDate('2026-03-27')).toMatch(/Friday, 27 March 2026/);
        });

        it('returns null for empty input', () => {
            expect(formatNiceDate(null)).toBeNull();
            expect(formatNiceDate(undefined)).toBeNull();
        });
    });

    describe('computeScreens', () => {
        it('stops after event_type when type not chosen', () => {
            expect(computeScreens({}, weddingConfig)).toEqual(['welcome', 'event_type']);
        });

        it('includes partner flow for bride/groom roles', () => {
            const screens = computeScreens(
                { event_type: 'wedding', contact_role: 'bride' },
                weddingConfig,
            );

            expect(screens).toContain('partner_role');
            expect(screens).toContain('partner');
            expect(screens).not.toContain('bride_groom_names');
        });

        it('uses bride_groom_names when contact role is other', () => {
            const screens = computeScreens(
                { event_type: 'wedding', contact_role: 'other' },
                weddingConfig,
            );

            expect(screens).toContain('bride_groom_names');
            expect(screens).not.toContain('partner');
        });

        it('adds pick-package path screens', () => {
            const screens = computeScreens(
                {
                    event_type: 'wedding',
                    contact_role: 'groom',
                    package_path: 'pick',
                    discovery_call_interest: 'yes',
                },
                weddingConfig,
            );

            expect(screens).toContain('budget');
            expect(screens).toContain('packages');
            expect(screens).toContain('call_details');
            expect(screens).not.toContain('builder');
        });

        it('omits trailing screens until package_path is set', () => {
            const screens = computeScreens({ event_type: 'wedding' }, weddingConfig);

            expect(screens).toContain('fork');
            expect(screens).not.toContain('payment_terms');
            expect(screens).not.toContain('summary');
        });
    });

    describe('computePublicScreens', () => {
        it('captures contact before package fork (lead capture)', () => {
            const screens = computePublicScreens({ event_type: 'wedding' }, weddingConfig);
            const forkIdx = screens.indexOf('fork');
            const contactIdx = screens.indexOf('contact');

            expect(contactIdx).toBeGreaterThan(-1);
            expect(forkIdx).toBeGreaterThan(-1);
            expect(contactIdx).toBeLessThan(forkIdx);
        });

        it('does not include welcome or standalone contact at end', () => {
            const screens = computePublicScreens(
                { event_type: 'wedding', package_path: 'build' },
                weddingConfig,
            );

            expect(screens[0]).toBe('event_type');
            expect(screens).not.toContain('welcome');
            expect(screens.filter((s) => s === 'contact')).toHaveLength(1);
        });

        it('skips partner screens for corporate events', () => {
            const screens = computePublicScreens({ event_type: 'corporate' }, corporateConfig);

            expect(screens).not.toContain('your_name');
            expect(screens).not.toContain('guests');
        });
    });
});

import { computePublicScreens, computeScreens, formatNiceDate, formatShortAddress } from './wizard-navigation';
import type { EventTypeConfig, NominatimResult } from '../types';

const weddingCfg: EventTypeConfig = {
    dateLabel: 'Date',
    guestsLabel: 'Guests',
    showGuests: true,
    guestsOptions: [],
    showPartner: true,
    partnerLabel: 'Partner',
    venueLabel: 'Venue',
    activities: [],
};

const birthdayCfg: EventTypeConfig = {
    ...weddingCfg,
    showPartner: false,
};

describe('computeScreens', () => {
    it('stops after event_type when event type is not chosen', () => {
        expect(computeScreens({}, weddingCfg)).toEqual(['welcome', 'event_type']);
    });

    it('includes partner flow for bride/groom roles', () => {
        const screens = computeScreens(
            { event_type: 'wedding', contact_role: 'bride' },
            weddingCfg,
        );
        expect(screens).toContain('partner_role');
        expect(screens).toContain('partner');
        expect(screens).not.toContain('bride_groom_names');
    });

    it('uses bride_groom_names when contact role is other', () => {
        const screens = computeScreens(
            { event_type: 'wedding', contact_role: 'other' },
            weddingCfg,
        );
        expect(screens).toContain('bride_groom_names');
        expect(screens).not.toContain('partner');
    });

    it('adds birthday_contact for birthday events', () => {
        const screens = computeScreens({ event_type: 'birthday' }, birthdayCfg);
        expect(screens).toContain('birthday_contact');
        expect(screens).not.toContain('your_name');
    });

    it('includes builder path screens when package_path is build', () => {
        const screens = computeScreens(
            { event_type: 'wedding', package_path: 'build', contact_role: 'groom' },
            weddingCfg,
        );
        expect(screens).toContain('builder');
        expect(screens).not.toContain('budget');
        expect(screens).not.toContain('packages');
    });

    it('includes call_details only when discovery call interest is yes', () => {
        const withCall = computeScreens(
            { event_type: 'wedding', package_path: 'pick', discovery_call_interest: 'yes' },
            weddingCfg,
        );
        const withoutCall = computeScreens(
            { event_type: 'wedding', package_path: 'pick', discovery_call_interest: 'no' },
            weddingCfg,
        );
        expect(withCall).toContain('call_details');
        expect(withoutCall).not.toContain('call_details');
    });
});

describe('computePublicScreens', () => {
    it('omits welcome and places contact before fork', () => {
        const screens = computePublicScreens({ event_type: 'wedding' }, weddingCfg);
        expect(screens[0]).toBe('event_type');
        expect(screens).not.toContain('welcome');
        const contactIdx = screens.indexOf('contact');
        const forkIdx = screens.indexOf('fork');
        expect(contactIdx).toBeGreaterThan(-1);
        expect(forkIdx).toBeGreaterThan(contactIdx);
    });

    it('ends at summary without a trailing contact screen', () => {
        const screens = computePublicScreens(
            { event_type: 'wedding', package_path: 'pick' },
            weddingCfg,
        );
        expect(screens[screens.length - 1]).toBe('summary');
        expect(screens.filter((s) => s === 'contact')).toHaveLength(1);
    });
});

describe('formatShortAddress', () => {
    it('builds a compact address from structured fields', () => {
        const result: NominatimResult = {
            display_name: 'Fallback',
            address: {
                house_number: '10',
                road: 'High Street',
                city: 'London',
                state: 'England',
                postcode: 'SW1A 1AA',
            },
        };
        expect(formatShortAddress(result)).toBe('10 High Street, London, England, SW1A 1AA');
    });

    it('falls back to display_name when address parts are missing', () => {
        expect(formatShortAddress({ display_name: 'Somewhere', address: {} })).toBe('Somewhere');
    });
});

describe('formatNiceDate', () => {
    it('formats ISO date strings', () => {
        expect(formatNiceDate('2026-03-27')).toMatch(/Friday, 27 March 2026/);
    });

    it('returns null for empty input', () => {
        expect(formatNiceDate(null)).toBeNull();
        expect(formatNiceDate('')).toBeNull();
    });
});

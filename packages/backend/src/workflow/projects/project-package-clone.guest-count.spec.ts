import { parseGuestCountMidpoint } from './project-package-clone.service';

describe('parseGuestCountMidpoint', () => {
  it('returns null for empty input', () => {
    expect(parseGuestCountMidpoint(null)).toBeNull();
    expect(parseGuestCountMidpoint(undefined)).toBeNull();
    expect(parseGuestCountMidpoint('   ')).toBeNull();
  });

  it('parses "Under N" as N', () => {
    expect(parseGuestCountMidpoint('Under 50')).toBe(50);
    expect(parseGuestCountMidpoint('under 120')).toBe(120);
  });

  it('parses "N+" as N', () => {
    expect(parseGuestCountMidpoint('300+')).toBe(300);
  });

  it('parses ranges with en-dash, hyphen, or spaced hyphen to midpoint', () => {
    expect(parseGuestCountMidpoint('50 – 150')).toBe(100);
    expect(parseGuestCountMidpoint('50-150')).toBe(100);
    expect(parseGuestCountMidpoint('50 - 150')).toBe(100);
  });

  it('parses plain numeric strings', () => {
    expect(parseGuestCountMidpoint('75')).toBe(75);
  });

  it('returns null for unparseable strings', () => {
    expect(parseGuestCountMidpoint('lots of guests')).toBeNull();
  });
});

import {
    DEFAULT_PACKAGE_EDIT_TAB_ORDER,
    normalizePackageEditTabOrder,
} from './package-edit-tabs';

describe('normalizePackageEditTabOrder', () => {
    it('returns defaults when order is empty', () => {
        expect(normalizePackageEditTabOrder([])).toEqual(DEFAULT_PACKAGE_EDIT_TAB_ORDER);
    });

    it('appends missing tabs and drops unknown ids', () => {
        expect(normalizePackageEditTabOrder(['tasks', 'unknown', 'people'])).toEqual([
            'tasks',
            'people',
            'blueprint',
            'locations',
            'roles',
            'equipment',
            'content',
            'deliverables',
        ]);
    });
});

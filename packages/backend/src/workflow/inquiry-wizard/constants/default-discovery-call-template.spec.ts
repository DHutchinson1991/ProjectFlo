import {
    DEFAULT_DISCOVERY_CALL_QUESTIONS,
    DISCOVERY_CALL_TEMPLATE_VERSION,
} from './default-discovery-call-template';

describe('DEFAULT_DISCOVERY_CALL_QUESTIONS', () => {
    it('uses unique field_key values', () => {
        const keys = DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => q.field_key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('orders questions by ascending order_index', () => {
        const indices = DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => q.order_index);
        const sorted = [...indices].sort((a, b) => a - b);
        expect(indices).toEqual(sorted);
    });

    it('includes required discovery-call sections', () => {
        const sections = DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => q.section);
        expect(sections).toEqual(
            expect.arrayContaining([
                'Call Opening',
                'The Connection',
                'The Discovery',
                'The Solution',
                'The Close',
            ]),
        );
    });

    it('exposes a positive template version for auto-reset tagging', () => {
        expect(DISCOVERY_CALL_TEMPLATE_VERSION).toBeGreaterThan(0);
    });
});

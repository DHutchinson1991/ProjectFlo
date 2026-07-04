import {
    DEFAULT_DISCOVERY_CALL_QUESTIONS,
    DISCOVERY_CALL_TEMPLATE_VERSION,
} from './default-discovery-call-template';

describe('default-discovery-call-template', () => {
    it('bumps version constant when questions change', () => {
        expect(DISCOVERY_CALL_TEMPLATE_VERSION).toBeGreaterThan(0);
    });

    it('has unique field_key values', () => {
        const keys = DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => q.field_key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('has unique order_index values', () => {
        const indices = DEFAULT_DISCOVERY_CALL_QUESTIONS.map((q) => q.order_index);
        expect(new Set(indices).size).toBe(indices.length);
    });

    it('includes required metadata on every question', () => {
        for (const question of DEFAULT_DISCOVERY_CALL_QUESTIONS) {
            expect(question.prompt.trim().length).toBeGreaterThan(0);
            expect(question.section.trim().length).toBeGreaterThan(0);
            expect(['internal', 'both']).toContain(question.visibility);
        }
    });
});

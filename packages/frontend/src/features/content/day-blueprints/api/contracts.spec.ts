import { createDayBlueprintsAiApi } from './ai';
import { createDayBlueprintsApi } from './index';

describe('Day blueprint API contracts', () => {
  it('sends explicit mode when generating moments', async () => {
    const client = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({}),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;
    const api = createDayBlueprintsAiApi(client);

    await api.generator.generateDay(15, 4, { mode: 'AI' });

    expect(client.post).toHaveBeenCalledWith(
      '/api/day-blueprints/versions/15/days/4/ai-generate',
      { mode: 'AI' },
    );
  });

  it('calls clone endpoint for seeded template cloning', async () => {
    const client = {
      get: jest.fn(),
      post: jest.fn().mockResolvedValue({}),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;
    const api = createDayBlueprintsApi(client);

    await api.clone(21, { display_name: 'My Template Copy' });

    expect(client.post).toHaveBeenCalledWith(
      '/api/day-blueprints/21/clone',
      { display_name: 'My Template Copy' },
    );
  });
});

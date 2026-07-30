import { buildPackageContentsSnapshot } from './package-contents-snapshot.util';

describe('buildPackageContentsSnapshot', () => {
  it('returns null when package input is null', () => {
    expect(buildPackageContentsSnapshot(null)).toBeNull();
  });

  it('captures blueprint lineage fields used for inquiry blueprint_drift', () => {
    const snapshot = buildPackageContentsSnapshot({
      id: 7,
      name: 'Gold Package',
      currency: 'GBP',
      contents: { films: 2 },
      source_day_blueprint_id: 100,
      source_day_blueprint_version_id: 200,
      source_day_blueprint: { id: 100, key: 'wedding-classic', display_name: 'Classic Wedding' },
      source_day_blueprint_version: { id: 200, version_number: 3 },
    });

    expect(snapshot).toMatchObject({
      package_id: 7,
      package_name: 'Gold Package',
      currency: 'GBP',
      contents: { films: 2 },
      source_day_blueprint_id: 100,
      source_day_blueprint_version_id: 200,
      source_day_blueprint_display_name: 'Classic Wedding',
      source_day_blueprint_key: 'wedding-classic',
      source_day_blueprint_version_number: 3,
    });
    expect(snapshot?.snapshot_taken_at).toEqual(expect.any(String));
  });

  it('defaults currency and nulls missing blueprint refs', () => {
    const snapshot = buildPackageContentsSnapshot({
      id: 1,
      name: 'Starter',
      currency: null,
      contents: null,
      source_day_blueprint_id: null,
      source_day_blueprint_version_id: null,
    });

    expect(snapshot).toMatchObject({
      currency: 'GBP',
      source_day_blueprint_id: null,
      source_day_blueprint_version_id: null,
      source_day_blueprint_display_name: null,
      source_day_blueprint_key: null,
      source_day_blueprint_version_number: null,
      contents: null,
    });
  });
});

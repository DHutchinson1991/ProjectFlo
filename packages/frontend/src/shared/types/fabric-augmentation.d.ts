// Re-enable the legacy `data` property on Fabric.js v6 objects and allow the
// previous `toJSON(propertiesToInclude?: string[])` signature. Our floor-plan
// editor stamps arbitrary metadata on fabric objects via `.data`.
import 'fabric';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricData = any;

declare module 'fabric' {
    interface FabricObjectProps {
        data?: FabricData;
    }

    interface SerializedObjectProps {
        data?: FabricData;
    }

    interface GroupProps {
        data?: FabricData;
    }

    interface FabricObject {
        data?: FabricData;
        toJSON(propertiesToInclude?: string[]): FabricData;
    }

    interface Group {
        data?: FabricData;
    }
}

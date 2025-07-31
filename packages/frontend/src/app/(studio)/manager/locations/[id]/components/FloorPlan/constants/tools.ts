import {
    CropSquare as RectangleIcon,
    Circle as CircleIcon,
    Timeline as LineIcon,
    TextFields as TextIcon,
    Architecture as WallIcon,
    MeetingRoom as DoorIcon,
    Window as WindowIcon,
    TheaterComedy as StageIcon,
    TableRestaurant as TableIcon,
    Chair as ChairIcon,
    Brush as DrawIcon,
    TouchApp as SelectIcon,
    PanTool as PanIcon,
    Kitchen as BarIcon,
    Wc as RestroomIcon,
    LocalParking as ParkingIcon,
    Security as SecurityIcon,
    EmergencyRecording as EmergencyIcon,
    Elevator as ElevatorIcon,
    Stairs as StairsIcon,
    EventSeat as SofaIcon,
    LocalBar as BarTableIcon,
    Weekend as CouchIcon,
    Deck as DeckIcon,
    Pool as PoolIcon,
    SportsBar as DjBoothIcon,
    Piano as PianoIcon,
    MicExternalOn as MicStandIcon
} from '@mui/icons-material';

export type Tool =
    | 'select'
    | 'pan'
    | 'rectangle'
    | 'circle'
    | 'line'
    | 'text'
    | 'wall'
    | 'door'
    | 'window'
    | 'stage'
    | 'table'
    | 'chair'
    | 'draw'
    | 'measure'
    | 'bar'
    | 'restroom'
    | 'parking'
    | 'security'
    | 'emergency'
    | 'elevator'
    | 'stairs'
    | 'sofa'
    | 'bartable'
    | 'couch'
    | 'deck'
    | 'pool'
    | 'djbooth'
    | 'piano'
    | 'micstand';

export interface ToolDefinition {
    id: Tool;
    label: string;
    icon: React.ComponentType;
}

export const DRAWING_TOOLS: ToolDefinition[] = [
    { id: 'select', label: 'Select', icon: SelectIcon },
    { id: 'pan', label: 'Pan', icon: PanIcon },
    { id: 'wall', label: 'Wall', icon: WallIcon },
    { id: 'rectangle', label: 'Rectangle', icon: RectangleIcon },
    { id: 'circle', label: 'Circle', icon: CircleIcon },
    { id: 'line', label: 'Line', icon: LineIcon },
    { id: 'text', label: 'Text', icon: TextIcon },
    { id: 'draw', label: 'Free Draw', icon: DrawIcon },
];

export const VENUE_STRUCTURE: ToolDefinition[] = [
    { id: 'door', label: 'Door', icon: DoorIcon },
    { id: 'window', label: 'Window', icon: WindowIcon },
    { id: 'stage', label: 'Stage', icon: StageIcon },
    { id: 'elevator', label: 'Elevator', icon: ElevatorIcon },
    { id: 'stairs', label: 'Stairs', icon: StairsIcon },
];

export const VENUE_AMENITIES: ToolDefinition[] = [
    { id: 'bar', label: 'Bar', icon: BarIcon },
    { id: 'restroom', label: 'Restroom', icon: RestroomIcon },
    { id: 'parking', label: 'Parking', icon: ParkingIcon },
    { id: 'security', label: 'Security', icon: SecurityIcon },
    { id: 'emergency', label: 'Emergency Exit', icon: EmergencyIcon },
];

export const FURNITURE_ELEMENTS: ToolDefinition[] = [
    { id: 'table', label: 'Round Table', icon: TableIcon },
    { id: 'chair', label: 'Chair', icon: ChairIcon },
    { id: 'sofa', label: 'Sofa', icon: SofaIcon },
    { id: 'bartable', label: 'Bar Table', icon: BarTableIcon },
    { id: 'couch', label: 'Couch', icon: CouchIcon },
];

export const OUTDOOR_ELEMENTS: ToolDefinition[] = [
    { id: 'deck', label: 'Deck/Patio', icon: DeckIcon },
    { id: 'pool', label: 'Pool', icon: PoolIcon },
];

export const EQUIPMENT_ELEMENTS: ToolDefinition[] = [
    { id: 'djbooth', label: 'DJ Booth', icon: DjBoothIcon },
    { id: 'piano', label: 'Piano', icon: PianoIcon },
    { id: 'micstand', label: 'Mic Stand', icon: MicStandIcon },
];

export const ALL_TOOLS = [
    ...DRAWING_TOOLS,
    ...VENUE_STRUCTURE,
    ...VENUE_AMENITIES,
    ...FURNITURE_ELEMENTS,
    ...OUTDOOR_ELEMENTS,
    ...EQUIPMENT_ELEMENTS
];

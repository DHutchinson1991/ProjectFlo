import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { SVG, Svg } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';
import { WallTool } from '../Tools/WallTool';
import { RoomRenderer } from '../Renderers/RoomRenderer';
import { ElementResizer } from '../Canvas/ElementResizer';
import { ElementMeasurements } from '../Canvas/ElementMeasurements';
import { CANVAS_DIMENSIONS, GRID_SIZES } from '../../../../constants/dimensions';
import { Wall, Room } from '../../../../types/floor-plan/WallTypes';

interface FloorPlanState {
    activeTool: string;
    walls: Wall[];
    rooms: Room[];
    selectedRoomId?: string;
    wallType: string;
    gridScale: '1m' | '5m' | '10m';
    showRoomLabels: boolean;
    showRoomAreas: boolean;
    showRoomDimensions: boolean;
    showMeasurements: boolean;
    onWallCreated: (wall: Wall) => void;
    onRoomSelected: (roomId: string) => void;
    onRoomDeselected: () => void;
    onSvgDrawingReady: (drawing: Svg) => void;
}

interface ZoomPanState {
    zoomLevel: number;
}

interface EditorCanvasProps {
    floorPlanState: FloorPlanState;
    zoomPanState: ZoomPanState;
}

interface SvgElementLike {
    type?: string;
    id?: () => string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    floorPlanState,
    zoomPanState
}) => {
    // Destructure values from state objects
    const {
        activeTool,
        walls,
        rooms,
        selectedRoomId,
        wallType,
        gridScale,
        showRoomLabels,
        showRoomAreas,
        showRoomDimensions,
        showMeasurements,
        onWallCreated,
        onRoomSelected,
        onRoomDeselected,
        onSvgDrawingReady
    } = floorPlanState;

    const { zoomLevel } = zoomPanState;
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const svgDrawingRef = useRef<Svg | null>(null) as React.MutableRefObject<Svg | null>;

    // Initialize SVG canvas
    useEffect(() => {
        if (!canvasContainerRef.current) return;

        // Create SVG drawing
        const drawing = SVG()
            .addTo(canvasContainerRef.current)
            .size(CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height)
            .viewbox(0, 0, CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height);

        svgDrawingRef.current = drawing;
        onSvgDrawingReady(drawing);

        // Initialize grid
        createGrid(drawing, gridScale);

        return () => {
            if (drawing && drawing.remove) {
                drawing.remove();
            }
        };
    }, [gridScale, onSvgDrawingReady]);

    const createGrid = (drawing: Svg, scale: '1m' | '5m' | '10m') => {
        // Remove existing grid
        const existingGrid = drawing.findOne('.grid-layer');
        if (existingGrid) {
            existingGrid.remove();
        }

        const gridSize = GRID_SIZES[scale];
        const gridGroup = drawing.group().addClass('grid-layer');

        // Create grid pattern
        const pattern = drawing.defs().pattern(gridSize, gridSize, (add) => {
            add.rect(gridSize, gridSize).fill('none').stroke('#E0E0E0').attr('stroke-width', 0.5);
            add.circle(1).cx(0).cy(0).fill('#BDBDBD');
        });

        // Apply grid background
        gridGroup.rect(CANVAS_DIMENSIONS.width, CANVAS_DIMENSIONS.height)
            .fill(pattern)
            .back(); // Ensure grid stays in background

        console.log(`Grid created with scale: ${scale} (${gridSize}px)`);
    };

    const getGridSizeInPixels = (scale: '1m' | '5m' | '10m'): number => {
        return GRID_SIZES[scale];
    };

    return (
        <Box
            ref={canvasContainerRef}
            sx={{
                flexGrow: 1,
                backgroundColor: 'white',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '400px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
            }}
        >
            {/* Professional Wall Tool */}
            <WallTool
                svgDrawing={svgDrawingRef}
                isActive={activeTool === 'wall'}
                onWallCreated={onWallCreated}
                existingWalls={walls}
                gridSize={getGridSizeInPixels(gridScale)}
                zoomLevel={zoomLevel}
                wallThickness={wallType === 'exterior' ? 8 : 4.5}
                wallType={wallType === 'exterior' ? 'exterior' : 'interior'}
                wallMaterial="drywall"
            />

            {/* Room Renderer */}
            <RoomRenderer
                svgDrawing={svgDrawingRef}
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                showRoomLabels={showRoomLabels}
                showRoomAreas={showRoomAreas}
                showRoomDimensions={showRoomDimensions}
                onRoomSelected={onRoomSelected}
                onRoomDeselected={onRoomDeselected}
            />

            {/* Element Resizer Component */}
            <ElementResizer
                svgDrawingRef={svgDrawingRef}
                isEnabled={activeTool === 'select'}
                onElementResize={(element: unknown, newDimensions: { width: number; height: number; x: number; y: number }) => {
                    console.log('Element resized:', {
                        elementType: (element as SvgElementLike)?.type,
                        elementId: (element as SvgElementLike)?.id?.(),
                        newDimensions,
                        timestamp: new Date().toISOString()
                    });
                }}
            />

            {/* Element Measurements Component */}
            <ElementMeasurements
                svgDrawingRef={svgDrawingRef}
                gridScale={gridScale}
                isVisible={showMeasurements}
            />
        </Box>
    );
};

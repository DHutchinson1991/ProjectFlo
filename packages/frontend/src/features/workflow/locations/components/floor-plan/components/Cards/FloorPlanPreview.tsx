'use client';

import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';

// Type definitions
interface VenueFloorPlan {
    venue_floor_plan_data: Record<string, unknown> | null;
    venue_floor_plan_version: number;
    venue_floor_plan_updated_at: string | null;
    venue_floor_plan_updated_by: number | null;
}

interface FloorPlanPreviewProps {
    data: VenueFloorPlan;
    width?: number | string;
    height?: number | string;
}

export const FloorPlanPreview: React.FC<FloorPlanPreviewProps> = ({
    data,
    width = '100%',
    height = '100%'
}) => {
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Extract SVG string from data
    const getSvgContent = () => {
        console.log('🖼️ FloorPlanPreview processing data:', {
            hasData: !!data.venue_floor_plan_data,
            dataType: typeof data.venue_floor_plan_data,
            dataKeys: data.venue_floor_plan_data ? Object.keys(data.venue_floor_plan_data) : null,
            version: data.venue_floor_plan_version
        });

        if (!data.venue_floor_plan_data) return null;

        const floorPlanData = data.venue_floor_plan_data;

        // Check if it's our new format with SVG string in 'elements' property
        if (typeof floorPlanData === 'object' && floorPlanData.elements) {
            console.log('🖼️ Found SVG data in elements property, length:', (floorPlanData.elements as string).length);
            return floorPlanData.elements as string;
        }

        // Check if it's our legacy format with SVG string in 'svg' property
        if (typeof floorPlanData === 'object' && floorPlanData.svg) {
            console.log('🖼️ Found SVG data in svg property, length:', (floorPlanData.svg as string).length);
            return floorPlanData.svg as string;
        }

        // For backward compatibility, if it's a direct SVG string
        if (typeof floorPlanData === 'string') {
            console.log('🖼️ Found direct SVG string, length:', (floorPlanData as string).length);
            return floorPlanData as string;
        }

        console.warn('🖼️ No valid SVG data found in floor plan data');
        return null;
    };

    // Create preview with grid background
    const createPreviewWithGrid = (userSvgContent: string) => {
        // Parse the user SVG to get the original dimensions and elements
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(userSvgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');

        if (!svgElement) {
            console.warn('🖼️ No SVG element found in user content');
            return userSvgContent;
        }

        // Get original dimensions from the user SVG
        const originalWidth = parseFloat(svgElement.getAttribute('width') || '1200');
        const originalHeight = parseFloat(svgElement.getAttribute('height') || '800');
        const viewBox = svgElement.getAttribute('viewBox') || `0 0 ${originalWidth} ${originalHeight}`;

        console.log('🖼️ Original SVG dimensions:', { originalWidth, originalHeight, viewBox });

        // Use the original dimensions for the preview
        const previewWidth = originalWidth;
        const previewHeight = originalHeight;

        // Determine grid size - try to detect from existing grid or use default
        // This is a simplified approach - in a real app, you'd store the grid scale with the data
        let gridSize = 20; // Default to 1m scale

        // Try to detect grid scale from existing grid lines (if any)
        const existingLines = svgElement.querySelectorAll('line');
        if (existingLines.length > 0) {
            const firstVerticalLine = Array.from(existingLines).find(line =>
                line.getAttribute('x1') === line.getAttribute('x2') &&
                line.getAttribute('x1') !== '0'
            );
            if (firstVerticalLine) {
                const x = parseFloat(firstVerticalLine.getAttribute('x1') || '20');
                if (x === 100) gridSize = 100; // 5m scale
                else if (x === 200) gridSize = 200; // 10m scale
                else gridSize = 20; // 1m scale
            }
        }

        // Create grid SVG using detected or default grid size
        let gridSvg = '';

        // Add vertical grid lines
        for (let x = 0; x <= previewWidth; x += gridSize) {
            gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${previewHeight}" stroke="#e0e0e0" stroke-width="1" opacity="0.8"/>`;
        }

        // Add horizontal grid lines
        for (let y = 0; y <= previewHeight; y += gridSize) {
            gridSvg += `<line x1="0" y1="${y}" x2="${previewWidth}" y2="${y}" stroke="#e0e0e0" stroke-width="1" opacity="0.8"/>`;
        }

        // Add border
        gridSvg += `<rect width="${previewWidth}" height="${previewHeight}" fill="none" stroke="#cccccc" stroke-width="2"/>`;

        // Extract all child elements except defs
        let userElements = '';
        Array.from(svgElement.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'defs') {
                userElements += child.outerHTML;
            }
        });

        // Combine grid and user content using original dimensions
        const combinedSvg = `
            <svg 
                viewBox="${viewBox}" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style="background-color: #ffffff;"
            >
                <g class="grid-layer">
                    ${gridSvg}
                </g>
                <g class="user-content">
                    ${userElements}
                </g>
            </svg>
        `;

        console.log('🖼️ Created preview with grid using detected scale:', {
            previewWidth,
            previewHeight,
            gridSize: gridSize + 'px',
            scale: gridSize === 20 ? '1m' : gridSize === 100 ? '5m' : '10m',
            hasUserElements: userElements.length > 0,
            userElementsPreview: userElements.substring(0, 200)
        });
        return combinedSvg;
    };

    const svgContent = getSvgContent();

    return (
        <Box
            sx={{
                width,
                height,
                position: 'relative',
                backgroundColor: '#ffffff',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden',
                minHeight: '200px'
            }}
        >
            {svgContent ? (
                <Box
                    ref={previewContainerRef}
                    sx={{
                        width: '100%',
                        height: '100%',
                        '& svg': {
                            width: '100%',
                            height: '100%',
                            display: 'block'
                        }
                    }}
                    dangerouslySetInnerHTML={{
                        __html: createPreviewWithGrid(svgContent)
                    }}
                />
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        No floor plan data
                    </Typography>
                </Box>
            )}

            {/* Version indicator */}
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    px: 1,
                    borderRadius: 0.5
                }}
            >
                v{data.venue_floor_plan_version}
            </Typography>
        </Box>
    );
};

'use client';

import React, { useState, useEffect } from 'react';
import { MeasurementService, Measurement } from '../../services/MeasurementService';
import { GridService } from '../../services/GridService';

interface ElementMeasurementsProps {
    svgDrawingRef: React.RefObject<unknown>; // SVG.js drawing instance
    gridScale: '1m' | '5m' | '10m';
    isVisible: boolean;
    onMeasurementsChange?: (measurements: Measurement[]) => void;
}

export const ElementMeasurements: React.FC<ElementMeasurementsProps> = ({
    svgDrawingRef,
    gridScale,
    isVisible,
    onMeasurementsChange
}) => {
    const [allElements, setAllElements] = useState<unknown[]>([]); // SVG.js elements
    const [measurements, setMeasurements] = useState<Measurement[]>([]);

    // Helper function to convert pixels to meters based on grid scale
    const pixelsToMeters = (pixels: number) => {
        const gridSizePixels = GridService.getGridSize(gridScale);
        const realDistance = GridService.calculateRealDistance(pixels, gridScale);
        return realDistance.value.toFixed(1);
    };

    // Find all measurable elements when visibility changes
    useEffect(() => {
        if (!svgDrawingRef.current || !isVisible) {
            setAllElements([]);
            setMeasurements([]);
            return;
        }

        const drawing = svgDrawingRef.current as any; // SVG.js drawing instance

        // Find all non-grid elements that can be measured
        const elements = drawing.find('*').filter((element: any) => { // SVG.js element
            return !element.hasClass('grid-layer') &&
                element.type !== 'defs' &&
                element.type !== 'svg' &&
                !element.parent()?.hasClass('grid-layer') &&
                !element.hasClass('measurement-line') &&
                !element.hasClass('measurement-text') &&
                !element.hasClass('measurement-overlay') &&
                (element.type === 'rect' || element.type === 'circle' || element.type === 'text' || element.type === 'line');
        });

        console.log('🔍 Found elements for measurement:', elements.length, elements.map((el: any) => ({ // SVG.js element
            type: el.type,
            id: el.id(),
            classes: el.classes()
        })));

        setAllElements(elements);
    }, [svgDrawingRef, isVisible, gridScale]);

    // Create measurements for elements
    useEffect(() => {
        if (!allElements.length || !isVisible) {
            setMeasurements([]);
            onMeasurementsChange?.([]);
            return;
        }

        const newMeasurements: Measurement[] = [];

        allElements.forEach((element: any, index: number) => { // SVG.js element
            try {
                const bbox = element.bbox();

                // Skip very small elements (likely artifacts)
                if (bbox.width < 5 || bbox.height < 5) {
                    return;
                }

                // Create width measurement
                const widthMeasurement = MeasurementService.createMeasurement(
                    { x: bbox.x, y: bbox.y + bbox.height },
                    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                    gridScale,
                    `element_${index}_width`
                );

                // Create height measurement
                const heightMeasurement = MeasurementService.createMeasurement(
                    { x: bbox.x + bbox.width, y: bbox.y },
                    { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                    gridScale,
                    `element_${index}_height`
                );

                newMeasurements.push(widthMeasurement, heightMeasurement);

            } catch (error) {
                console.error(`❌ Error creating measurements for element ${index}:`, error);
            }
        });

        setMeasurements(newMeasurements);
        onMeasurementsChange?.(newMeasurements);
    }, [allElements, isVisible, gridScale, onMeasurementsChange]);

    // Render measurements on the canvas
    useEffect(() => {
        if (!svgDrawingRef.current) return;

        const drawing = svgDrawingRef.current as any;

        // Always clear existing measurements first
        drawing.find('.measurement-overlay').forEach((el: any) => { // SVG.js element
            el.remove();
        });

        if (!isVisible || measurements.length === 0) {
            return;
        }

        console.log('🔧 Rendering measurements for', measurements.length, 'measurements');

        // Render each measurement
        measurements.forEach((measurement, index) => {
            try {
                // Create measurement group
                const measurementGroup = drawing.group().addClass('measurement-overlay');

                // Style constants
                const lineColor = '#ff4444';
                const textColor = '#ff4444';
                const lineWidth = 1.5;
                const fontSize = 12;

                const { startPoint, endPoint } = measurement;
                const isHorizontal = Math.abs(startPoint.y - endPoint.y) < Math.abs(startPoint.x - endPoint.x);

                if (isHorizontal) {
                    // Horizontal measurement line
                    measurementGroup.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    // Vertical ticks
                    measurementGroup.line(startPoint.x, startPoint.y - 5, startPoint.x, startPoint.y + 5)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    measurementGroup.line(endPoint.x, endPoint.y - 5, endPoint.x, endPoint.y + 5)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    // Text
                    measurementGroup.text(measurement.label)
                        .move((startPoint.x + endPoint.x) / 2, startPoint.y + 8)
                        .font({ size: fontSize, family: 'Arial', weight: 'bold' })
                        .fill(textColor)
                        .attr('text-anchor', 'middle')
                        .addClass('measurement-text');
                } else {
                    // Vertical measurement line
                    measurementGroup.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    // Horizontal ticks
                    measurementGroup.line(startPoint.x - 5, startPoint.y, startPoint.x + 5, startPoint.y)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    measurementGroup.line(endPoint.x - 5, endPoint.y, endPoint.x + 5, endPoint.y)
                        .stroke({ color: lineColor, width: lineWidth })
                        .addClass('measurement-line');

                    // Text (rotated)
                    measurementGroup.text(measurement.label)
                        .move(startPoint.x + 8, (startPoint.y + endPoint.y) / 2)
                        .font({ size: fontSize, family: 'Arial', weight: 'bold' })
                        .fill(textColor)
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .transform({ rotate: -90, cx: startPoint.x + 8, cy: (startPoint.y + endPoint.y) / 2 })
                        .addClass('measurement-text');
                }

                // Position measurement group appropriately
                measurementGroup.front();

                console.log(`✅ Rendered measurement ${index + 1}:`, measurement.label);

            } catch (error) {
                console.error(`❌ Error rendering measurement ${index}:`, error);
            }
        });

        return () => {
            // Cleanup measurements when component unmounts or changes
            drawing.find('.measurement-overlay').forEach((el: any) => { // SVG.js element
                el.remove();
            });
        };
    }, [measurements, isVisible, svgDrawingRef]);

    return null; // This component doesn't render any React elements
};

/**
 * Scene Conversion Utilities
 * 
 * Handles converting library scenes into timeline scene objects.
 * Includes logic for:
 * - Moments container creation (single scene spanning multiple tracks)
 * - Traditional coverage-split scene creation
 * - Track assignment and media component mapping
 */
import { TimelineScene, TimelineTrack } from "@/features/content/content-builder/types/timeline";
import { ScenesLibrary } from "@/features/content/scenes/types";
import { SceneMediaComponent } from "@/features/content/content-builder/types/timeline";
import { getSceneColorByType } from "./colorUtils";

export const createTimelineScenesFromLibraryScene = (
    libraryScene: ScenesLibrary,
    tracks: TimelineTrack[],
    preferredStartTime: number,
    existingScenes: TimelineScene[]
): { scenes: TimelineScene[]; newTracks: TimelineTrack[] } => {
    console.log(`📥 [IMPORT] Starting scene import for library scene: ${libraryScene.name} (ID: ${libraryScene.id})`);
    console.log(`📥 [IMPORT] Scene type: ${libraryScene.type}, Estimated duration: ${libraryScene.estimated_duration}s`);
    console.log(`📥 [IMPORT] Preferred start time: ${preferredStartTime}s, Available tracks: ${tracks.length}`);
    console.log(`📥 [IMPORT] Existing scenes on timeline: ${existingScenes.length}`);

    const sceneWithComponents = libraryScene as typeof libraryScene & { 
        media_components?: SceneMediaComponent[];
        moments?: any[];
    };

    const allComponents = sceneWithComponents.media_components && sceneWithComponents.media_components.length > 0
        ? sceneWithComponents.media_components
        : [{
            id: 0,
            scene_id: libraryScene.id,
            media_type: libraryScene.type,
            duration_seconds: libraryScene.estimated_duration || 30,
            is_primary: true,
            isCoverage: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as SceneMediaComponent];

    console.log(`📥 [IMPORT] Media components found: ${allComponents.length}`);

    const moments = sceneWithComponents.moments || [];
    const templateType = (libraryScene as any).type;
    const isTemplateMontage = templateType === "MONTAGE";
    // 🎬 MOMENTS MODE: If scene has moments, create a single moments container scene instead of individual component scenes
    if (moments.length > 0 && !isTemplateMontage) {
        console.log(`🎬 [MOMENTS] Scene has ${moments.length} moments - creating moments container`);
        
        // Calculate total duration from moments
        const totalDuration = moments.reduce((total: number, m: any) => {
            const duration = m.duration_seconds || m.duration || m.estimated_duration || 0;
            return total + duration;
        }, 0);
        
        // Load moment preferences from localStorage
        const templateRecordingSetup = (libraryScene as any).recording_setup as { graphics_enabled?: boolean } | null | undefined;
        let includeGraphicsFlag = (libraryScene as any).includeGraphics === true || templateRecordingSetup?.graphics_enabled === true;
        let includeMusicFlag = (libraryScene as any).includeMusic === true;
        
        // Try to load from localStorage if not on scene object
        if (!includeGraphicsFlag || !includeMusicFlag) {
            try {
                const storedPrefs = localStorage.getItem(`scene-moment-prefs-${libraryScene.id}`);
                if (storedPrefs) {
                    const prefs = JSON.parse(storedPrefs);
                    if (prefs.includeGraphics !== undefined) includeGraphicsFlag = prefs.includeGraphics;
                    if (prefs.includeMusic !== undefined) includeMusicFlag = prefs.includeMusic;
                    console.log(`🔍 [MOMENTS] Loaded preferences from localStorage for scene ${libraryScene.id}:`, prefs);
                }
            } catch (err) {
                console.error(`⚠️ [MOMENTS] Failed to load preferences from localStorage:`, err);
            }
        }
        
        // Determine which tracks to populate
        // Default: Video and Audio tracks
        // Conditional: Add Graphics if includeGraphics flag is true or scene has graphics components
        // Conditional: Add Music if includeMusic flag is true or scene has music components
        const hasGraphicsFlag = includeGraphicsFlag || (libraryScene as any).includeGraphics === true;
        const hasMusicFlag = includeMusicFlag || (libraryScene as any).includeMusic === true;
        const hasGraphicsComponents = allComponents.some((c: any) => c.media_type === 'GRAPHICS' || c.media_type === 'graphics');
        const hasMusicComponents = allComponents.some((c: any) => c.media_type === 'MUSIC' || c.media_type === 'music');
        
        const shouldIncludeGraphics = hasGraphicsFlag || hasGraphicsComponents;
        const shouldIncludeMusic = hasMusicFlag || hasMusicComponents;
        
        const targetTracks = tracks.filter((track) => {
            const trackType = track.track_type?.toLowerCase() || '';
            // Always include video and audio
            if (trackType === 'video' || trackType === 'audio') return true;
            // Conditionally include graphics if flag is set or scene has graphics
            if (trackType === 'graphics' && shouldIncludeGraphics) return true;
            // Conditionally include music if flag is set or scene has music
            if (trackType === 'music' && shouldIncludeMusic) return true;
            return false;
        });
        
        console.log(`🎬 [MOMENTS] Target tracks: ${targetTracks.length} (Video/Audio: always, Graphics: ${shouldIncludeGraphics ? 'YES' : 'NO'}, Music: ${shouldIncludeMusic ? 'YES' : 'NO'})`);
        
        // Precompute media_components once to avoid duplicating work for each track
        const baseMediaComponents = allComponents.map(component => ({
            id: component.id,
            media_type: (component as any).media_type,
            track_id: targetTracks[0]?.id ?? 0,
            start_time: 0,
            duration: totalDuration || libraryScene.estimated_duration || 30,
            is_primary: (component as any).is_primary || false,
            music_type: (component as any).music_type,
            notes: (component as any).notes,
            scene_component_id: component.id
        }));

        // Create a SINGLE moments container scene that spans all target tracks
        // Instead of creating one scene per track, create one unified scene
        const momentsContainerScenes: TimelineScene[] = [
            {
                id: Date.now(),
                name: libraryScene.name,
                start_time: preferredStartTime,
                duration: totalDuration || libraryScene.estimated_duration || 30,
                track_id: targetTracks[0].id, // Default to first video track
                scene_type: 'moments_container',
                color: getSceneColorByType('MOMENTS' as any),
                description: libraryScene.description || '',
                database_type: 'MOMENTS_CONTAINER',
                original_scene_id: libraryScene.id,
                moments: moments,
                beats: [],
                media_components: baseMediaComponents,
                target_tracks: targetTracks.map(t => t.id), // Store which tracks this moments scene uses
                recording_setup_template: (libraryScene as any).recording_setup ?? null,
                scene_template_type: templateType || 'MOMENTS',
            }
        ];
        
        console.log(`✨ [MOMENTS] Created 1 unified moments container scene:`, {
            id: libraryScene.id,
            name: libraryScene.name,
            duration: totalDuration,
            momentsCount: moments.length,
            targetTracks: targetTracks.length,
            trackIds: targetTracks.map(t => t.id).join(', ')
        });
        
        return { scenes: momentsContainerScenes, newTracks: [] };
    }

    if (moments.length > 0 && isTemplateMontage) {
        const totalDuration = moments.reduce((total: number, m: any) => {
            const duration = m.duration_seconds || m.duration || m.estimated_duration || 0;
            return total + duration;
        }, 0);

        const targetTracks = tracks.filter((track) => {
            const trackType = track.track_type?.toLowerCase() || '';
            return trackType === 'video' || trackType === 'audio' || trackType === 'graphics' || trackType === 'music';
        });

        const baseMediaComponents = allComponents.map(component => ({
            id: component.id,
            media_type: (component as any).media_type,
            track_id: targetTracks[0]?.id ?? 0,
            start_time: 0,
            duration: totalDuration || libraryScene.estimated_duration || 30,
            is_primary: (component as any).is_primary || false,
            music_type: (component as any).music_type,
            notes: (component as any).notes,
            scene_component_id: component.id
        }));

        const montageBeats = moments.map((moment: any, index: number) => ({
            // Don't assign ID - beats will get IDs when saved to database
            name: moment.name,
            order_index: index,
            duration_seconds: moment.duration_seconds || moment.duration || moment.estimated_duration || 10,
            shot_count: moment.shot_count ?? null,
        }));

        const montageContainerScenes: TimelineScene[] = [
            {
                id: Date.now(),
                name: libraryScene.name,
                start_time: preferredStartTime,
                duration: totalDuration || libraryScene.estimated_duration || 30,
                track_id: targetTracks[0]?.id || tracks[0]?.id,
                scene_type: 'moments_container',
                color: getSceneColorByType('MONTAGE' as any),
                description: libraryScene.description || '',
                database_type: 'MOMENTS_CONTAINER',
                original_scene_id: libraryScene.id,
                moments: [],
                beats: montageBeats,
                media_components: baseMediaComponents,
                target_tracks: targetTracks.map(t => t.id),
                recording_setup_template: (libraryScene as any).recording_setup ?? null,
                scene_template_type: 'MONTAGE',
            }
        ];

        return { scenes: montageContainerScenes, newTracks: [] };
    }
    
    // TRADITIONAL MODE: No moments, create individual component/coverage scenes
    // ARCHITECTURE: Separate coverage assignments from media components
    // Coverage (isCoverage: true) → Each gets its own track (V1, V2, A1, A2)
    // Media (isCoverage: false) → Stack on same track at different times (M1, M2, M3 on Music track)
    const coverageAssignments = allComponents.filter((c: any) => c.isCoverage === true);
    const mediaComponents = allComponents.filter((c: any) => c.isCoverage === false || c.isCoverage === undefined);
    
    console.log(`🎯 [COVERAGE-SPLIT] Coverage assignments: ${coverageAssignments.length}, Media components: ${mediaComponents.length}`);
    console.log(`🎯 [COVERAGE-SPLIT] Coverage:`, coverageAssignments.map((c: any) => `${c.media_type} (${c.notes || 'no notes'})`));
    console.log(`🎯 [COVERAGE-SPLIT] Media:`, mediaComponents.map((c: any) => `${c.media_type}`));
    
    // Calculate total duration from moments if available, trying different property names
    let totalDuration = libraryScene.estimated_duration || 30;
    
    const moments2 = sceneWithComponents.moments || [];
    if (moments2.length > 0) {
        const momentsDuration = moments2.reduce((total: number, m: any) => {
            const duration = m.duration_seconds 
                || m.duration 
                || m.estimated_duration
                || 0;
            return total + duration;
        }, 0);
        
        if (momentsDuration > 0) {
            totalDuration = momentsDuration;
        }
    }

    // Group COVERAGE ASSIGNMENTS by type (each gets separate track)
    const videoCoverageAssignments = coverageAssignments.filter(c => (c as any).media_type === 'VIDEO');
    const audioCoverageAssignments = coverageAssignments.filter(c => (c as any).media_type === 'AUDIO');
    const graphicsCoverageAssignments = coverageAssignments.filter(c => (c as any).media_type === 'GRAPHICS');
    const musicCoverageAssignments = coverageAssignments.filter(c => (c as any).media_type === 'MUSIC');
    
    // Collect all scenes to create
    const createdScenes: TimelineScene[] = [];
    const allNewTracks: TimelineTrack[] = [];
    const allUpdatedTracks = [...tracks]; // We'll modify this as we add new tracks

    // For each COVERAGE ASSIGNMENT, create a new track and scene
    const videoCoverageCount = videoCoverageAssignments.length;
    const audioCoverageCount = audioCoverageAssignments.length;
    const graphicsCoverageCount = graphicsCoverageAssignments.length;
    const musicCoverageCount = musicCoverageAssignments.length;

    const currentStartTime = preferredStartTime;

    // Create VIDEO coverage tracks
    for (let i = 0; i < videoCoverageCount; i++) {
        const coverage = videoCoverageAssignments[i] as any;
        const newTrackId = Math.max(...allUpdatedTracks.map(t => t.id), 0) + 1;
        const newTrack: TimelineTrack = {
            id: newTrackId,
            name: `V${i + 1}`,
            track_type: 'video',
            order_index: allUpdatedTracks.length,
            color: 'rgba(123, 97, 255, 0.8)',
            height: 60,
            visible: true,
        };
        allNewTracks.push(newTrack);
        allUpdatedTracks.push(newTrack);

        createdScenes.push({
            id: Date.now() + Math.random(),
            name: libraryScene.name,
            start_time: currentStartTime,
            duration: totalDuration,
            track_id: newTrackId,
            scene_type: 'video',
            color: 'rgba(123, 97, 255, 0.8)',
            description: libraryScene.description || '',
            database_type: 'VIDEO',
            original_scene_id: libraryScene.id,
            recording_setup_template: (libraryScene as any).recording_setup ?? null,
        });
    }

    // Create AUDIO coverage tracks
    for (let i = 0; i < audioCoverageCount; i++) {
        const coverage = audioCoverageAssignments[i] as any;
        const newTrackId = Math.max(...allUpdatedTracks.map(t => t.id), 0) + 1;
        const newTrack: TimelineTrack = {
            id: newTrackId,
            name: `A${i + 1}`,
            track_type: 'audio',
            order_index: allUpdatedTracks.length,
            color: 'rgba(255, 107, 157, 0.8)',
            height: 60,
            visible: true,
        };
        allNewTracks.push(newTrack);
        allUpdatedTracks.push(newTrack);

        createdScenes.push({
            id: Date.now() + Math.random(),
            name: libraryScene.name,
            start_time: currentStartTime,
            duration: totalDuration,
            track_id: newTrackId,
            scene_type: 'audio',
            color: 'rgba(255, 107, 157, 0.8)',
            description: libraryScene.description || '',
            database_type: 'AUDIO',
            original_scene_id: libraryScene.id,
            recording_setup_template: (libraryScene as any).recording_setup ?? null,
        });
    }

    // Create GRAPHICS coverage tracks
    for (let i = 0; i < graphicsCoverageCount; i++) {
        const coverage = graphicsCoverageAssignments[i] as any;
        const newTrackId = Math.max(...allUpdatedTracks.map(t => t.id), 0) + 1;
        const newTrack: TimelineTrack = {
            id: newTrackId,
            name: `G${i + 1}`,
            track_type: 'graphics',
            order_index: allUpdatedTracks.length,
            color: 'rgba(0, 229, 255, 0.8)',
            height: 60,
            visible: true,
        };
        allNewTracks.push(newTrack);
        allUpdatedTracks.push(newTrack);

        createdScenes.push({
            id: Date.now() + Math.random(),
            name: libraryScene.name,
            start_time: currentStartTime,
            duration: totalDuration,
            track_id: newTrackId,
            scene_type: 'graphics',
            color: 'rgba(0, 229, 255, 0.8)',
            description: libraryScene.description || '',
            database_type: 'GRAPHICS',
            original_scene_id: libraryScene.id,
            recording_setup_template: (libraryScene as any).recording_setup ?? null,
        });
    }

    // Create MUSIC coverage tracks
    for (let i = 0; i < musicCoverageCount; i++) {
        const coverage = musicCoverageAssignments[i] as any;
        const newTrackId = Math.max(...allUpdatedTracks.map(t => t.id), 0) + 1;
        const newTrack: TimelineTrack = {
            id: newTrackId,
            name: `M${i + 1}`,
            track_type: 'music',
            order_index: allUpdatedTracks.length,
            color: 'rgba(255, 193, 7, 0.8)',
            height: 60,
            visible: true,
        };
        allNewTracks.push(newTrack);
        allUpdatedTracks.push(newTrack);

        createdScenes.push({
            id: Date.now() + Math.random(),
            name: libraryScene.name,
            start_time: currentStartTime,
            duration: totalDuration,
            track_id: newTrackId,
            scene_type: 'music',
            color: 'rgba(255, 193, 7, 0.8)',
            description: libraryScene.description || '',
            database_type: 'MUSIC',
            original_scene_id: libraryScene.id,
            recording_setup_template: (libraryScene as any).recording_setup ?? null,
        });
    }

    // Create scenes on EXISTING tracks for MEDIA COMPONENTS (non-coverage)
    // Stack media components on existing tracks without creating new tracks
    const existingVideoTracks = allUpdatedTracks.filter(t => t.track_type === 'video');
    const existingAudioTracks = allUpdatedTracks.filter(t => t.track_type === 'audio');
    const existingGraphicsTracks = allUpdatedTracks.filter(t => t.track_type === 'graphics');
    const existingMusicTracks = allUpdatedTracks.filter(t => t.track_type === 'music');

    // Stack media components on tracks, spreading across available tracks by type
    let mediaIndex = 0;
    for (const media of mediaComponents) {
        const mediaType = (media as any).media_type?.toUpperCase();
        let trackList: TimelineTrack[] = [];
        let sceneType: TimelineScene['scene_type'] = 'video';
        let color = 'rgba(123, 97, 255, 0.8)';

        if (mediaType === 'VIDEO') {
            trackList = existingVideoTracks;
            sceneType = 'video';
            color = 'rgba(123, 97, 255, 0.8)';
        } else if (mediaType === 'AUDIO') {
            trackList = existingAudioTracks;
            sceneType = 'audio';
            color = 'rgba(255, 107, 157, 0.8)';
        } else if (mediaType === 'GRAPHICS') {
            trackList = existingGraphicsTracks;
            sceneType = 'graphics';
            color = 'rgba(0, 229, 255, 0.8)';
        } else if (mediaType === 'MUSIC') {
            trackList = existingMusicTracks;
            sceneType = 'music';
            color = 'rgba(255, 193, 7, 0.8)';
        }

        if (trackList.length > 0) {
            const targetTrack = trackList[mediaIndex % trackList.length];
            createdScenes.push({
                id: Date.now() + Math.random(),
                name: libraryScene.name,
                start_time: currentStartTime,
                duration: totalDuration,
                track_id: targetTrack.id,
                scene_type: sceneType,
                color,
                description: libraryScene.description || '',
                database_type: (mediaType || 'VIDEO') as TimelineScene['database_type'],
                original_scene_id: libraryScene.id,
                recording_setup_template: (libraryScene as any).recording_setup ?? null,
            });
            mediaIndex++;
        }
    }

    // Log final summary
    console.log(`📊 [COVERAGE-SPLIT] Created ${createdScenes.length} scenes:`, {
        videoCoverage: videoCoverageCount,
        audioCoverage: audioCoverageCount,
        graphicsCoverage: graphicsCoverageCount,
        musicCoverage: musicCoverageCount,
        mediaComponents: mediaComponents.length,
    });

    // Also log the existing tracks that were reordered
    allUpdatedTracks.filter(t => !allNewTracks.includes(t)).forEach(track => {
        console.log(`  🔄 Reordered existing track: ${track.name} (id: ${track.id}, order_index: ${track.order_index})`);
    });

    // Final summary log
    console.log(`✅ [IMPORT-COMPLETE] Scene import finished for "${libraryScene.name}"`);
    console.log(`✅ [IMPORT-COMPLETE] Created scenes: ${createdScenes.length} | New tracks: ${allNewTracks.length}`);
    console.log(`✅ [IMPORT-COMPLETE] Timeline duration after import:`, {
        maxSceneEndTime: Math.max(...createdScenes.map(s => s.start_time + s.duration), 0),
        sceneStartTimes: createdScenes.map(s => `${s.name} @ ${s.start_time}s`).join(', ')
    });

    // Return new tracks created
    return { scenes: createdScenes, newTracks: allNewTracks };
};

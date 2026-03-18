/**
 * Recording Setup API - Recording configuration management
 * Handles recording setups and camera subject assignments
 */

import type { MomentRecordingSetup, CameraSubjectAssignment, CreateMomentRecordingSetupDto, UpdateMomentRecordingSetupDto, CreateCameraSubjectAssignmentDto, UpdateCameraSubjectAssignmentDto } from '../types/domains/recording-setup';
import type { ApiClient } from './api-client.types';

export const createRecordingSetupApi = (client: ApiClient) => ({
  /**
   * Moment Recording Setup - Recording configuration for moments
   */
  recordingSetup: {
    /**
     * Get recording setup for a moment
     * GET /moments/:id/recording-setup
     */
    getByMoment: (momentId: number): Promise<MomentRecordingSetup> =>
      client.get(`/moments/${momentId}/recording-setup`),

    /**
     * Create recording setup for a moment
     * POST /recording-setup
     */
    create: (data: CreateMomentRecordingSetupDto): Promise<MomentRecordingSetup> =>
      client.post('/recording-setup', data),

    /**
     * Update recording setup
     * PATCH /recording-setup/:id
     */
    update: (id: number, data: UpdateMomentRecordingSetupDto): Promise<MomentRecordingSetup> =>
      client.patch(`/recording-setup/${id}`, data),

    /**
     * Delete recording setup
     * DELETE /recording-setup/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/recording-setup/${id}`),
  },

  /**
   * Camera Subject Assignments - Links cameras to subjects for moments
   */
  cameraAssignments: {
    /**
     * Get all camera assignments for a recording setup
     * GET /camera-assignments?setupId=1
     */
    getBySetup: (setupId: number): Promise<CameraSubjectAssignment[]> =>
      client.get(`/camera-assignments?setupId=${setupId}`),

    /**
     * Get a single camera assignment
     * GET /camera-assignments/:id
     */
    getById: (id: number): Promise<CameraSubjectAssignment> =>
      client.get(`/camera-assignments/${id}`),

    /**
     * Create a camera subject assignment
     * POST /camera-assignments
     */
    create: (data: CreateCameraSubjectAssignmentDto): Promise<CameraSubjectAssignment> =>
      client.post('/camera-assignments', data),

    /**
     * Update a camera assignment
     * PATCH /camera-assignments/:id
     */
    update: (id: number, data: UpdateCameraSubjectAssignmentDto): Promise<CameraSubjectAssignment> =>
      client.patch(`/camera-assignments/${id}`, data),

    /**
     * Delete a camera assignment
     * DELETE /camera-assignments/:id
     */
    delete: (id: number): Promise<void> =>
      client.delete(`/camera-assignments/${id}`),
  },
});

export type RecordingSetupApi = ReturnType<typeof createRecordingSetupApi>;

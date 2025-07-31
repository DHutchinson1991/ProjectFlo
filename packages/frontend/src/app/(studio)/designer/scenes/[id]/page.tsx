"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import Link from "next/link";
import { api } from "@/lib/api";
import { CoverageLibraryItem, CreateCoverageDto, UpdateCoverageDto, CoverageType, ShotType, CameraMovement, AudioEquipment, VideoStyleType } from "@/types/coverage.types";
import { Equipment, EquipmentCategory, EquipmentType, EquipmentCondition, EquipmentAvailability } from "@/lib/types/equipment";
import { Contributor } from "@/lib/types/domains/users";
import { SceneSubjects, SubjectsLibrary } from "@/lib/types/subjects";
import TemplateCustomizationDialog from "@/components/coverage/TemplateCustomizationDialog";
import CreateCoverageDialog from "@/components/coverage/CreateCoverageDialog";
import VideoCoverageTable from "@/components/coverage/VideoCoverageTable";
import AudioCoverageTable from "@/components/coverage/AudioCoverageTable";
import MomentsManagement from "@/components/moments/MomentsManagement";
import MusicManagement from "@/components/music/MusicManagement";
import SubjectsManagement from "@/components/subjects/SubjectsManagement";
import { SceneMoment, formatDuration, getTotalMomentsDuration } from '@/lib/types/moments';

// Local type for music items to avoid import issues
interface MusicItem {
  id?: number;
  music_name?: string;
  artist?: string;
  music_type?: string;
}

import {
  AccessTime as TimeIcon,
  MusicNote as MusicIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Camera as EquipmentIcon,
  People as CrewIcon,
  Face as SubjectsIcon,
  Movie as MovieIcon
} from '@mui/icons-material';

// Coverage item interface - updated to match new structure
interface CoverageItem {
  id?: number;
  coverage_type: CoverageType;
  name: string;
  description: string;
  assignment_number?: string; // V1, V2, A1, A2, etc.

  // Video-specific fields
  shot_type?: string;
  camera_movement?: string;
  lens_focal_length?: string;
  aperture?: string;
  video_style_type?: VideoStyleType; // Add video style type field

  // Audio-specific fields
  audio_equipment?: string;
  audio_pattern?: string;
  frequency_response?: string;

  // Common fields
  subject?: string;
  operator?: string;
  notes?: string;

  // Equipment assignments
  equipment_assignments?: {
    equipment_ids: number[];
    equipment_details: Array<{
      id: number;
      name: string;
      category: string;
      type: string;
      model?: string;
    }>;
  };
}

// Helper functions to convert between CoverageItem and CreateCoverageForm
const convertCoverageItemToForm = (item: CoverageItem): CreateCoverageForm => {
  // Parse subjects from the subject string (comma-separated IDs)
  let subjectIds: number[] = [];
  if (item.subject && item.subject.trim()) {
    // Check if it's a comma-separated string of IDs
    if (/^\d+(,\s*\d+)*$/.test(item.subject.trim())) {
      // It's comma-separated IDs, parse them
      subjectIds = item.subject.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }
    // If it's not IDs format, we'll leave subjects as empty array for now
  }

  return {
    name: item.name,
    description: item.description,
    coverage_type: item.coverage_type,
    subjects: subjectIds, // Parse existing subject IDs
    operator: item.operator || '',
    notes: item.notes || '',
    lens_focal_length: item.lens_focal_length || '',
    aperture: item.aperture || '',
    audio_pattern: item.audio_pattern || '',
    frequency_response: item.frequency_response || '',
    contributor_id: null, // Will be set from selectedContributor
    video_style_type: item.video_style_type || null, // Properly map video style type
    shot_size: '', // Auto-generated field
    shot_movement: '', // Auto-generated field
    shot_type: item.shot_type as ShotType,
    camera_movement: item.camera_movement as CameraMovement,
    audio_equipment: item.audio_equipment as AudioEquipment
  };
};

const convertFormToCoverageItem = (form: CreateCoverageForm, originalItem?: CoverageItem): CoverageItem => {
  return {
    id: originalItem?.id,
    name: form.name,
    description: form.description,
    coverage_type: form.coverage_type,
    subject: form.subjects.join(', '), // Convert subjects array to comma-separated string for now
    operator: form.operator,
    notes: form.notes,
    lens_focal_length: form.lens_focal_length,
    aperture: form.aperture,
    audio_pattern: form.audio_pattern,
    frequency_response: form.frequency_response,
    shot_type: form.shot_type,
    camera_movement: form.camera_movement,
    audio_equipment: form.audio_equipment,
    video_style_type: form.video_style_type || undefined, // Properly map video style type
    assignment_number: originalItem?.assignment_number,
    equipment_assignments: originalItem?.equipment_assignments // Preserve equipment data
  };
};

interface CreateCoverageForm {
  name: string;
  description: string;
  coverage_type: CoverageType;
  subjects: number[]; // Changed from subject: string to subjects: number[]
  operator: string;
  notes: string;
  lens_focal_length: string;
  aperture: string;
  audio_pattern: string;
  frequency_response: string;
  contributor_id: number | null;
  video_style_type: VideoStyleType | null;
  shot_size: string;
  shot_movement: string;
  shot_type: ShotType | undefined;
  camera_movement: CameraMovement | undefined;
  audio_equipment: AudioEquipment | undefined;
}

// Scene data interface
interface ScenesLibrary {
  id: number;
  name: string;
  description: string;
  media_type: "VIDEO" | "AUDIO" | "MUSIC";
  complexity_score: number;
  estimated_duration: number;
  default_coverage_duration?: number; // New field for default coverage length
  base_task_hours: string;
  is_coverage_linked: boolean;
  usage_count: number;
  performance_score: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export default function SceneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sceneId = params.id as string;

  const [scene, setScene] = useState<ScenesLibrary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverageItems, setCoverageItems] = useState<CoverageItem[]>([]);
  const [coverageLibrary, setCoverageLibrary] = useState<CoverageLibraryItem[]>([]);

  // Scene settings state
  const [defaultCoverageDuration, setDefaultCoverageDuration] = useState<number>(30); // Default 30 seconds
  const [moments, setMoments] = useState<SceneMoment[]>([]); // Track scene moments
  const [momentsDuration, setMomentsDuration] = useState<number>(0); // Track total moments duration
  const [musicCount, setMusicCount] = useState<number>(0); // Track music items count
  const [refreshKey, setRefreshKey] = useState<number>(0); // Used to force refresh moments when music changes
  const [sceneSubjects, setSceneSubjects] = useState<SceneSubjects[]>([]); // Track scene subjects

  // Extract SubjectsLibrary objects from scene subjects for use in coverage dialogs
  const sceneSubjectsLibrary: SubjectsLibrary[] = React.useMemo(() => {
    return sceneSubjects.map(sceneSubject => sceneSubject.subject);
  }, [sceneSubjects]);

  // Handler for when moments change
  const handleMomentsChange = (newMoments: SceneMoment[]) => {
    setMoments(newMoments);
    const totalDuration = getTotalMomentsDuration(newMoments);
    setMomentsDuration(totalDuration);
  };

  // Handler for when subjects change
  const handleSubjectsChange = useCallback((newSubjects: SceneSubjects[]) => {
    setSceneSubjects(newSubjects);
  }, []);

  // Handler for when music changes - refresh moments to show updated music attachments
  const handleMusicChange = (musicItems?: MusicItem[]) => {
    // Increment refresh key to force MomentsManagement to re-fetch data
    setRefreshKey(prev => prev + 1);

    // Update music count if provided
    if (musicItems) {
      setMusicCount(musicItems.length);
    }
  };

  // New coverage creation dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCoverageForm, setNewCoverageForm] = useState({
    name: '',
    description: '',
    coverage_type: 'VIDEO' as CoverageType,
    subjects: [] as number[], // Changed from subject: '' to subjects: number[]
    operator: '',
    notes: '',
    lens_focal_length: '',
    aperture: '',
    audio_pattern: '',
    frequency_response: '',
    contributor_id: null as number | null,
    video_style_type: null as VideoStyleType | null,
    shot_size: '',
    shot_movement: '',
    shot_type: undefined as ShotType | undefined,
    camera_movement: undefined as CameraMovement | undefined,
    audio_equipment: undefined as AudioEquipment | undefined
  });

  // Edit template dialog state (Step 2: Template customization)
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CoverageLibraryItem | null>(null);
  const [savingTemplateInstance, setSavingTemplateInstance] = useState(false);
  const [templateEditForm, setTemplateEditForm] = useState({
    name: '',
    subject: '', // Keep this for compatibility with TemplateEditForm type
    subjects: [] as number[], // Changed from subject: '' to subjects: number[]
    operator: '',
    notes: '',
    lens_focal_length: '',
    aperture: '',
    audio_pattern: '',
    frequency_response: '',
    // Step 3: Add contributor selection
    contributor_id: null as number | null,
    // Step 4: Add video style type selection
    video_style_type: null as VideoStyleType | null,
    // Shot size and movement for auto-generation
    shot_size: '',
    shot_movement: ''
  });

  // Step 3: Equipment and Contributor Selection State
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [availableContributors, setAvailableContributors] = useState<Contributor[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingContributors, setLoadingContributors] = useState(false);

  // Edit existing coverage item state
  const [editCoverageDialogOpen, setEditCoverageDialogOpen] = useState(false);
  const [editingCoverageItem, setEditingCoverageItem] = useState<CoverageItem | null>(null);
  const [editingCoverageIndex, setEditingCoverageIndex] = useState<number | null>(null);
  const [savingEditedCoverage, setSavingEditedCoverage] = useState(false);
  const [editCoverageForm, setEditCoverageForm] = useState<CreateCoverageForm>({
    name: '',
    description: '',
    coverage_type: 'VIDEO' as CoverageType,
    subjects: [] as number[], // Changed from subject: '' to subjects: number[]
    operator: '',
    notes: '',
    lens_focal_length: '',
    aperture: '',
    audio_pattern: '',
    frequency_response: '',
    contributor_id: null,
    video_style_type: null,
    shot_size: '',
    shot_movement: '',
    shot_type: undefined,
    camera_movement: undefined,
    audio_equipment: undefined
  });

  // Generate assignment number based on coverage type and existing items
  const generateAssignmentNumber = (coverageType: CoverageType, existingItems: CoverageItem[]): string => {
    const prefix = coverageType === 'VIDEO' ? 'V' : 'A';
    const existingNumbers = existingItems
      .filter(item => item.coverage_type === coverageType && item.assignment_number)
      .map(item => {
        const match = item.assignment_number?.match(/^[VA](\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${prefix}${nextNumber}`;
  };

  // Helper function to get all unique equipment from coverage items
  const getAllEquipment = (): Array<{ id: number; name: string; category: string; type: string; model?: string; assignedTo: string[] }> => {
    const equipmentMap = new Map();

    coverageItems.forEach(item => {
      if (item.equipment_assignments?.equipment_details) {
        item.equipment_assignments.equipment_details.forEach(equipment => {
          const key = equipment.id;
          if (equipmentMap.has(key)) {
            // Add this coverage item to the assigned list
            equipmentMap.get(key).assignedTo.push(item.assignment_number || item.name);
          } else {
            // First time seeing this equipment
            equipmentMap.set(key, {
              ...equipment,
              assignedTo: [item.assignment_number || item.name]
            });
          }
        });
      }
    });

    return Array.from(equipmentMap.values());
  };

  // Helper function to get all unique crew members from coverage items
  const getAllCrew = (): Array<{ name: string; assignedTo: string[] }> => {
    const crewMap = new Map();

    coverageItems.forEach(item => {
      if (item.operator && item.operator.trim()) {
        const operatorName = item.operator.trim();
        if (crewMap.has(operatorName)) {
          // Add this coverage item to the assigned list
          crewMap.get(operatorName).assignedTo.push(item.assignment_number || item.name);
        } else {
          // First time seeing this crew member
          crewMap.set(operatorName, {
            name: operatorName,
            assignedTo: [item.assignment_number || item.name]
          });
        }
      }
    });

    return Array.from(crewMap.values());
  };

  // Fetch scene details
  const fetchScene = async () => {
    try {
      const data = await api.scenes.getById(parseInt(sceneId));
      setScene(data);
      // Initialize default coverage duration from scene data or use default
      setDefaultCoverageDuration((data as ScenesLibrary & { default_coverage_duration?: number }).default_coverage_duration || 30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch scene");
    }
  };

  // Fetch existing coverage items for this scene
  const fetchSceneCoverage = async () => {
    try {
      // Use the proper scene-coverage relationship API
      const sceneCoverageData = await api.scenes.getSceneCoverage(parseInt(sceneId));

      // Convert Coverage items to CoverageItem format for the UI and generate assignment numbers
      const coverageItems: CoverageItem[] = sceneCoverageData.coverage_items.map((coverage, index) => {
        // Generate assignment number based on coverage type and position
        const sameTypeItems = sceneCoverageData.coverage_items
          .slice(0, index)
          .filter(item => item.coverage_type === coverage.coverage_type);
        const assignmentNumber = `${coverage.coverage_type === 'VIDEO' ? 'V' : 'A'}${sameTypeItems.length + 1}`;

        // Get operator name from operator relationship or fallback to stored string
        let operatorName = '';
        if (coverage.operator?.contact) {
          operatorName = `${coverage.operator.contact.first_name} ${coverage.operator.contact.last_name}`;
        } else if (coverage.operator?.contact?.first_name) {
          operatorName = coverage.operator.contact.first_name + ' ' + (coverage.operator.contact.last_name || '');
        }

        console.log('🔍 Processing coverage item:', {
          id: coverage.id,
          name: coverage.name,
          operator_id: coverage.operator_id,
          operator_relationship: coverage.operator,
          calculated_operator_name: operatorName,
          equipment_assignments: coverage.equipment_assignments
        });

        return {
          id: coverage.id,
          coverage_type: coverage.coverage_type,
          name: coverage.name,
          description: coverage.description || '',
          assignment_number: assignmentNumber,
          shot_type: coverage.shot_type,
          camera_movement: coverage.camera_movement,
          lens_focal_length: coverage.lens_focal_length,
          aperture: coverage.aperture,
          video_style_type: coverage.video_style_type, // Include video style type
          audio_equipment: coverage.audio_equipment,
          audio_pattern: coverage.audio_pattern,
          frequency_response: coverage.frequency_response,
          subject: coverage.subject,
          operator: operatorName,
          notes: coverage.notes || '',
          equipment_assignments: coverage.equipment_assignments as {
            equipment_ids: number[];
            equipment_details: Array<{
              id: number;
              name: string;
              category: string;
              type: string;
              model?: string;
            }>;
          } | undefined
        };
      });

      setCoverageItems(coverageItems);
    } catch (err) {
      console.error('Error fetching scene coverage:', err);
      // Don't show error to user, just keep empty array
      setCoverageItems([]);
    }
  };

  // Fetch coverage library
  const fetchCoverageLibrary = async () => {
    try {
      // Fetch from the actual coverage library endpoint
      const libraryItems = await api.coverage.getAll();
      setCoverageLibrary(libraryItems);
    } catch (err) {
      console.error('Error fetching coverage library:', err);
      // Fallback to empty array if API fails
      setCoverageLibrary([]);
    }
  };

  // Fetch scene subjects
  const fetchSceneSubjects = async () => {
    try {
      const subjects = await api.subjects.getByScene(parseInt(sceneId));
      setSceneSubjects(subjects);
    } catch (err) {
      console.error('Error fetching scene subjects:', err);
      // Fallback to empty array if API fails
      setSceneSubjects([]);
    }
  };

  // Step 3: Fetch equipment and contributors for template customization
  const fetchEquipmentAndContributors = async () => {
    console.log('🚨 fetchEquipmentAndContributors called - starting API calls');
    setLoadingEquipment(true);
    setLoadingContributors(true);
    try {
      // Fetch equipment and contributors in parallel
      console.log('🔍 Making API calls to equipment and contributors endpoints...');
      const [equipmentData, contributorsData] = await Promise.all([
        api.equipment.getAll(),
        api.contributors.getAll()
      ]);

      console.log('✅ API calls successful:', {
        equipmentCount: equipmentData.length,
        contributorsCount: contributorsData.length,
        equipment: equipmentData,
        contributors: contributorsData
      });

      // Log detailed contributor job roles data
      console.log('🔍 DETAILED CONTRIBUTORS DATA:', contributorsData.map(c => ({
        id: c.id,
        name: `${c.contact?.first_name} ${c.contact?.last_name}`,
        hasJobRoles: !!c.contributor_job_roles,
        jobRolesCount: c.contributor_job_roles?.length || 0,
        jobRoles: c.contributor_job_roles?.map(cjr => ({
          id: cjr.id,
          jobRoleName: cjr.job_role?.name,
          jobRoleId: cjr.job_role_id,
          fullJobRole: cjr.job_role
        })),
        fullContributor: c
      })));

      // Log subjects data
      console.log('🔍 SUBJECTS DATA:', sceneSubjectsLibrary.map(s => ({
        id: s.id,
        name: `${s.first_name} ${s.last_name || ''}`,
        role: s.context_role,
        brand_id: s.brand_id
      })));

      setAvailableEquipment(equipmentData);
      setAvailableContributors(contributorsData);
    } catch (err) {
      console.error('❌ Error fetching equipment/contributors:', err);
      // Set empty arrays on error
      setAvailableEquipment([]);
      setAvailableContributors([]);
    } finally {
      setLoadingEquipment(false);
      setLoadingContributors(false);
      console.log('🏁 fetchEquipmentAndContributors completed');
    }
  };

  // Filter equipment by coverage type
  const getRelevantEquipment = (coverageType: CoverageType): Equipment[] => {
    // Get all equipment IDs that are already assigned to coverage items in this scene
    const assignedEquipmentIds = new Set<number>();
    coverageItems.forEach(item => {
      if (item.equipment_assignments?.equipment_ids) {
        item.equipment_assignments.equipment_ids.forEach(id => {
          assignedEquipmentIds.add(id);
        });
      }
    });

    // If we're editing an existing coverage item, exclude its current equipment from the "already assigned" list
    // so the user can keep the same equipment or change it
    if (editingCoverageItem?.equipment_assignments?.equipment_ids) {
      editingCoverageItem.equipment_assignments.equipment_ids.forEach(id => {
        assignedEquipmentIds.delete(id);
      });
    }

    return availableEquipment.filter(equipment => {
      // First check if equipment is already assigned to another coverage item
      if (assignedEquipmentIds.has(equipment.id)) {
        return false;
      }

      // Then check if equipment category matches coverage type
      if (coverageType === 'VIDEO') {
        // Video coverage: cameras, lenses, grips, lighting
        return ['CAMERA', 'LENS', 'GRIP', 'LIGHTING', 'ACCESSORIES'].includes(equipment.category);
      } else if (coverageType === 'AUDIO') {
        // Audio coverage: audio equipment
        return equipment.category === 'AUDIO';
      }
      return false;
    });
  };

  // Helper function to get which coverage item an equipment is assigned to
  const getEquipmentAssignment = (equipmentId: number): string | null => {
    for (const item of coverageItems) {
      if (item.equipment_assignments?.equipment_ids?.includes(equipmentId)) {
        return item.assignment_number || item.name;
      }
    }
    return null;
  };

  // Filter contributors by relevant job roles for coverage type
  const getRelevantContributors = React.useCallback((coverageType: CoverageType): Contributor[] => {
    console.log('🔍 getRelevantContributors called with:', {
      coverageType,
      totalContributors: availableContributors.length,
      contributors: availableContributors.map(c => ({
        id: c.id,
        name: `${c.contact?.first_name} ${c.contact?.last_name}`,
        jobRoles: c.contributor_job_roles?.map(cjr => cjr.job_role.name),
        systemRole: c.role?.name,
        fullObject: c
      }))
    });

    const filtered = availableContributors.filter(contributor => {
      console.log('🔍 Processing contributor:', {
        id: contributor.id,
        name: `${contributor.contact?.first_name} ${contributor.contact?.last_name}`,
        jobRoles: contributor.contributor_job_roles?.map(cjr => cjr.job_role.name),
        systemRole: contributor.role?.name,
        fullObject: contributor
      });

      if (!contributor.contributor_job_roles || contributor.contributor_job_roles.length === 0) {
        console.log('⚠️ Contributor has no job roles:', contributor.id, `${contributor.contact?.first_name} ${contributor.contact?.last_name}`);
        return false;
      }

      // Check if contributor has any relevant job roles
      const hasRelevantJobRole = contributor.contributor_job_roles.some(contributorJobRole => {
        const jobRoleName = contributorJobRole.job_role.name.toLowerCase();
        console.log('🔍 Job role name to check:', jobRoleName);

        if (coverageType === 'VIDEO') {
          // For video coverage, only show Videographers
          const isVideographer = jobRoleName.includes('videographer') || jobRoleName.includes('camera') || jobRoleName.includes('video');
          console.log('🎥 Video filter:', contributorJobRole.job_role.name, '→', isVideographer);
          return isVideographer;
        } else if (coverageType === 'AUDIO') {
          // For audio coverage, only show Sound Engineers
          const isSoundEngineer = jobRoleName.includes('sound') || jobRoleName.includes('audio') || jobRoleName.includes('engineer');
          console.log('🎤 Audio filter:', contributorJobRole.job_role.name, '→', isSoundEngineer);
          return isSoundEngineer;
        }

        return false;
      });

      console.log('🔍 Has relevant job role:', hasRelevantJobRole);
      return hasRelevantJobRole;
    });

    console.log('✅ Filtered contributors:', {
      coverageType,
      totalFiltered: filtered.length,
      filteredContributors: filtered.map(c => ({
        id: c.id,
        name: `${c.contact?.first_name} ${c.contact?.last_name}`,
        jobRoles: c.contributor_job_roles?.map(cjr => cjr.job_role.name)
      }))
    });

    return filtered;
  }, [availableContributors]);

  // Remove coverage item from scene
  const handleRemoveCoverage = async (coverageItem: CoverageItem, index: number) => {
    try {
      if (coverageItem.id) {
        // Remove the relationship from the database
        await api.scenes.removeCoverageFromScene(parseInt(sceneId), coverageItem.id);
      }

      // Remove from local state
      setCoverageItems(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing coverage:', error);
      alert('Failed to remove coverage item');
    }
  };

  // Edit coverage item
  const handleEditCoverage = (coverageItem: CoverageItem, index: number) => {
    setEditingCoverageItem(coverageItem);
    setEditingCoverageIndex(index);
    setEditCoverageForm(convertCoverageItemToForm(coverageItem));

    // Initialize selected equipment from the coverage item
    if (coverageItem.equipment_assignments?.equipment_details) {
      const equipment = coverageItem.equipment_assignments.equipment_details.map(eq => ({
        id: eq.id,
        item_name: eq.name,
        category: eq.category as EquipmentCategory,
        type: eq.type as EquipmentType,
        brand_name: eq.model || '',
        model: eq.model || '',
        description: '',
        quantity: 1,
        condition: EquipmentCondition.GOOD,
        availability_status: EquipmentAvailability.AVAILABLE,
        vendor: '',
        location: '',
        is_active: true,
        created_at: '',
        updated_at: ''
      }));
      setSelectedEquipment(equipment);
    } else {
      setSelectedEquipment([]);
    }

    // Initialize selected contributor from the coverage item operator
    if (coverageItem.operator && coverageItem.operator.trim()) {
      // Find the contributor by matching the operator name
      const contributor = availableContributors.find(c =>
        `${c.contact?.first_name} ${c.contact?.last_name}`.trim() === coverageItem.operator?.trim()
      );
      setSelectedContributor(contributor || null);
    } else {
      setSelectedContributor(null);
    }

    setEditCoverageDialogOpen(true);
  };

  // Save edited coverage item
  const handleSaveEditedCoverage = async () => {
    if (editingCoverageIndex === null || !editingCoverageItem) return;

    setSavingEditedCoverage(true);
    try {
      const updatedCoverage = convertFormToCoverageItem(editCoverageForm, editingCoverageItem);

      if (updatedCoverage.id) {
        // Prepare equipment assignments data
        const equipmentAssignments = selectedEquipment.length > 0 ? {
          equipment_ids: selectedEquipment.map(eq => eq.id),
          equipment_details: selectedEquipment.map(eq => ({
            id: eq.id,
            name: eq.item_name,
            category: eq.category,
            type: eq.type,
            model: eq.model
          }))
        } : undefined;

        // Update existing coverage item in the database
        const coverageDto: UpdateCoverageDto = {
          name: updatedCoverage.name,
          description: updatedCoverage.description,
          coverage_type: updatedCoverage.coverage_type,
          shot_type: updatedCoverage.shot_type as ShotType,
          camera_movement: updatedCoverage.camera_movement as CameraMovement,
          lens_focal_length: updatedCoverage.lens_focal_length,
          aperture: updatedCoverage.aperture,
          video_style_type: updatedCoverage.video_style_type, // Include video style type
          audio_equipment: updatedCoverage.audio_equipment as AudioEquipment,
          audio_pattern: updatedCoverage.audio_pattern,
          frequency_response: updatedCoverage.frequency_response,
          subject: editCoverageForm.subjects.join(', ') || undefined, // Convert subjects array to comma-separated string
          notes: updatedCoverage.notes,
          operator_id: selectedContributor?.id || undefined,
          equipment_assignments: equipmentAssignments
        };

        console.log('🚀 Updating coverage with data:', {
          id: updatedCoverage.id,
          operator_id: coverageDto.operator_id,
          operator_name: selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : 'None',
          equipment_count: selectedEquipment.length,
          equipment_details: equipmentAssignments
        });

        await api.coverage.update(updatedCoverage.id.toString(), coverageDto);

        // Update the operator name in the local state
        const operatorName = selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : '';
        updatedCoverage.operator = operatorName;
      }

      // Update local state
      setCoverageItems(prev =>
        prev.map((item, index) =>
          index === editingCoverageIndex ? updatedCoverage : item
        )
      );

      // Close edit dialog
      setEditCoverageDialogOpen(false);
      setEditingCoverageItem(null);
      setEditingCoverageIndex(null);
      // Clear selected state after successful save
      setSelectedEquipment([]);
      setSelectedContributor(null);

    } catch (error) {
      console.error('Error updating coverage:', error);
      alert('Failed to update coverage item');
    } finally {
      setSavingEditedCoverage(false);
    }
  };

  // Handle new coverage creation
  const handleCreateCoverage = async () => {
    if (!newCoverageForm.name.trim()) {
      alert('Please enter a coverage name');
      return;
    }

    setCreating(true);
    try {
      // Generate a unique name by adding timestamp if needed
      const baseName = newCoverageForm.name.trim();
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS format
      const uniqueName = `${baseName} ${timestamp}`;

      // Prepare equipment assignments data
      const equipmentAssignments = selectedEquipment.length > 0 ? {
        equipment_ids: selectedEquipment.map(eq => eq.id),
        equipment_details: selectedEquipment.map(eq => ({
          id: eq.id,
          name: eq.item_name,
          category: eq.category,
          type: eq.type,
          model: eq.model
        }))
      } : undefined;

      // Create the coverage item
      const coverageDto: CreateCoverageDto = {
        name: uniqueName,
        description: newCoverageForm.description.trim(),
        coverage_type: newCoverageForm.coverage_type,
        shot_type: newCoverageForm.shot_type,
        camera_movement: newCoverageForm.camera_movement,
        lens_focal_length: newCoverageForm.lens_focal_length.trim() || undefined,
        aperture: newCoverageForm.aperture.trim() || undefined,
        video_style_type: newCoverageForm.video_style_type || undefined, // Include video style type
        audio_equipment: newCoverageForm.audio_equipment,
        audio_pattern: newCoverageForm.audio_pattern.trim() || undefined,
        frequency_response: newCoverageForm.frequency_response.trim() || undefined,
        subject: newCoverageForm.subjects.join(', ') || undefined, // Convert subjects array to comma-separated string
        notes: newCoverageForm.notes.trim() || undefined,
        operator_id: selectedContributor?.id || undefined,
        equipment_assignments: equipmentAssignments
      };

      console.log('🚀 Creating coverage with data:', {
        name: coverageDto.name,
        operator_id: coverageDto.operator_id,
        operator_name: selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : 'None',
        equipment_count: selectedEquipment.length,
        equipment_details: equipmentAssignments,
        full_dto: coverageDto
      });

      const createdCoverage = await api.coverage.create(coverageDto);

      console.log('✅ Coverage created successfully:', {
        id: createdCoverage.id,
        name: createdCoverage.name,
        equipment_assignments: createdCoverage.equipment_assignments
      });

      // Add the relationship to the scene
      await api.scenes.addCoverageToScene(parseInt(sceneId), [createdCoverage.id]);

      // Convert to CoverageItem format and add to local state with assignment number
      const assignmentNumber = generateAssignmentNumber(createdCoverage.coverage_type, coverageItems);
      const operatorName = selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : '';

      const newCoverageItem: CoverageItem = {
        id: createdCoverage.id,
        coverage_type: createdCoverage.coverage_type,
        name: createdCoverage.name,
        description: createdCoverage.description || '',
        assignment_number: assignmentNumber,
        subject: createdCoverage.subject || '',
        operator: operatorName,
        shot_type: createdCoverage.shot_type,
        camera_movement: createdCoverage.camera_movement,
        lens_focal_length: createdCoverage.lens_focal_length || '',
        video_style_type: createdCoverage.video_style_type, // Include video style type
        audio_equipment: createdCoverage.audio_equipment,
        audio_pattern: createdCoverage.audio_pattern || '',
        frequency_response: createdCoverage.frequency_response || '',
        equipment_assignments: equipmentAssignments
      };

      setCoverageItems(prev => [...prev, newCoverageItem]);

      // Reset form and close dialog
      setNewCoverageForm({
        name: '',
        description: '',
        coverage_type: 'VIDEO' as CoverageType,
        subjects: [], // Reset to empty array
        operator: '',
        notes: '',
        lens_focal_length: '',
        aperture: '',
        audio_pattern: '',
        frequency_response: '',
        contributor_id: null,
        video_style_type: null,
        shot_size: '',
        shot_movement: '',
        shot_type: undefined,
        camera_movement: undefined,
        audio_equipment: undefined
      });
      setSelectedEquipment([]);
      setSelectedContributor(null);
      setCreateDialogOpen(false);

      alert('Coverage item created and added to scene successfully!');
    } catch (error) {
      console.error('Error creating coverage:', error);
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        errorMessage = `A coverage item with this name already exists. Please try a different name or wait a moment and try again.`;
      }

      alert(`Failed to create coverage: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };
  // Handle saving customized template instance (Step 2: Template-to-Instance conversion)
  const handleSaveTemplateInstance = async () => {
    if (!editingTemplate || !templateEditForm.name.trim()) {
      alert('Please enter a name for this coverage item');
      return;
    }

    setSavingTemplateInstance(true);
    try {
      // Generate a unique name by adding timestamp if needed
      const baseName = templateEditForm.name.trim();
      const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-'); // HH-MM-SS format
      const uniqueName = `${baseName} ${timestamp}`;

      // Prepare equipment assignments data
      const equipmentAssignments = selectedEquipment.length > 0 ? {
        equipment_ids: selectedEquipment.map(eq => eq.id),
        equipment_details: selectedEquipment.map(eq => ({
          id: eq.id,
          name: eq.item_name,
          category: eq.category,
          type: eq.type,
          model: eq.model
        }))
      } : undefined;

      // Create a new coverage instance based on the template but with customizations
      const coverageDto: CreateCoverageDto = {
        name: uniqueName,
        description: editingTemplate.description || '',
        coverage_type: editingTemplate.coverage_type,
        shot_type: editingTemplate.shot_type,
        camera_movement: editingTemplate.camera_movement,
        lens_focal_length: templateEditForm.lens_focal_length.trim() || editingTemplate.lens_focal_length || undefined,
        aperture: templateEditForm.aperture.trim() || editingTemplate.aperture || undefined,
        audio_equipment: editingTemplate.audio_equipment,
        audio_pattern: templateEditForm.audio_pattern.trim() || editingTemplate.audio_pattern || undefined,
        frequency_response: templateEditForm.frequency_response.trim() || editingTemplate.frequency_response || undefined,
        subject: templateEditForm.subjects.length > 0 ? templateEditForm.subjects[0].toString() : undefined,
        notes: templateEditForm.notes.trim() || undefined,
        video_style_type: templateEditForm.video_style_type || editingTemplate.video_style_type || undefined,
        operator_id: selectedContributor?.id || undefined,
        equipment_assignments: equipmentAssignments
        // Note: is_template will default to false for instances
      };

      console.log('🚀 Creating template instance with data:', {
        name: coverageDto.name,
        operator_id: coverageDto.operator_id,
        operator_name: selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : 'None',
        equipment_count: selectedEquipment.length,
        equipment_details: equipmentAssignments,
        full_dto: coverageDto
      });

      const createdCoverage = await api.coverage.create(coverageDto);

      console.log('✅ Template instance created successfully:', {
        id: createdCoverage.id,
        name: createdCoverage.name,
        equipment_assignments: createdCoverage.equipment_assignments
      });

      // Add the relationship to the scene
      await api.scenes.addCoverageToScene(parseInt(sceneId), [createdCoverage.id]);

      // Convert to CoverageItem format and add to local state with assignment number
      const assignmentNumber = generateAssignmentNumber(createdCoverage.coverage_type, coverageItems);
      const operatorName = selectedContributor ? `${selectedContributor.contact?.first_name} ${selectedContributor.contact?.last_name}` : templateEditForm.operator || '';

      const newCoverageItem: CoverageItem = {
        id: createdCoverage.id,
        coverage_type: createdCoverage.coverage_type,
        name: createdCoverage.name,
        description: createdCoverage.description || '',
        assignment_number: assignmentNumber,
        subject: createdCoverage.subject || '',
        operator: operatorName,
        shot_type: createdCoverage.shot_type,
        camera_movement: createdCoverage.camera_movement,
        lens_focal_length: createdCoverage.lens_focal_length || '',
        aperture: createdCoverage.aperture || '',
        video_style_type: createdCoverage.video_style_type, // Include video style type
        audio_equipment: createdCoverage.audio_equipment,
        audio_pattern: createdCoverage.audio_pattern || '',
        frequency_response: createdCoverage.frequency_response || '',
        notes: createdCoverage.notes || '',
        equipment_assignments: equipmentAssignments
      };

      setCoverageItems(prev => [...prev, newCoverageItem]);

      // Reset form and close dialog
      setTemplateEditForm({
        name: '',
        subject: '', // Keep for compatibility
        subjects: [], // Reset to empty array
        operator: '',
        notes: '',
        lens_focal_length: '',
        aperture: '',
        audio_pattern: '',
        frequency_response: '',
        contributor_id: null,
        video_style_type: null,
        shot_size: '',
        shot_movement: ''
      });
      setEditingTemplate(null);
      setSelectedEquipment([]);
      setSelectedContributor(null);
      setEditTemplateDialogOpen(false);

      alert(`Coverage "${createdCoverage.name}" created and added to scene successfully!`);
    } catch (error) {
      console.error('Error creating coverage instance:', error);
      let errorMessage = 'Unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        errorMessage = `A coverage item with this name already exists. Please try a different name or wait a moment and try again.`;
      }

      alert(`Failed to create coverage: ${errorMessage}`);
    } finally {
      setSavingTemplateInstance(false);
    }
  };

  // Load scene data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchScene();
      await fetchCoverageLibrary();
      await fetchSceneSubjects();
      // Load existing coverage items for this scene after scene data is loaded
      await fetchSceneCoverage();
      // 🚨 FIX: Load equipment and contributors data needed for CreateCoverageDialog
      await fetchEquipmentAndContributors();
      setLoading(false);
    };

    if (sceneId) {
      loadData();
    }
  }, [sceneId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !scene) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Scene not found"}</Alert>
        <Button variant="outlined" onClick={() => router.back()} sx={{ mt: 2 }}>
          Back to Scenes
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/scenes" passHref legacyBehavior>
          <MuiLink underline="hover" color="inherit">
            Scenes
          </MuiLink>
        </Link>
        <Typography color="text.primary">{scene.name}</Typography>
      </Breadcrumbs>

      {/* Scene Title */}
      <Typography variant="h4" component="h1" gutterBottom>
        {scene.name}
      </Typography>

      {/* Scene Description Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Scene Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {scene.description || 'No description provided for this scene.'}
          </Typography>
        </CardContent>
      </Card>

      {/* Stats Cards Row - Now includes Location and Shoot Time */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Duration Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <TimeIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Duration</Typography>
              </Box>
              <Typography variant="h4" color="primary.main">
                {moments.length > 0 ? formatDuration(momentsDuration) : `${defaultCoverageDuration}s`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {moments.length > 0 ? 'From moments' : 'Default coverage'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Moments Count Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <MovieIcon sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="h6">Moments</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">
                {moments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Scene moments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Music Count Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <MusicIcon sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="h6">Music</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">
                {musicCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Music tracks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Subjects Count Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <SubjectsIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Subjects</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {sceneSubjects.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Location Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <LocationIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Location</Typography>
              </Box>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                  textAlign: 'center',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Not set
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Shoot Time Card */}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Shoot Time</Typography>
              </Box>
              <Paper
                sx={{
                  p: 1,
                  bgcolor: 'grey.50',
                  border: '1px dashed',
                  borderColor: 'grey.300',
                  textAlign: 'center',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Not scheduled
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Moments Management Section */}
      <MomentsManagement
        sceneId={parseInt(sceneId)}
        projectId={undefined} // Can be added later if we need project-specific moment templates
        availableSubjects={sceneSubjectsLibrary} // Pass only scene subjects for display in moments
        onMomentsChange={handleMomentsChange}
        key={`moments-${refreshKey}`}
      />

      {/* Two Column Layout - Tables on Left, Panels on Right */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left Content Area (4/5 width) - Tables */}
        <Box sx={{ flex: '4' }}>
          {/* Video Coverage Section */}
          <VideoCoverageTable
            coverageItems={coverageItems}
            availableSubjects={sceneSubjectsLibrary}
            onAddCoverage={() => {
              setNewCoverageForm(prev => ({ ...prev, coverage_type: 'VIDEO' }));
              // Clear selected state when opening create dialog
              setSelectedEquipment([]);
              setSelectedContributor(null);
              setCreateDialogOpen(true);
            }}
            onEditCoverage={handleEditCoverage}
            onRemoveCoverage={handleRemoveCoverage}
          />

          {/* Audio Coverage Section */}
          <AudioCoverageTable
            coverageItems={coverageItems}
            availableSubjects={sceneSubjectsLibrary}
            onAddCoverage={() => {
              setNewCoverageForm(prev => ({ ...prev, coverage_type: 'AUDIO' }));
              // Clear selected state when opening create dialog
              setSelectedEquipment([]);
              setSelectedContributor(null);
              setCreateDialogOpen(true);
            }}
            onEditCoverage={handleEditCoverage}
            onRemoveCoverage={handleRemoveCoverage}
          />

          {/* Music Management Section */}
          <MusicManagement
            sceneId={parseInt(sceneId)}
            projectId={undefined} // Can be added later if we need project-specific music templates
            moments={moments}
            onMusicChange={handleMusicChange}
          />

          {/* Subjects Management Section */}
          <SubjectsManagement
            sceneId={parseInt(sceneId)}
            onSubjectsChange={handleSubjectsChange}
          />
        </Box>

        {/* Right Panel (1/5 width) - Equipment and Crew Only */}
        <Box sx={{ flex: '1', minWidth: '250px' }}>
          {/* Equipment */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EquipmentIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Equipment</Typography>
              </Box>
              {getAllEquipment().length > 0 ? (
                <List dense>
                  {getAllEquipment().map((equipment, index) => (
                    <ListItem key={`${equipment.id}-${index}`} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {equipment.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {equipment.category} • {equipment.type}
                              {equipment.model && ` • ${equipment.model}`}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {equipment.assignedTo.map((assignment, idx) => (
                                <Chip
                                  key={idx}
                                  label={assignment}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No equipment assigned
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Crew Assignments */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CrewIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Crew Assignments</Typography>
              </Box>
              {getAllCrew().length > 0 ? (
                <List dense>
                  {getAllCrew().map((crewMember, index) => (
                    <ListItem key={`${crewMember.name}-${index}`} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {crewMember.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {crewMember.assignedTo.map((assignment, idx) => (
                              <Chip
                                key={idx}
                                label={assignment}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                                color="warning"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No crew assigned
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Create New Coverage Dialog */}
      <CreateCoverageDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          // Clear selected state when closing create dialog
          setSelectedEquipment([]);
          setSelectedContributor(null);
        }}
        coverageForm={newCoverageForm}
        setCoverageForm={setNewCoverageForm}
        creating={creating}
        onCreate={handleCreateCoverage}
        availableEquipment={availableEquipment}
        selectedEquipment={selectedEquipment}
        setSelectedEquipment={setSelectedEquipment}
        loadingEquipment={loadingEquipment}
        availableContributors={availableContributors}
        selectedContributor={selectedContributor}
        setSelectedContributor={setSelectedContributor}
        loadingContributors={loadingContributors}
        availableSubjects={sceneSubjectsLibrary}
        loadingSubjects={false} // Scene subjects are loaded with scene data, no separate loading
        getRelevantEquipment={getRelevantEquipment}
        getRelevantContributors={getRelevantContributors}
        getEquipmentAssignment={getEquipmentAssignment}
        availableTemplates={coverageLibrary}
      />

      {/* Edit Coverage Dialog */}
      {editingCoverageItem && (
        <CreateCoverageDialog
          open={editCoverageDialogOpen}
          onClose={() => {
            setEditCoverageDialogOpen(false);
            setEditingCoverageItem(null);
            setEditingCoverageIndex(null);
            // Clear selected state to prevent carryover
            setSelectedEquipment([]);
            setSelectedContributor(null);
          }}
          coverageForm={editCoverageForm}
          setCoverageForm={setEditCoverageForm}
          creating={savingEditedCoverage}
          onCreate={handleSaveEditedCoverage}
          availableEquipment={availableEquipment}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
          loadingEquipment={loadingEquipment}
          availableContributors={availableContributors}
          selectedContributor={selectedContributor}
          setSelectedContributor={setSelectedContributor}
          loadingContributors={loadingContributors}
          availableSubjects={sceneSubjectsLibrary}
          loadingSubjects={false} // Scene subjects are loaded with scene data, no separate loading
          getRelevantEquipment={getRelevantEquipment}
          getRelevantContributors={getRelevantContributors}
          getEquipmentAssignment={getEquipmentAssignment}
          isEditing={true}
          availableTemplates={coverageLibrary}
        />
      )}

      {/* Edit Template Dialog (Step 2: Template Customization) */}
      <TemplateCustomizationDialog
        open={editTemplateDialogOpen}
        onClose={() => setEditTemplateDialogOpen(false)}
        editingTemplate={editingTemplate}
        templateEditForm={templateEditForm}
        setTemplateEditForm={setTemplateEditForm}
        savingTemplateInstance={savingTemplateInstance}
        onSave={handleSaveTemplateInstance}
        availableEquipment={availableEquipment}
        selectedEquipment={selectedEquipment}
        setSelectedEquipment={setSelectedEquipment}
        loadingEquipment={loadingEquipment}
        availableContributors={availableContributors}
        selectedContributor={selectedContributor}
        setSelectedContributor={setSelectedContributor}
        loadingContributors={loadingContributors}
        getRelevantEquipment={getRelevantEquipment}
        getRelevantContributors={getRelevantContributors}
        getEquipmentAssignment={getEquipmentAssignment}
      />
    </Box>
  );
}
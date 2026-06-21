import { useCallback } from 'react';
import { useCreateDayBlueprintVersion } from './authoring';
import type { CreateDayBlueprintVersionInput } from '../api/authoring';

type ExistingDraftConflict = {
  existing_draft_version_id?: number;
  existing_draft_version_number?: number;
};

function parseExistingDraftConflict(error: unknown): ExistingDraftConflict | null {
  const message = error instanceof Error ? error.message : '';
  if (!message) return null;
  try {
    const body = JSON.parse(message) as {
      message?: string | ExistingDraftConflict;
      existing_draft_version_id?: number;
      existing_draft_version_number?: number;
    };
    const inner =
      typeof body.message === 'object' && body.message !== null ? body.message : body;
    return inner.existing_draft_version_id ? inner : null;
  } catch {
    return null;
  }
}

export function useBranchDayBlueprintDraft(blueprintId: number) {
  const createVersion = useCreateDayBlueprintVersion(blueprintId);

  const branchToDraft = useCallback(
    async (input: CreateDayBlueprintVersionInput & { sourceVersionId?: number }) => {
      const payload: CreateDayBlueprintVersionInput = {
        change_summary: input.change_summary,
        source_version_id: input.source_version_id ?? input.sourceVersionId,
        replace_existing_draft: input.replace_existing_draft,
      };

      try {
        return await createVersion.mutateAsync(payload);
      } catch (error) {
        const existing = parseExistingDraftConflict(error);
        if (existing?.existing_draft_version_id) {
          const continueDraft = window.confirm(
            `Draft v${existing.existing_draft_version_number ?? '?'} already exists. Use that draft instead of creating a new branch?`,
          );
          if (continueDraft) {
            return { id: existing.existing_draft_version_id };
          }

          const replace = window.confirm(
            'Discard the existing draft and create a new one from this version? This cannot be undone.',
          );
          if (!replace) return null;

          return await createVersion.mutateAsync({
            ...payload,
            replace_existing_draft: true,
          });
        }
        throw error;
      }
    },
    [createVersion],
  );

  return {
    branchToDraft,
    isBranching: createVersion.isPending,
  };
}

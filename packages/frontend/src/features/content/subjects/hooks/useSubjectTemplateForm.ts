import { useState, useCallback } from "react";
import { rolesApi } from "../api/roles.api";
import type { SubjectRole } from "../types";

interface SubjectTemplate {
    id: number;
    name: string;
    description?: string;
    category: string;
    is_active: boolean;
    roles: SubjectRole[];
}

interface FormData {
    name: string;
    description: string;
    category: string;
}

const DEFAULT_FORM: FormData = { name: "", description: "", category: "PEOPLE" };
const DEFAULT_ROLE: Partial<SubjectRole> = { role_name: "", is_core: false, is_group: false, order_index: 0 };

/**
 * Manages create/edit dialog state for subject role templates.
 * The screen retains only the table data (templates, loading, error) and
 * calls `onSaved` to reload after a successful save.
 */
export function useSubjectTemplateForm(onSaved: () => Promise<void>) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SubjectTemplate | null>(null);
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
    const [roles, setRoles] = useState<Partial<SubjectRole>[]>([{ ...DEFAULT_ROLE }]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const openCreate = useCallback(() => {
        setEditingTemplate(null);
        setFormData(DEFAULT_FORM);
        setRoles([{ ...DEFAULT_ROLE }]);
        setFormError(null);
        setOpenDialog(true);
    }, []);

    const openEdit = useCallback((template: SubjectTemplate) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || "",
            category: template.category,
        });
        setRoles(template.roles);
        setFormError(null);
        setOpenDialog(true);
    }, []);

    const close = useCallback(() => {
        setOpenDialog(false);
        setEditingTemplate(null);
        setFormData(DEFAULT_FORM);
        setRoles([{ ...DEFAULT_ROLE }]);
        setFormError(null);
    }, []);

    const addRole = useCallback(() => {
        setRoles(prev => [...prev, { ...DEFAULT_ROLE, order_index: prev.length }]);
    }, []);

    const removeRole = useCallback((index: number) => {
        setRoles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const changeRole = useCallback((index: number, field: string, value: string | boolean | number) => {
        setRoles(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }, []);

    const save = useCallback(async (brandId: number) => {
        if (!formData.name.trim()) {
            setFormError("Template name is required");
            return;
        }
        const validRoles = roles.filter(r => r.role_name?.trim());
        if (validRoles.length === 0) {
            setFormError("At least one role is required");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            if (editingTemplate) {
                await rolesApi.updateRole(editingTemplate.id, {
                    role_name: formData.name,
                    description: formData.description,
                });
            } else {
                await rolesApi.createRole(brandId, {
                    role_name: formData.name,
                    description: formData.description,
                    roles: validRoles.map((r, idx) => ({
                        role_name: r.role_name!,
                        description: r.description,
                        is_core: r.is_core,
                        is_group: r.is_group,
                        order_index: idx,
                    })),
                });
            }
            await onSaved();
            close();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Failed to save template");
        } finally {
            setSaving(false);
        }
    }, [formData, roles, editingTemplate, close, onSaved]);

    return {
        openDialog,
        editingTemplate,
        formData,
        setFormData,
        roles,
        saving,
        formError,
        setFormError,
        openCreate,
        openEdit,
        close,
        addRole,
        removeRole,
        changeRole,
        save,
    };
}

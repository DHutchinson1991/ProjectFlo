"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { contentAPI, componentAPI } from "../../_shared/api";
import { ComponentLibrary, ContentType } from "../../_shared/types";

interface ComponentWithOrder {
  component_id: number;
  order_index: number;
  component: ComponentLibrary;
}

interface ContentBuilder {
  name: string;
  description: string;
  type: ContentType;
  includes_music: boolean;
  delivery_timeline: number;
  components: ComponentWithOrder[];
}

export default function NewContentTemplatePage() {
  const router = useRouter();
  const [builder, setBuilder] = useState<ContentBuilder>({
    name: "",
    description: "",
    type: "STANDARD",
    includes_music: false,
    delivery_timeline: 14,
    components: [],
  });
  const [availableComponents, setAvailableComponents] = useState<
    ComponentLibrary[]
  >([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailableComponents();
  }, []);

  const loadAvailableComponents = async () => {
    try {
      const components = await componentAPI.getAll();
      setAvailableComponents(components);
    } catch (error) {
      console.error("Error loading components:", error);
    }
  };

  const handleAddComponent = (componentId: number) => {
    const component = availableComponents.find((c) => c.id === componentId);
    if (!component) return;

    setBuilder((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          component_id: componentId,
          order_index: prev.components.length,
          component,
        },
      ],
    }));
  };

  const handleSave = async () => {
    if (!builder.name.trim()) {
      alert("Please enter a name for the content template");
      return;
    }

    try {
      setSaving(true);

      const templateData = {
        name: builder.name,
        description: builder.description,
        type: builder.type,
        includes_music: builder.includes_music,
        delivery_timeline: builder.delivery_timeline,
        components: builder.components.map((comp) => ({
          coverage_scene_id: comp.component_id, // This maps to the component structure
          default_editing_style_id: comp.component_id,
          settings: { order_index: comp.order_index },
        })),
      };

      await contentAPI.create(templateData);
      router.push("/app-crm/settings/services/content");
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Error saving content template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const contentTypes: ContentType[] = ["STANDARD", "RAW_FOOTAGE"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app-crm/settings/services/content"
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowBackIcon />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Content Template
          </h1>
          <p className="text-gray-600 mt-1">
            Build a custom content template with video components
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Template Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={builder.name}
                  onChange={(e) =>
                    setBuilder((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Wedding Highlight Reel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={builder.type}
                  onChange={(e) =>
                    setBuilder((prev) => ({
                      ...prev,
                      type: e.target.value as ContentType,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0) +
                        type.slice(1).toLowerCase().replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={builder.description}
                onChange={(e) =>
                  setBuilder((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe what this content template includes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Timeline (days)
                </label>
                <input
                  type="number"
                  value={builder.delivery_timeline}
                  onChange={(e) =>
                    setBuilder((prev) => ({
                      ...prev,
                      delivery_timeline: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="14"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={builder.includes_music}
                    onChange={(e) =>
                      setBuilder((prev) => ({
                        ...prev,
                        includes_music: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Includes Music
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Component Library */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Component Library
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableComponents.map((component) => (
                <div
                  key={component.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {component.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {component.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {component.type?.replace("_", " ").toLowerCase()}
                        </span>
                        {component.estimated_duration && (
                          <span className="text-xs text-gray-500">
                            {component.estimated_duration}min
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddComponent(component.id)}
                      disabled={builder.components.some(
                        (c) => c.component_id === component.id,
                      )}
                      className="ml-2 p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AddIcon fontSize="small" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              disabled={saving || !builder.name.trim()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <SaveIcon fontSize="small" />
              {saving ? "Saving..." : "Save Template"}
            </button>

            <Link
              href="/app-crm/settings/services/content"
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Eye, Edit2, Trash2, BarChart3 } from 'lucide-react';

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stage_count: number;
  project_count: number;
}

interface WorkflowOverview {
  summary: {
    total_templates: number;
    active_templates: number;
    total_stages: number;
    total_rules: number;
  };
  recentlyCreatedTemplates: WorkflowTemplate[];
  mostUsedTemplates: WorkflowTemplate[];
}

export default function AdminWorkflowsPage() {
  const [overview, setOverview] = useState<WorkflowOverview | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchOverview();
    fetchTemplates();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await fetch('http://localhost:3002/workflows/overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Error fetching workflow overview:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3002/workflows/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3002/workflows/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTemplate({ name: '', description: '', is_active: true });
        fetchTemplates();
        fetchOverview();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm('Are you sure you want to delete this workflow template?')) {
      try {
        const response = await fetch(`http://localhost:3002/workflows/templates/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchTemplates();
          fetchOverview();
        }
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Workflow Management
          </h1>
          <p className="text-gray-400 mt-2">
            Configure workflow templates and task generation rules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{overview.summary.total_templates}</h3>
                <p className="text-gray-400 text-sm">Total Templates</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{overview.summary.active_templates}</h3>
                <p className="text-gray-400 text-sm">Active Templates</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{overview.summary.total_stages}</h3>
                <p className="text-gray-400 text-sm">Total Stages</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{overview.summary.total_rules}</h3>
                <p className="text-gray-400 text-sm">Task Rules</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">Workflow Templates</h2>
        
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No workflow templates</h3>
            <p className="text-gray-500 mb-4">Create your first workflow template to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{template.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>{template.stage_count} stages</span>
                      <span>{template.project_count} projects using</span>
                      <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/admin/workflows/${template.id}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="View/Edit Template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/admin/workflows/${template.id}/analytics`, '_blank')}
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Workflow Template</h2>
            <form onSubmit={handleCreateTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template description"
                  rows={3}
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.is_active}
                    onChange={(e) => setNewTemplate({ ...newTemplate, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Active template</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

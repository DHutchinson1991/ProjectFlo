import {
  ContentTemplate,
  CreateContentDto,
  UpdateContentDto,
  ComponentLibrary,
  ContentCategory,
  CreateCategoryDto,
  UpdateCategoryDto
} from './types';

const API_BASE = 'http://localhost:3002';

// Content API
export const contentAPI = {
  async getAll(): Promise<ContentTemplate[]> {
    const response = await fetch(`${API_BASE}/content`);
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    return response.json();
  },

  async getById(id: number): Promise<ContentTemplate> {
    const response = await fetch(`${API_BASE}/content/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    return response.json();
  },

  async create(data: CreateContentDto): Promise<ContentTemplate> {
    const response = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create content');
    }
    return response.json();
  },

  async update(id: number, data: UpdateContentDto): Promise<ContentTemplate> {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update content');
    }
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/content/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete content');
    }
  },

  async updateComponents(id: number, components: Array<{
    component_id: number;
    order_index: number;
    editing_style?: string;
    duration_override?: number;
  }>): Promise<ContentTemplate> {
    const response = await fetch(`${API_BASE}/content/${id}/components`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(components),
    });
    if (!response.ok) {
      throw new Error('Failed to update components');
    }
    return response.json();
  },

  async getComponents(id: number) {
    const response = await fetch(`${API_BASE}/content/${id}/components`);
    if (!response.ok) {
      throw new Error('Failed to fetch components');
    }
    return response.json();
  }
};

// Components API
export const componentAPI = {
  async getAll(): Promise<ComponentLibrary[]> {
    const response = await fetch(`${API_BASE}/components`);
    if (!response.ok) {
      throw new Error('Failed to fetch components');
    }
    return response.json();
  },

  async getById(id: number): Promise<ComponentLibrary> {
    const response = await fetch(`${API_BASE}/components/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch component');
    }
    return response.json();
  },

  async create(data: Partial<ComponentLibrary>): Promise<ComponentLibrary> {
    const response = await fetch(`${API_BASE}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create component');
    }
    return response.json();
  },

  async update(id: number, data: Partial<ComponentLibrary>): Promise<ComponentLibrary> {
    const response = await fetch(`${API_BASE}/components/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update component');
    }
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/components/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete component');
    }
  },

  // Legacy methods for backward compatibility
  getAllComponents: function () { return this.getAll(); },
  getComponent: function (id: number) { return this.getById(id); },
  createComponent: function (data: Partial<ComponentLibrary>) { return this.create(data); },
  updateComponent: function (id: number, data: Partial<ComponentLibrary>) { return this.update(id, data); },
  deleteComponent: function (id: number) { return this.delete(id); },
};

// Keep the old export for backward compatibility
export const componentApi = componentAPI;

// Category Management API
export const categoryAPI = {
  async getAll(): Promise<ContentCategory[]> {
    const response = await fetch(`${API_BASE}/content/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  async getCodes(): Promise<string[]> {
    const response = await fetch(`${API_BASE}/content/categories/codes`);
    if (!response.ok) {
      throw new Error('Failed to fetch category codes');
    }
    return response.json();
  },

  async getById(id: number): Promise<ContentCategory> {
    const response = await fetch(`${API_BASE}/content/categories/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }
    return response.json();
  },

  async create(data: CreateCategoryDto): Promise<ContentCategory> {
    const response = await fetch(`${API_BASE}/content/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    return response.json();
  },

  async update(id: number, data: UpdateCategoryDto): Promise<ContentCategory> {
    const response = await fetch(`${API_BASE}/content/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/content/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  },

  async hardDelete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/content/categories/${id}/hard`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to permanently delete category');
    }
  },

  async initializeDefaults(): Promise<void> {
    const response = await fetch(`${API_BASE}/content/categories/initialize-defaults`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to initialize default categories');
    }
  },

  // Legacy methods for backward compatibility
  async getCategories(): Promise<string[]> {
    return this.getCodes();
  },

  async saveCategories(): Promise<void> {
    // This method is no longer needed since categories are persisted in the backend
    console.warn('saveCategories is deprecated - categories are now persisted automatically');
  },

  async addCategory(name: string, description?: string): Promise<string[]> {
    const code = name.toUpperCase().replace(/\s+/g, '_');
    await this.create({ name, code, description });
    return this.getCodes();
  },

  async updateCategory(id: number, name: string, description?: string): Promise<string[]> {
    const code = name.toUpperCase().replace(/\s+/g, '_');
    await this.update(id, { name, code, description });
    return this.getCodes();
  },

  async deleteCategory(id: number): Promise<string[]> {
    await this.delete(id);
    return this.getCodes();
  }
};

// Export contentService for components that need it
export const contentService = contentAPI;

// Legacy backward compatibility exports (deprecated)
export const deliverableAPI = contentAPI;
export const deliverableApi = contentAPI;

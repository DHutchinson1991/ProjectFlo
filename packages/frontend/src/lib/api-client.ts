// lib/api-client.ts
class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private getAuthHeaders(includeContentType: boolean = false): HeadersInit {
    const headers = new Headers();

    if (includeContentType) {
      headers.append("Content-Type", "application/json");
    }

    if (this.authToken) {
      headers.append("Authorization", `Bearer ${this.authToken}`);
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle different error scenarios
      if (response.status === 401) {
        // Unauthorized - clear token and call callback
        this.setAuthToken(null);
        localStorage.removeItem('authToken');
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new Error('Authentication failed. Please log in again.');
      }

      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Handle successful responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    // For non-JSON responses (like DELETE operations that return nothing)
    return {} as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  } async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(true),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Authentication specific methods
  async login(credentials: { email: string; password: string }): Promise<{
    access_token: string;
    user: { id: number; email: string; roles: string[] };
  }> {
    return this.post('/auth/login', credentials);
  }

  async getProfile(): Promise<{ userId: number; email: string; roles: string[] }> {
    return this.get('/auth/profile');
  }
}

// Create and export the singleton instance
const getApiBaseURL = (): string => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  }

  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
};

export const apiClient = new ApiClient(getApiBaseURL());

// Export types for use in other files
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  roles: string[];
  role?: {
    id: number;
    name: string;
  };
}

export interface Contributor {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: {
    id: number;
    name: string;
  };
  contributor_type?: string;
  default_hourly_rate?: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// Interfaces for API data structures
export interface ContactData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string; // Changed from phone
  company_name?: string; // Changed from company
  type?: string; // Changed from contact_type
  // Add other relevant fields as needed
}

export interface ContributorData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: {
    id: number;
    name: string;
  };
  contributor_type?: string;
  default_hourly_rate?: number;
}

export interface NewContributorData {
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  role_id: number;
  contributor_type?: string;
}

export interface UpdateContributorDto {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role_id?: number;
  contributor_type?: string;
}

// Services Interfaces
export interface CoverageSceneData {
  id: number;
  name: string;
  description?: string;
}

export interface ContentData {
  id: number;
  name: string;
  description?: string;
  type?: string;
  version?: string;
  includes_music?: boolean;
  delivery_timeline?: number;
  workflow_template_id?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface EditingStyleData {
  id: number;
  name: string;
  description?: string;
}

// DTOs for creating/updating services
export interface CreateCoverageSceneData {
  name: string;
  description?: string;
}

export interface CreateContentData {
  name: string;
  description?: string;
}

export interface CreateEditingStyleData {
  name: string;
  description?: string;
}

export interface UpdateCoverageSceneData {
  name?: string;
  description?: string;
}

export interface UpdateContentData {
  name?: string;
  description?: string;
}

export interface UpdateEditingStyleData {
  name?: string;
  description?: string;
}

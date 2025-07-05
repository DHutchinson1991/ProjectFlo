/**
 * Authentication and authorization related types
 */

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

export interface Role {
  id: number;
  name: string;
  description?: string;
}

// Auth Context Types
export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
  refreshAuth: () => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

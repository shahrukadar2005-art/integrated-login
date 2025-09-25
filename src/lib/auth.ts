import { User } from "../types/User";

// Update the SignupFormData interface to match SignupData
export interface SignupFormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

// Interface for login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Response interface for API calls
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

const API_URL = "http://localhost:4000/api";

export const authService = {
  // ✅ Signup a new user with enhanced error handling
  signup: async (formData: SignupFormData): Promise<AuthResponse> => {
    try {
      // Prepare data for backend - FIXED: Use camelCase to match backend entity
      const backendData = {
        firstName: formData.firstname,  // Changed from 'firstname' to 'firstName'
        lastName: formData.lastname,    // Changed from 'lastname' to 'lastName'
        email: formData.email,
        password: formData.password
        // Removed the 'name' field as it doesn't exist in the backend entity
      };

      console.log('Sending to backend:', backendData);
      console.log('API URL:', `${API_URL}/auth/register`);

      // Check if we're in browser environment
      if (typeof window === "undefined") {
        return { 
          success: false, 
          message: "Cannot make requests on server side" 
        };
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(backendData),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        return { 
          success: false, 
          message: "Server error: Invalid response format" 
        };
      }

      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        return { 
          success: false, 
          message: data.message || `HTTP Error: ${res.status}` 
        };
      }

      // Save token in localStorage
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return { 
        success: true, 
        message: data.message || "Signup successful", 
        user: data.user, 
        token: data.token 
      };
    } catch (err: any) {
      console.error("Signup error:", err);
      
      // Provide more specific error messages
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        return { 
          success: false, 
          message: "Cannot connect to server. Please check if the backend is running on http://localhost:4000" 
        };
      }
      
      if (err.name === 'AbortError') {
        return { 
          success: false, 
          message: "Request timed out. Please try again." 
        };
      }

      return { 
        success: false, 
        message: err.message || "Something went wrong. Please try again." 
      };
    }
  },

  // Enhanced login with same error handling pattern
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('API URL:', `${API_URL}/auth/login`);

      if (typeof window === "undefined") {
        return { 
          success: false, 
          message: "Cannot make requests on server side" 
        };
      }

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(credentials),
      });

      console.log('Login response status:', res.status);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { 
          success: false, 
          message: "Server error: Invalid response format" 
        };
      }

      const data = await res.json();

      if (!res.ok) {
        return { 
          success: false, 
          message: data.message || `HTTP Error: ${res.status}` 
        };
      }

      // Save token in localStorage
      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return { 
        success: true, 
        message: data.message || "Login successful", 
        user: data.user, 
        token: data.token 
      };
    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        return { 
          success: false, 
          message: "Cannot connect to server. Please check if the backend is running." 
        };
      }

      return { 
        success: false, 
        message: err.message || "Something went wrong. Please try again." 
      };
    }
  },

  logout: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("token");
    return !!token;
  },

  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  },

  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  updateProfile: async (profileData: Partial<User>): Promise<AuthResponse> => {
    const token = authService.getToken();
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        return { 
          success: false, 
          message: data.message || "Profile update failed" 
        };
      }

      // Update localStorage user data
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return { 
        success: true, 
        message: data.message || "Profile updated successfully", 
        user: data.user 
      };
    } catch (err: any) {
      console.error("Profile update error:", err);
      return { 
        success: false, 
        message: "Something went wrong. Please try again." 
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
    const token = authService.getToken();
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { 
          success: false, 
          message: data.message || "Password change failed" 
        };
      }

      return { 
        success: true, 
        message: data.message || "Password changed successfully" 
      };
    } catch (err: any) {
      console.error("Password change error:", err);
      return { 
        success: false, 
        message: "Something went wrong. Please try again." 
      };
    }
  }
};

// ✅ Named exports for individual functions
export const login = authService.login;
export const signup = authService.signup;
export const logout = authService.logout;
export const isAuthenticated = authService.isAuthenticated;
export const getCurrentUser = authService.getCurrentUser;
export const getToken = authService.getToken;
export const updateProfile = authService.updateProfile;
export const changePassword = authService.changePassword;

// ✅ Default export for the entire service
export default authService;
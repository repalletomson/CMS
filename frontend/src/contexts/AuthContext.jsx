/**
 * Authentication context for managing user state
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import * as authApi from '../services/authApi';

const AuthContext = createContext();

/**
 * Auth Provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get current user on app load only if token exists
  const { data: userData, isLoading } = useQuery(
    'currentUser',
    authApi.getCurrentUser,
    {
      retry: false,
      enabled: !!localStorage.getItem('token'), // Only run if token exists
      onSuccess: (data) => {
        setUser(data.user);
        setLoading(false);
      },
      onError: () => {
        setUser(null);
        setLoading(false);
        // Clear any stored token
        localStorage.removeItem('token');
      }
    }
  );

  // Set loading to false immediately if no token
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation(authApi.login, {
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      queryClient.setQueryData('currentUser', data);
      toast.success('Login successful!');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    }
  });

  // Logout mutation
  const logoutMutation = useMutation(authApi.logout, {
    onSuccess: () => {
      localStorage.removeItem('token');
      setUser(null);
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Force logout even if API call fails
      localStorage.removeItem('token');
      setUser(null);
      queryClient.clear();
    }
  });

  // Login function
  const login = async (credentials) => {
    return loginMutation.mutateAsync(credentials);
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false;

    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users'],
      editor: ['read', 'write', 'delete'],
      viewer: ['read']
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  // Check if user has role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the roles
  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    loading: loading || isLoading,
    login,
    logout,
    updateUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    isLoggingIn: loginMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
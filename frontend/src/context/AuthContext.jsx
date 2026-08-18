import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkAuthStatus as reduxCheckAuthStatus,
  loginUser,
  registerUser,
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated
} from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector((state) => state.auth.loading);
  const error = useSelector((state) => state.auth.error);

  const checkAuthStatus = () => {
    dispatch(reduxCheckAuthStatus());
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (emailOrUsername, password) => {
    const resultAction = await dispatch(loginUser({ emailOrUsername, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: resultAction.payload || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (name, username, email, password) => {
    const resultAction = await dispatch(registerUser({ name, username, email, password }));
    if (registerUser.fulfilled.match(resultAction)) {
      return { success: true };
    } else {
      return {
        success: false,
        message: resultAction.payload || 'Registration failed. Please check details.'
      };
    }
  };

  const logout = async () => {
    await dispatch(logoutUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        loading,
        isAuthenticated,
        error,
        login,
        register,
        logout,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

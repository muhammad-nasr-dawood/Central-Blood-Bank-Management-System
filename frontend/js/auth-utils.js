// Authentication and Authorization Utilities
// This file provides common auth functions for all pages

// Check if token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Date.now() / 1000;
  } catch (e) {
    return true;
  }
}

// Check user role from token
function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
  }
}

// Check if user has required role
function checkRole(requiredRole) {
  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== requiredRole) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return false;
  }
}

// Force logout and redirect
function forceLogout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Global AJAX error handler
$(document).ready(function() {
  $(document).ajaxError(function(event, xhr) {
    if (xhr.status === 401 || xhr.status === 403) {
      console.log('Auth error detected:', xhr.status);
      forceLogout();
    }
  });
});

// Check auth status on page load
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return false;
  }
  
  return true;
} 
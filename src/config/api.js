export const API_URL = import.meta.env.VITE_API_URL;

export const endpoints = {
  // Add your endpoints here
  auth: `${API_URL}/api/auth`,
  users: `${API_URL}/api/users`,
  events: `${API_URL}/api/events`,
};

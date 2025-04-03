import { API_URL, endpoints } from '../config/api';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Example usage:
// import { fetchData } from '../services/api';
// const data = await fetchData('/api/events');

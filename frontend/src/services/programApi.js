/**
 * Program API service
 */
import api from './api';

/**
 * Get programs with filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Programs response
 */
export const getPrograms = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value);
    }
  });

  const response = await api.get(`/api/admin/programs?${params.toString()}`);
  return response.data;
};

/**
 * Get program by ID
 * @param {string} id - Program ID
 * @returns {Promise<Object>} Program data
 */
export const getProgram = async (id) => {
  const response = await api.get(`/api/admin/programs/${id}`);
  return response.data;
};

/**
 * Create new program
 * @param {Object} programData - Program data
 * @returns {Promise<Object>} Created program
 */
export const createProgram = async (programData) => {
  const response = await api.post('/api/admin/programs', programData);
  return response.data;
};

/**
 * Update program
 * @param {string} id - Program ID
 * @param {Object} programData - Updated program data
 * @returns {Promise<Object>} Updated program
 */
export const updateProgram = async (id, programData) => {
  const response = await api.put(`/api/admin/programs/${id}`, programData);
  return response.data;
};

/**
 * Delete program
 * @param {string} id - Program ID
 * @returns {Promise<void>}
 */
export const deleteProgram = async (id) => {
  await api.delete(`/api/admin/programs/${id}`);
};
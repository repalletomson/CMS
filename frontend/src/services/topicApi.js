/**
 * Topics API service
 */
import api from './api';

/**
 * Get all topics
 * @returns {Promise<Object>} Topics response
 */
export const getTopics = async () => {
  const response = await api.get('/api/admin/topics');
  return response.data;
};

/**
 * Create new topic
 * @param {Object} topicData - Topic data
 * @returns {Promise<Object>} Created topic
 */
export const createTopic = async (topicData) => {
  const response = await api.post('/api/admin/topics', topicData);
  return response.data;
};

/**
 * Update topic
 * @param {string} id - Topic ID
 * @param {Object} topicData - Updated topic data
 * @returns {Promise<Object>} Updated topic
 */
export const updateTopic = async (id, topicData) => {
  const response = await api.put(`/api/admin/topics/${id}`, topicData);
  return response.data;
};

/**
 * Delete topic
 * @param {string} id - Topic ID
 * @returns {Promise<Object>} Delete response
 */
export const deleteTopic = async (id) => {
  const response = await api.delete(`/api/admin/topics/${id}`);
  return response.data;
};
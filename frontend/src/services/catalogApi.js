/**
 * Public Catalog API Service
 * Consumer-facing API endpoints for published content
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class CatalogApiService {
  /**
   * Get published programs
   */
  async getPrograms(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.language) queryParams.append('language', params.language);
    if (params.topic) queryParams.append('topic', params.topic);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const response = await fetch(`${API_BASE_URL}/catalog/programs?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch programs: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get single program by ID
   */
  async getProgram(id) {
    const response = await fetch(`${API_BASE_URL}/catalog/programs/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Program not found');
      }
      throw new Error(`Failed to fetch program: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get published lessons
   */
  async getLessons(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.language) queryParams.append('language', params.language);
    if (params.topic) queryParams.append('topic', params.topic);
    if (params.program_id) queryParams.append('program_id', params.program_id);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.cursor) queryParams.append('cursor', params.cursor);

    const response = await fetch(`${API_BASE_URL}/catalog/lessons?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lessons: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get single lesson by ID
   */
  async getLesson(id) {
    const response = await fetch(`${API_BASE_URL}/catalog/lessons/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Lesson not found');
      }
      throw new Error(`Failed to fetch lesson: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get available topics with content counts
   */
  async getTopics() {
    const response = await fetch(`${API_BASE_URL}/catalog/topics`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch topics: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Search content
   */
  async search(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (!params.q || params.q.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    
    queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.language) queryParams.append('language', params.language);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await fetch(`${API_BASE_URL}/catalog/search?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get program lessons (convenience method)
   */
  async getProgramLessons(programId, params = {}) {
    return this.getLessons({
      ...params,
      program_id: programId
    });
  }

  /**
   * Get content by topic (convenience method)
   */
  async getContentByTopic(topicName, params = {}) {
    const [programs, lessons] = await Promise.all([
      this.getPrograms({ ...params, topic: topicName }),
      this.getLessons({ ...params, topic: topicName })
    ]);

    return {
      programs: programs.programs || [],
      lessons: lessons.lessons || [],
      topic: topicName
    };
  }

  /**
   * Get featured content (convenience method)
   * Returns recently published content
   */
  async getFeaturedContent(params = {}) {
    const limit = params.limit || 6;
    
    const [programs, lessons] = await Promise.all([
      this.getPrograms({ ...params, limit: Math.ceil(limit / 2) }),
      this.getLessons({ ...params, limit: Math.ceil(limit / 2) })
    ]);

    // Combine and sort by published date
    const allContent = [
      ...(programs.programs || []).map(p => ({ ...p, type: 'program' })),
      ...(lessons.lessons || []).map(l => ({ ...l, type: 'lesson' }))
    ].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    return {
      content: allContent.slice(0, limit),
      total: (programs.pagination?.total || 0) + (lessons.pagination?.total || 0)
    };
  }
}

// Create singleton instance
const catalogApi = new CatalogApiService();

export default catalogApi;

// Export individual methods for convenience
export const {
  getPrograms,
  getProgram,
  getLessons,
  getLesson,
  getTopics,
  search,
  getProgramLessons,
  getContentByTopic,
  getFeaturedContent
} = catalogApi;
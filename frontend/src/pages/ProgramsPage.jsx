/**
 * Programs page component with enhanced UI
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit3, FiTrash2, FiUsers, FiBookOpen, FiClock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as programApi from '../services/programApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NewProgramModal from '../components/modals/NewProgramModal';

const ProgramsPage = () => {
  const { hasPermission } = useAuth();
  const [isNewProgramModalOpen, setIsNewProgramModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    language: '',
    topic: ''
  });

  const { data, isLoading, error } = useQuery(
    ['programs', filters],
    () => programApi.getPrograms(filters),
    {
      keepPreviousData: true
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      published: 'badge-success',
      archived: 'badge-danger'
    };
    return badges[status] || 'badge-gray';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return '🟢';
      case 'draft': return '🟡';
      case 'archived': return '🔴';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading programs</h3>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Programs</h1>
          <p className="mt-2 text-gray-600">
            Manage your educational programs and content
          </p>
        </div>
        {hasPermission('write') && (
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setIsNewProgramModalOpen(true)}
              className="btn-primary btn-lg"
            >
              <FiPlus className="h-5 w-5 mr-2" />
              New Program
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiBookOpen className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Programs</p>
                <p className="text-2xl font-bold text-gray-900">{data?.programs?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                  <span className="text-accent-600 font-bold">🟢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.programs?.filter(p => p.status === 'published').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.programs?.filter(p => p.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-secondary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Languages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(data?.programs?.flatMap(p => p.languagesAvailable) || []).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search Programs</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Search by title..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="form-label">Language</label>
              <select
                className="form-input"
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
              >
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="te">Telugu</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            <div>
              <label className="form-label">Topic</label>
              <select
                className="form-input"
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
              >
                <option value="">All Topics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Technology">Technology</option>
                <option value="Language Arts">Language Arts</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.programs?.map((program) => (
          <div key={program._id} className="card group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="card-body">
              {/* Program Image */}
              <div className="relative aspect-w-16 aspect-h-9 mb-4 overflow-hidden rounded-lg">
                <img
                  src={program.assets?.posters?.[program.languagePrimary]?.landscape || 'https://via.placeholder.com/400x300/0ea5e9/ffffff?text=Program'}
                  alt={program.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <span className={`badge ${getStatusBadge(program.status)}`}>
                    {getStatusIcon(program.status)} {program.status}
                  </span>
                </div>
              </div>

              {/* Program Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 font-display group-hover:text-primary-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-3 mt-2 text-sm">
                    {program.description || 'No description available'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="font-medium">Primary:</span>
                    <span className="ml-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium">
                      {program.languagePrimary.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs">
                    {program.languagesAvailable.length} language{program.languagesAvailable.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {program.topics && program.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {program.topics.slice(0, 3).map((topic) => (
                      <span key={topic} className="badge badge-info text-xs">
                        {topic}
                      </span>
                    ))}
                    {program.topics.length > 3 && (
                      <span className="badge badge-gray text-xs">
                        +{program.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <FiClock className="w-4 h-4 mr-1" />
                    {new Date(program.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/programs/${program._id}`}
                      className="btn-outline btn-sm"
                    >
                      <FiEye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                    {hasPermission('write') && (
                      <button className="btn-primary btn-sm">
                        <FiEdit3 className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.programs?.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
            <FiBookOpen className="h-24 w-24" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs found</h3>
          <p className="text-gray-600 mb-6">
            {Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first program.'
            }
          </p>
          {hasPermission('write') && (
            <button 
              onClick={() => setIsNewProgramModalOpen(true)}
              className="btn-primary btn-lg"
            >
              <FiPlus className="h-5 w-5 mr-2" />
              Create your first program
            </button>
          )}
        </div>
      )}

      {/* New Program Modal */}
      <NewProgramModal 
        isOpen={isNewProgramModalOpen}
        onClose={() => setIsNewProgramModalOpen(false)}
      />
    </div>
  );
};

export default ProgramsPage;
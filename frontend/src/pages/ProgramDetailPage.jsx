/**
 * Program detail page with full CRUD functionality
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  FiArrowLeft, FiEdit3, FiTrash2, FiPlus, FiUsers, FiBookOpen, 
  FiClock, FiGlobe, FiTag, FiPlay, FiPause, FiCalendar, FiEye 
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import * as programApi from '../services/programApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import YouTubePlayer from '../components/ui/YouTubePlayer';
import NewTermModal from '../components/modals/NewTermModal';
import NewLessonModal from '../components/modals/NewLessonModal';
import EditProgramModal from '../components/modals/EditProgramModal';
import toast from 'react-hot-toast';

const ProgramDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTermModalOpen, setIsNewTermModalOpen] = useState(false);
  const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState(null);

  // Fetch program details
  const { data: program, isLoading, error } = useQuery(
    ['program', id],
    () => programApi.getProgram(id),
    {
      enabled: !!id
    }
  );

  // Mock data for terms and lessons (in real app, this would come from API)
  const mockTerms = [
    {
      _id: 'term1',
      termNumber: 1,
      title: 'Fundamentals',
      programId: id,
      lessonsCount: 3,
      publishedLessonsCount: 2,
      createdAt: new Date('2024-01-15')
    },
    {
      _id: 'term2',
      termNumber: 2,
      title: 'Advanced Topics',
      programId: id,
      lessonsCount: 2,
      publishedLessonsCount: 1,
      createdAt: new Date('2024-01-20')
    }
  ];

  const mockLessons = [
    {
      _id: 'lesson1',
      termId: 'term1',
      lessonNumber: 1,
      title: 'Introduction to Algebra',
      contentType: 'video',
      durationMs: 1800000,
      status: 'published',
      publishedAt: new Date('2024-01-16'),
      isPaid: false
    },
    {
      _id: 'lesson2',
      termId: 'term1',
      lessonNumber: 2,
      title: 'Linear Equations',
      contentType: 'video',
      durationMs: 2100000,
      status: 'scheduled',
      publishAt: new Date('2024-02-01'),
      isPaid: true
    },
    {
      _id: 'lesson3',
      termId: 'term1',
      lessonNumber: 3,
      title: 'Practice Problems',
      contentType: 'article',
      status: 'draft',
      isPaid: false
    }
  ];

  const deleteProgramMutation = useMutation(programApi.deleteProgram, {
    onSuccess: () => {
      queryClient.invalidateQueries('programs');
      toast.success('Program deleted successfully');
      navigate('/programs');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete program');
    }
  });

  const handleDeleteProgram = () => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      deleteProgramMutation.mutate(id);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-gray', icon: '🟡' },
      published: { class: 'badge-success', icon: '🟢' },
      scheduled: { class: 'badge-warning', icon: '⏰' },
      archived: { class: 'badge-danger', icon: '🔴' }
    };
    return badges[status] || badges.draft;
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-red-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Program not found</h3>
        <p className="text-gray-600 mb-4">The program you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate('/programs')}
          className="btn-primary"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/programs')}
            className="btn-outline"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{program.title}</h1>
            <p className="text-gray-600 mt-1">Program Management</p>
          </div>
        </div>
        
        {hasPermission('write') && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-primary"
            >
              <FiEdit3 className="w-4 h-4 mr-2" />
              Edit Program
            </button>
            <button
              onClick={handleDeleteProgram}
              className="btn-danger"
              disabled={deleteProgramMutation.isLoading}
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Program Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Info Card */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 font-display">Program Information</h2>
                <span className={`badge ${getStatusBadge(program.status).class}`}>
                  {getStatusBadge(program.status).icon} {program.status}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description || 'No description available'}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FiGlobe className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Primary Language:</span>
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 rounded-md text-xs font-medium">
                          {program.languagePrimary.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FiUsers className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Available Languages:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {program.languagesAvailable.map(lang => (
                            <span key={lang} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs">
                              {lang.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FiTag className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Topics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {program.topics?.map(topic => (
                            <span key={topic} className="badge badge-info text-xs">
                              {topic}
                            </span>
                          )) || <span className="text-xs text-gray-500">No topics assigned</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img
                      src={program.assets?.posters?.[program.languagePrimary]?.landscape || 'https://via.placeholder.com/400x300/0ea5e9/ffffff?text=Program'}
                      alt={program.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Created: {new Date(program.createdAt).toLocaleDateString()}</p>
                    {program.publishedAt && (
                      <p>Published: {new Date(program.publishedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Lessons */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 font-display">Terms & Lessons</h2>
                {hasPermission('write') && (
                  <button
                    onClick={() => setIsNewTermModalOpen(true)}
                    className="btn-primary btn-sm"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add Term
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {mockTerms.length === 0 ? (
                <div className="text-center py-8">
                  <FiBookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No terms yet</h3>
                  <p className="text-gray-600 mb-4">Start organizing your program by adding terms.</p>
                  {hasPermission('write') && (
                    <button
                      onClick={() => setIsNewTermModalOpen(true)}
                      className="btn-primary"
                    >
                      <FiPlus className="w-4 h-4 mr-2" />
                      Add First Term
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {mockTerms.map(term => (
                    <div key={term._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Term {term.termNumber}: {term.title || 'Untitled Term'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {term.lessonsCount} lessons • {term.publishedLessonsCount} published
                          </p>
                        </div>
                        {hasPermission('write') && (
                          <button
                            onClick={() => {
                              setSelectedTermId(term._id);
                              setIsNewLessonModalOpen(true);
                            }}
                            className="btn-outline btn-sm"
                          >
                            <FiPlus className="w-4 h-4 mr-2" />
                            Add Lesson
                          </button>
                        )}
                      </div>

                      {/* Lessons for this term */}
                      <div className="space-y-3">
                        {mockLessons
                          .filter(lesson => lesson.termId === term._id)
                          .map(lesson => (
                            <div key={lesson._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    lesson.contentType === 'video' 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {lesson.contentType === 'video' ? <FiPlay className="w-4 h-4" /> : <FiBookOpen className="w-4 h-4" />}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {lesson.lessonNumber}. {lesson.title}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span>{lesson.contentType}</span>
                                    {lesson.durationMs && <span>{formatDuration(lesson.durationMs)}</span>}
                                    {lesson.isPaid && <span className="text-yellow-600">💰 Paid</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`badge ${getStatusBadge(lesson.status).class} text-xs`}>
                                  {getStatusBadge(lesson.status).icon} {lesson.status}
                                </span>
                                {hasPermission('write') && (
                                  <button className="btn-outline btn-sm">
                                    <FiEdit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 font-display">Statistics</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiBookOpen className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Terms</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{mockTerms.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiPlay className="w-5 h-5 text-accent-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Lessons</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{mockLessons.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiEye className="w-5 h-5 text-secondary-600 mr-2" />
                  <span className="text-sm text-gray-600">Published</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {mockLessons.filter(l => l.status === 'published').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiClock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-600">Total Duration</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {formatDuration(mockLessons.reduce((acc, lesson) => acc + (lesson.durationMs || 0), 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {hasPermission('write') && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 font-display">Quick Actions</h3>
              </div>
              <div className="card-body space-y-3">
                <button
                  onClick={() => setIsNewTermModalOpen(true)}
                  className="w-full btn-outline"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Add New Term
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full btn-outline"
                >
                  <FiEdit3 className="w-4 h-4 mr-2" />
                  Edit Program
                </button>
                <button className="w-full btn-outline">
                  <FiUsers className="w-4 h-4 mr-2" />
                  Manage Assets
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditProgramModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        program={program}
      />
      
      <NewTermModal 
        isOpen={isNewTermModalOpen}
        onClose={() => setIsNewTermModalOpen(false)}
        programId={id}
      />
      
      <NewLessonModal 
        isOpen={isNewLessonModalOpen}
        onClose={() => {
          setIsNewLessonModalOpen(false);
          setSelectedTermId(null);
        }}
        termId={selectedTermId}
      />
    </div>
  );
};

export default ProgramDetailPage;
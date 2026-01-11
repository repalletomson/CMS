/**
 * Publishing Dashboard Page
 */
import { useState } from 'react';
import { useQuery } from 'react-query';
import { FiCalendar, FiClock, FiGlobe, FiEye, FiEdit3, FiTrash2, FiPlay, FiPause } from 'react-icons/fi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PublishModal from '../components/modals/PublishModal';

const PublishingPage = () => {
  const [selectedTab, setSelectedTab] = useState('scheduled'); // 'scheduled', 'published', 'draft'
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Mock data for scheduled publications
  const mockScheduledItems = [
    {
      _id: '1',
      title: 'Advanced React Patterns',
      type: 'program',
      scheduledPublishAt: new Date('2024-02-01T10:00:00Z'),
      languages: ['en', 'es'],
      status: 'scheduled',
      createdBy: 'editor@example.com'
    },
    {
      _id: '2',
      title: 'Introduction to Hooks',
      type: 'lesson',
      scheduledPublishAt: new Date('2024-02-02T14:30:00Z'),
      languages: ['en'],
      status: 'scheduled',
      createdBy: 'admin@example.com'
    }
  ];

  const mockPublishedItems = [
    {
      _id: '3',
      title: 'JavaScript Fundamentals',
      type: 'program',
      publishedAt: new Date('2024-01-15T09:00:00Z'),
      languages: ['en', 'es', 'fr'],
      status: 'published',
      views: 1250
    },
    {
      _id: '4',
      title: 'State Management',
      type: 'lesson',
      publishedAt: new Date('2024-01-14T16:00:00Z'),
      languages: ['en'],
      status: 'published',
      views: 890
    }
  ];

  const mockDraftItems = [
    {
      _id: '5',
      title: 'TypeScript Best Practices',
      type: 'program',
      updatedAt: new Date('2024-01-16T11:30:00Z'),
      languages: ['en'],
      status: 'draft',
      completionPercentage: 75
    },
    {
      _id: '6',
      title: 'Testing Components',
      type: 'lesson',
      updatedAt: new Date('2024-01-16T08:15:00Z'),
      languages: ['en'],
      status: 'draft',
      completionPercentage: 45
    }
  ];

  const { data: scheduledItems = mockScheduledItems } = useQuery('scheduled-items', () => mockScheduledItems);
  const { data: publishedItems = mockPublishedItems } = useQuery('published-items', () => mockPublishedItems);
  const { data: draftItems = mockDraftItems } = useQuery('draft-items', () => mockDraftItems);

  const handlePublish = (item) => {
    setSelectedEntity(item);
    setIsPublishModalOpen(true);
  };

  const handleCancelScheduled = (item) => {
    if (window.confirm(`Cancel scheduled publishing for "${item.title}"?`)) {
      // Mock API call to cancel scheduled publishing
      console.log('Cancelling scheduled publication:', item._id);
    }
  };

  const handleUnpublish = (item) => {
    if (window.confirm(`Unpublish "${item.title}"? This will make it unavailable to users.`)) {
      // Mock API call to unpublish
      console.log('Unpublishing:', item._id);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge-warning',
      published: 'badge-success',
      draft: 'badge-gray'
    };
    return badges[status] || 'badge-gray';
  };

  const getTypeIcon = (type) => {
    return type === 'program' ? '📚' : '📄';
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const tabs = [
    { id: 'scheduled', label: 'Scheduled', count: scheduledItems.length },
    { id: 'published', label: 'Published', count: publishedItems.length },
    { id: 'draft', label: 'Drafts', count: draftItems.length }
  ];

  const getCurrentItems = () => {
    switch (selectedTab) {
      case 'scheduled': return scheduledItems;
      case 'published': return publishedItems;
      case 'draft': return draftItems;
      default: return [];
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Publishing Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage content publishing and scheduling
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledItems.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiGlobe className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-bold text-gray-900">{publishedItems.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FiEdit3 className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{draftItems.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiEye className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {publishedItems.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header border-b-0 pb-0">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {getCurrentItems().length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                {selectedTab === 'scheduled' && <FiClock className="h-12 w-12" />}
                {selectedTab === 'published' && <FiGlobe className="h-12 w-12" />}
                {selectedTab === 'draft' && <FiEdit3 className="h-12 w-12" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {selectedTab} content
              </h3>
              <p className="text-gray-500">
                {selectedTab === 'scheduled' && 'No content is scheduled for publishing.'}
                {selectedTab === 'published' && 'No content has been published yet.'}
                {selectedTab === 'draft' && 'No draft content available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getCurrentItems().map(item => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            {item.type}
                          </span>
                          <div className="flex items-center space-x-1">
                            {item.languages.map(lang => (
                              <span key={lang} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {lang.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {selectedTab === 'scheduled' && (
                            <div className="flex items-center">
                              <FiCalendar className="w-4 h-4 mr-1" />
                              Scheduled for {formatDateTime(item.scheduledPublishAt)}
                              {item.createdBy && (
                                <span className="ml-2">• by {item.createdBy}</span>
                              )}
                            </div>
                          )}
                          {selectedTab === 'published' && (
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                Published {formatDateTime(item.publishedAt)}
                              </div>
                              {item.views && (
                                <div className="flex items-center">
                                  <FiEye className="w-4 h-4 mr-1" />
                                  {item.views.toLocaleString()} views
                                </div>
                              )}
                            </div>
                          )}
                          {selectedTab === 'draft' && (
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <FiEdit3 className="w-4 h-4 mr-1" />
                                Last updated {formatDateTime(item.updatedAt)}
                              </div>
                              {item.completionPercentage && (
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${item.completionPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs">{item.completionPercentage}%</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedTab === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handlePublish(item)}
                            className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                            title="Publish now"
                          >
                            <FiPlay className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelScheduled(item)}
                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                            title="Cancel scheduled publishing"
                          >
                            <FiPause className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {selectedTab === 'published' && (
                        <>
                          <button
                            onClick={() => handleUnpublish(item)}
                            className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors"
                            title="Unpublish"
                          >
                            <FiPause className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {selectedTab === 'draft' && (
                        <>
                          <button
                            onClick={() => handlePublish(item)}
                            className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                            title="Publish"
                          >
                            <FiGlobe className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        entity={selectedEntity}
        entityType={selectedEntity?.type}
      />
    </div>
  );
};

export default PublishingPage;
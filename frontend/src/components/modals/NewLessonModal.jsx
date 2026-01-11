/**
 * New Lesson Modal Component
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { FiX, FiPlus, FiPlay, FiBookOpen, FiClock, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NewLessonModal = ({ isOpen, onClose, termId }) => {
  const [contentType, setContentType] = useState('video');
  const [languages, setLanguages] = useState(['en']);
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      lessonNumber: 1,
      title: '',
      contentType: 'video',
      durationMs: '',
      isPaid: false
    }
  });

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'te', name: 'Telugu' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' }
  ];

  // Mock mutation
  const createLessonMutation = useMutation(
    async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...data, _id: Math.random().toString(36).substr(2, 9) };
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['program']);
        toast.success('Lesson created successfully!');
        handleClose();
      },
      onError: (error) => {
        toast.error('Failed to create lesson');
      }
    }
  );

  const handleClose = () => {
    reset();
    setContentType('video');
    setLanguages(['en']);
    setPrimaryLanguage('en');
    onClose();
  };

  const onSubmit = (data) => {
    const lessonData = {
      ...data,
      termId,
      lessonNumber: parseInt(data.lessonNumber),
      contentType,
      durationMs: contentType === 'video' ? parseInt(data.durationMs) * 60000 : null, // Convert minutes to ms
      contentLanguagePrimary: primaryLanguage,
      contentLanguagesAvailable: languages,
      contentUrlsByLanguage: languages.reduce((acc, lang) => {
        acc[lang] = `https://example.com/content/${data.title.toLowerCase().replace(/\s+/g, '-')}-${lang}`;
        return acc;
      }, {})
    };
    
    createLessonMutation.mutate(lessonData);
  };

  const addLanguage = (langCode) => {
    if (!languages.includes(langCode)) {
      setLanguages(prev => [...prev, langCode]);
    }
  };

  const removeLanguage = (langCode) => {
    if (langCode !== primaryLanguage && languages.length > 1) {
      setLanguages(prev => prev.filter(lang => lang !== langCode));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 font-display">
                Add New Lesson
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a new lesson for this term
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Lesson Number *</label>
                  <input
                    type="number"
                    min="1"
                    className={`form-input ${errors.lessonNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter lesson number"
                    {...register('lessonNumber', { 
                      required: 'Lesson number is required',
                      min: { value: 1, message: 'Lesson number must be at least 1' }
                    })}
                  />
                  {errors.lessonNumber && (
                    <p className="form-error">{errors.lessonNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Lesson Title *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter lesson title"
                    {...register('title', { 
                      required: 'Lesson title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' }
                    })}
                  />
                  {errors.title && (
                    <p className="form-error">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Content Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        contentType === 'video'
                          ? 'border-primary-300 bg-primary-50 text-primary-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={contentType === 'video'}
                        onChange={() => setContentType('video')}
                      />
                      <FiPlay className="w-5 h-5 mr-3" />
                      <span className="font-medium">Video</span>
                    </label>
                    
                    <label
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        contentType === 'article'
                          ? 'border-primary-300 bg-primary-50 text-primary-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={contentType === 'article'}
                        onChange={() => setContentType('article')}
                      />
                      <FiBookOpen className="w-5 h-5 mr-3" />
                      <span className="font-medium">Article</span>
                    </label>
                  </div>
                </div>

                {contentType === 'video' && (
                  <div>
                    <label className="form-label">Duration (minutes) *</label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="number"
                        min="1"
                        className={`form-input pl-10 ${errors.durationMs ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Enter duration in minutes"
                        {...register('durationMs', { 
                          required: contentType === 'video' ? 'Duration is required for videos' : false,
                          min: { value: 1, message: 'Duration must be at least 1 minute' }
                        })}
                      />
                    </div>
                    {errors.durationMs && (
                      <p className="form-error">{errors.durationMs.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      {...register('isPaid')}
                    />
                    <FiDollarSign className="w-4 h-4 ml-2 mr-1 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">Paid Content</span>
                  </label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="form-label">Primary Content Language *</label>
                  <select
                    className="form-input"
                    value={primaryLanguage}
                    onChange={(e) => {
                      setPrimaryLanguage(e.target.value);
                      if (!languages.includes(e.target.value)) {
                        setLanguages(prev => [...prev, e.target.value]);
                      }
                    }}
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Available Languages</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {languages.map(langCode => {
                      const lang = availableLanguages.find(l => l.code === langCode);
                      return (
                        <span
                          key={langCode}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            langCode === primaryLanguage
                              ? 'bg-primary-100 text-primary-800 border border-primary-300'
                              : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}
                        >
                          {lang?.name}
                          {langCode === primaryLanguage && (
                            <span className="ml-1 text-xs">(Primary)</span>
                          )}
                          {langCode !== primaryLanguage && languages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLanguage(langCode)}
                              className="ml-2 text-gray-500 hover:text-red-500"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                  
                  <select
                    className="form-input"
                    onChange={(e) => {
                      if (e.target.value) {
                        addLanguage(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add a language...</option>
                    {availableLanguages
                      .filter(lang => !languages.includes(lang.code))
                      .map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Content URLs</h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Content URLs will be automatically generated based on the lesson title and selected languages.
                  </p>
                  <div className="space-y-2">
                    {languages.map(lang => (
                      <div key={lang} className="flex items-center text-xs">
                        <span className="w-8 text-gray-500">{lang.toUpperCase()}:</span>
                        <span className="text-gray-600 truncate">
                          https://example.com/content/lesson-{lang}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline"
                disabled={createLessonMutation.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createLessonMutation.isLoading}
              >
                {createLessonMutation.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Lesson
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewLessonModal;
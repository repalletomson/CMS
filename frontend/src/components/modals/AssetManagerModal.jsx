/**
 * Asset Manager Modal Component
 */
import { useState } from 'react';
import { FiX, FiImage, FiUpload, FiTrash2 } from 'react-icons/fi';
import AssetUploader from '../ui/AssetUploader';

const AssetManagerModal = ({ isOpen, onClose, entity, entityType }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(entity?.languagePrimary || 'en');
  const variants = ['portrait', 'landscape', 'square', 'banner'];
  const assetType = entityType === 'program' ? 'poster' : 'thumbnail';
  const availableLanguages = entity?.languagesAvailable || ['en'];

  const handleAssetUpload = (language, variant, result) => {
    console.log('Asset uploaded:', { language, variant, result });
  };

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-display">
                Asset Manager
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage {assetType}s for "{entity.title}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <label className="form-label">Select Language</label>
            <div className="flex flex-wrap gap-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {lang.toUpperCase()}
                  {lang === entity.languagePrimary && (
                    <span className="ml-1 text-xs opacity-75">(Primary)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {variants.map(variant => {
              const currentAsset = entity.assets?.[assetType + 's']?.[selectedLanguage]?.[variant];
              const isRequired = variant === 'portrait' || variant === 'landscape';
              
              return (
                <div key={variant} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 capitalize">
                      {variant}
                    </h4>
                    {isRequired && (
                      <span className="text-xs text-red-600 font-medium">Required</span>
                    )}
                  </div>
                  <AssetUploader
                    entityId={entity._id}
                    entityType={entityType}
                    language={selectedLanguage}
                    variant={variant}
                    assetType={assetType}
                    currentUrl={currentAsset}
                    onUploadSuccess={(result) => handleAssetUpload(selectedLanguage, variant, result)}
                    className="h-40"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {variant === 'portrait' && '3:4 ratio recommended'}
                    {variant === 'landscape' && '16:9 ratio recommended'}
                    {variant === 'square' && '1:1 ratio recommended'}
                    {variant === 'banner' && '21:9 ratio recommended'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Asset Requirements</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Portrait and landscape variants are required for the primary language</li>
              <li>• Images should be high quality (minimum 800px on the longest side)</li>
              <li>• Supported formats: JPEG, PNG, WebP</li>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Assets are required before publishing content</li>
            </ul>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManagerModal;
/**
 * Asset Upload Component with drag & drop
 */
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AssetUploader = ({ 
  entityId, 
  entityType, 
  language, 
  variant, 
  currentUrl, 
  onUploadSuccess,
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Simulate upload to cloud storage (in real app, this would upload to S3/Cloudinary)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock URL
      const mockUrl = `https://cdn.example.com/${entityType}s/${entityId}/${language}-${variant}-${Date.now()}.jpg`;
      
      // Call API to save asset URL
      const response = await fetch(`/api/admin/${entityType}s/${entityId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language,
          variant,
          url: mockUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save asset');
      }

      setPreview(mockUrl);
      onUploadSuccess?.(mockUrl);
      toast.success('Asset uploaded successfully!');

    } catch (error) {
      toast.error('Failed to upload asset');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }, [entityId, entityType, language, variant, currentUrl, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    disabled: uploading
  });

  const removeAsset = async () => {
    try {
      setUploading(true);
      
      // Simulate API call to remove asset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPreview(null);
      onUploadSuccess?.(null);
      toast.success('Asset removed successfully!');
      
    } catch (error) {
      toast.error('Failed to remove asset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {preview ? (
        // Show current asset
        <div className="relative group">
          <img
            src={preview}
            alt={`${variant} ${language}`}
            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <button
                  type="button"
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                  disabled={uploading}
                >
                  <FiUpload className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <button
                type="button"
                onClick={removeAsset}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                disabled={uploading}
              >
                <FiX className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-gray-600">Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Show upload area
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <FiImage className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                {variant} • {language.toUpperCase()} • PNG, JPG up to 5MB
              </p>
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      )}
      
      {/* Variant label */}
      <div className="absolute -top-2 -left-2">
        <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-md shadow-sm">
          {variant}
        </span>
      </div>
    </div>
  );
};

export default AssetUploader;
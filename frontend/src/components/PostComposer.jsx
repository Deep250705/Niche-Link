import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../services/api';

const PostComposer = ({ communityId, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editor toolbar settings
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setImages((prev) => [...prev, res.data.url]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image file');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Stripped validation
    const strippedContent = content.replace(/<[^>]*>/g, '').trim();

    if (!title.trim() || !strippedContent) {
      setError('Please provide a title and post description content');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/posts', {
        title,
        content,
        communityId,
        contentFormat: 'html',
        images
      });

      if (res.data.success) {
        setTitle('');
        setContent('');
        setImages([]);
        onPostCreated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 mb-4">
      <h5 className="mb-3">Start a Discussion</h5>
      
      {error && <div className="alert alert-danger py-2.5 small mb-3">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control bg-dark border-secondary text-light"
            placeholder="What's on your mind? Topic title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        {/* React Quill Editor Container */}
        <div className="mb-3 bg-dark text-light border border-secondary rounded overflow-hidden">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="Share professional insights, ideas, or links..."
            readOnly={loading}
          />
        </div>

        {/* Image upload row */}
        <div className="mb-4">
          <label className="form-label text-muted small d-block mb-2">Attach Images (Max 3)</label>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            {/* Upload Button */}
            {images.length < 3 && (
              <label className="btn btn-outline-secondary btn-sm p-3 d-flex flex-column align-items-center justify-content-center border-dashed" style={{ width: '90px', height: '90px', cursor: 'pointer' }}>
                <span className="fs-4">📷</span>
                <span className="fs-9 mt-1">{uploadingImage ? 'Uploading...' : 'Add Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="d-none"
                  disabled={uploadingImage || loading}
                />
              </label>
            )}

            {/* Uploaded Previews */}
            {images.map((imgUrl, index) => (
              <div key={index} className="position-relative" style={{ width: '90px', height: '90px' }}>
                <img
                  src={imgUrl}
                  alt="Attachment preview"
                  className="rounded w-100 h-100 border border-secondary"
                  style={{ objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="position-absolute top-0 end-0 bg-danger text-white rounded-circle border-0 small px-1.5 py-0.5"
                  style={{ transform: 'translate(35%, -35%)', fontSize: '9px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn btn-gradient-primary btn-sm px-4 d-flex align-items-center gap-1.5"
            disabled={loading || uploadingImage}
          >
            {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
            <span>Post</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostComposer;

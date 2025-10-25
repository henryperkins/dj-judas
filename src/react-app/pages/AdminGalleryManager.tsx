import React, { useState, useEffect, useMemo } from 'react';
import { LuPlus, LuTrash2, LuPencil, LuEye, LuEyeOff, LuUpload } from 'react-icons/lu';
import { localGalleryPhotos, type GalleryCategory } from '@/react-app/data/localGalleryPhotos';

interface GalleryPhoto {
  id: string;
  r2_key: string;
  src: string;
  alt: string;
  caption: string;
  category: string;
  sort_order: number;
  is_published: number;
  width?: number;
  height?: number;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

const FALLBACK_TIMESTAMP = '1970-01-01T00:00:00.000Z';
const FALLBACK_CATEGORIES: GalleryCategory[] = ['worship', 'youth choir', 'community', 'recording'];

const createFallbackPhotos = (): GalleryPhoto[] =>
  localGalleryPhotos.map((photo, index) => ({
    id: photo.id,
    r2_key: `local/${photo.id}`,
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
    category: photo.category,
    sort_order: index + 1,
    is_published: 1,
    created_at: FALLBACK_TIMESTAMP,
    updated_at: FALLBACK_TIMESTAMP,
  }));

const isLocalPhotoId = (id: string): boolean => id.startsWith('local-');

const AdminGalleryManager: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => createFallbackPhotos());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = useMemo<string[]>(() => {
    const ordered: string[] = [
      ...FALLBACK_CATEGORIES,
      ...localGalleryPhotos.map((photo) => photo.category),
      ...photos.map((photo) => photo.category),
    ];
    return Array.from(new Set(ordered));
  }, [photos]);

  // Form state
  const [formData, setFormData] = useState({
    url: '',
    alt: '',
    caption: '',
    category: FALLBACK_CATEGORIES[0],
    is_published: true,
  });

  // Load photos
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/gallery');
      if (!res.ok) throw new Error(`Failed to load photos: ${res.status}`);
      const data = await res.json() as { photos?: GalleryPhoto[] };
      const remotePhotos = Array.isArray(data.photos) ? data.photos : [];
      if (remotePhotos.length > 0) {
        setPhotos(remotePhotos);
      } else {
        setPhotos(createFallbackPhotos());
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setPhotos(createFallbackPhotos());
      setError('Failed to load gallery from API. Displaying local library instead.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Create new photo
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json() as { message?: string };
        throw new Error(errorData.message || `Upload failed: ${res.status}`);
      }

      await loadPhotos();
      setShowAddForm(false);
      setFormData({
        url: '',
        alt: '',
        caption: '',
        category: FALLBACK_CATEGORIES[0],
        is_published: true,
      });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Update photo metadata
  const handleUpdate = async (id: string, updates: Partial<GalleryPhoto>) => {
    if (isLocalPhotoId(id)) {
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === id ? { ...photo, ...updates } : photo
        )
      );
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error(`Update failed: ${res.status}`);

      await loadPhotos();
      setEditingId(null);
      setError(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Delete photo
  const handleDelete = async (id: string, caption: string) => {
    if (!confirm(`Delete "${caption}"?`)) return;

    if (isLocalPhotoId(id)) {
      setPhotos((current) => current.filter((photo) => photo.id !== id));
      return;
    }

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      await loadPhotos();
      setError(null);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // Toggle published status
  const togglePublished = async (photo: GalleryPhoto) => {
    if (isLocalPhotoId(photo.id)) {
      setPhotos((current) =>
        current.map((item) =>
          item.id === photo.id
            ? { ...item, is_published: item.is_published ? 0 : 1 }
            : item
        )
      );
      return;
    }

    await handleUpdate(photo.id, { is_published: photo.is_published ? 0 : 1 });
  };

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gallery Manager</h1>
            <p className="text-muted-foreground mt-1">
              Manage photo gallery - Images stored in R2
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
          >
            <LuPlus size={20} />
            Add Photo
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            Error: {error}
          </div>
        )}

        {/* Add Photo Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 p-6 bg-card border border-border rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Add New Photo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The image will be uploaded to R2 storage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alt Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="Descriptive alt text"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as GalleryCategory,
                    })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Caption <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Photo caption"
                  rows={2}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) =>
                      setFormData({ ...formData, is_published: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Published (visible on website)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition flex items-center gap-2"
              >
                <LuUpload size={16} />
                Upload to R2
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-muted rounded-md hover:bg-muted/70 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Photos List */}
        <div className="space-y-4">
          {photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No photos yet. Click "Add Photo" to get started.
            </div>
          ) : (
            photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row gap-4"
              >
                {/* Image Preview */}
                <div className="shrink-0">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full md:w-32 h-24 object-cover rounded-md"
                  />
                </div>

                {/* Photo Info */}
                <div className="flex-1 min-w-0">
                  {editingId === photo.id ? (
                    /* Edit Mode */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={photo.alt}
                        onChange={(e) => {
                          const updated = photos.map((p) =>
                            p.id === photo.id ? { ...p, alt: e.target.value } : p
                          );
                          setPhotos(updated);
                        }}
                        className="w-full px-2 py-1 border border-input rounded bg-background text-sm"
                        placeholder="Alt text"
                      />
                      <textarea
                        value={photo.caption}
                        onChange={(e) => {
                          const updated = photos.map((p) =>
                            p.id === photo.id ? { ...p, caption: e.target.value } : p
                          );
                          setPhotos(updated);
                        }}
                        className="w-full px-2 py-1 border border-input rounded bg-background text-sm"
                        rows={2}
                        placeholder="Caption"
                      />
                      <select
                        value={photo.category}
                        onChange={(e) => {
                          const updated = photos.map((p) =>
                            p.id === photo.id ? { ...p, category: e.target.value } : p
                          );
                          setPhotos(updated);
                        }}
                        className="w-full px-2 py-1 border border-input rounded bg-background text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdate(photo.id, {
                              alt: photo.alt,
                              caption: photo.caption,
                              category: photo.category,
                            })
                          }
                          className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            loadPhotos(); // Reset
                          }}
                          className="px-3 py-1 bg-muted text-sm rounded hover:bg-muted/70"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{photo.alt}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {photo.caption}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 bg-muted rounded">
                          {photo.category}
                        </span>
                        {isLocalPhotoId(photo.id) && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                            Local Asset (Read-only)
                          </span>
                        )}
                        <span>Order: {photo.sort_order}</span>
                        {photo.file_size && (
                          <span>{(photo.file_size / 1024).toFixed(0)} KB</span>
                        )}
                        <span className="truncate" title={photo.r2_key}>
                          {isLocalPhotoId(photo.id) ? 'Bundled' : `R2: ${photo.r2_key}`}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 shrink-0">
                  <button
                    onClick={() => togglePublished(photo)}
                    className={`p-2 rounded hover:bg-muted transition ${
                      photo.is_published ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                    title={photo.is_published ? 'Published' : 'Draft'}
                    disabled={isLocalPhotoId(photo.id)}
                  >
                    {photo.is_published ? <LuEye size={18} /> : <LuEyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingId(photo.id)}
                    className="p-2 rounded hover:bg-muted transition text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isLocalPhotoId(photo.id) ? 'Local photos cannot be edited' : 'Edit'}
                    disabled={isLocalPhotoId(photo.id)}
                  >
                    <LuPencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id, photo.caption)}
                    className="p-2 rounded hover:bg-muted transition text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isLocalPhotoId(photo.id) ? 'Local photos cannot be deleted' : 'Delete'}
                    disabled={isLocalPhotoId(photo.id)}
                  >
                    <LuTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {photos.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
            <p>
              <strong>{photos.length}</strong> photos total •{' '}
              <strong>{photos.filter((p) => p.is_published).length}</strong> published •{' '}
              <strong>{photos.filter((p) => !p.is_published).length}</strong> drafts
            </p>
            <p className="mt-1 text-xs">
              Images are stored in Cloudflare R2 (bucket: MEDIA_BUCKET/gallery/)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGalleryManager;

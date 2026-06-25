'use client'
import { useState } from 'react'

export default function ImageUploader({ onImagesChange, existingImages = [] }) {
    const [images, setImages] = useState(existingImages)
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    async function uploadImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('productId', 'temp')

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.success) {
                const newImages = [...images, { url: data.url, path: data.path }]
                setImages(newImages)
                onImagesChange(newImages)
            } else {
                alert('Upload failed: ' + data.error)
            }
        } catch (err) {
            alert('Error uploading: ' + err.message)
        }
        setUploading(false)
    }

    async function removeImage(index) {
        const image = images[index]
        try {
            await fetch(`/api/admin/upload?path=${encodeURIComponent(image.path)}`, {
                method: 'DELETE'
            })
            const newImages = images.filter((_, i) => i !== index)
            setImages(newImages)
            onImagesChange(newImages)
        } catch (err) {
            alert('Error deleting: ' + err.message)
        }
    }

    function handleDrag(e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    function handleDrop(e) {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        for (let i = 0; i < Math.min(files.length, 5); i++) {
            uploadImage(files[i])
        }
    }

    return (
        <div className="space-y-4">
            <label className="block font-semibold text-sm text-charcoal mb-2">Product Images</label>

            {/* Upload Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                    dragActive
                        ? 'border-coral bg-coral/5'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                <input
                    type="file"
                    id="imageInput"
                    multiple
                    accept="image/*"
                    onChange={e => {
                        if (e.target.files) {
                            for (let i = 0; i < Math.min(e.target.files.length, 5); i++) {
                                uploadImage(e.target.files[i])
                            }
                        }
                    }}
                    disabled={uploading}
                    className="hidden"
                />
                <label htmlFor="imageInput" className="cursor-pointer">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="font-semibold text-charcoal text-sm">
                        {uploading ? 'Uploading...' : 'Drag images here or click to upload'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Max 5 images, 5MB each</p>
                </label>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-charcoal mb-2">
                        Uploaded Images ({images.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((image, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={image.url}
                                    alt={`Product ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"
                                >
                                    <span className="text-white text-2xl">✕</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

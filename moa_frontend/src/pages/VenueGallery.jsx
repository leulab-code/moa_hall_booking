import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function VenueGallery({ venueId, isEditing, onImagesUpdate }) {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fetchImages = () => {
    // 1. Updated to Laravel API URL
    axios.get(`http://127.0.0.1:8000/api/venue_images_api?venue_id=${venueId}`)
      .then(res => setImages(res.data || []));
  };

  useEffect(() => {
    fetchImages();
    setCurrentIndex(0); 
  }, [venueId]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 4000); // 4 seconds
    return () => clearInterval(interval);
  }, [images]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const fileData = new FormData();
        fileData.append('file', file);
        // 2. Updated to Laravel Upload Route
        const uploadRes = await axios.post('http://127.0.0.1:8000/api/upload', fileData);
        if (uploadRes.data.success) {
          uploadedUrls.push(uploadRes.data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        // 3. Updated to Laravel Venue Images Route
        const saveRes = await axios.post('http://127.0.0.1:8000/api/venue_images_api', {
          venue_id: venueId,
          images: uploadedUrls
        });
        if (saveRes.data.success) {
          alert('Images added successfully!');
          fetchImages(); 
          if(onImagesUpdate) onImagesUpdate(); 
        }
      }
    } catch (err) { alert('Error uploading. Check server.'); }
    setIsUploading(false);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 ? (
        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
          <img 
            src={images[currentIndex]} 
            className="w-full h-full object-cover animate-in fade-in duration-700" 
            alt="Venue" 
          />
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-white/40'}`}></div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 text-sm font-medium border border-slate-100 border-dashed">
          No Images Available
        </div>
      )}

      {isEditing && (
        <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <label className="text-sm font-bold text-slate-700 block mb-2">Upload Multiple Venue Images</label>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleUpload} 
            disabled={isUploading}
            className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#198754] file:text-white file:cursor-pointer disabled:opacity-50" 
          />
          {isUploading && <p className="text-[10px] text-[#198754] mt-2 font-bold animate-pulse">Uploading...</p>}
        </div>
      )}
    </div>
  );
}
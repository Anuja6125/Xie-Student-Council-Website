import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GalleryHero from '@/components/GalleryHero';
import EventFilters from '@/components/EventFilters';
import { Loader2, Image as ImageIcon } from 'lucide-react';

// This interface now matches your MongoDB object exactly
interface GalleryImage {
  _id: { $oid: string } | string;
  image_url: string;
  event_category: string;
  event_name: string;
  sub_event_name?: string;
  caption?: string;
  uploaded_at: { $date: string } | string;
}

const Gallery = () => {
  const currentYear = new Date().getFullYear();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:5000/gallery");
      
      if (!res.ok) throw new Error("Failed to fetch gallery data");

      const data = await res.json();
      setImages(data);

      // Logic to set the default year to the most recent one found in the data
      if (data.length > 0) {
        const years = data.map((img: GalleryImage) => {
          const dateStr = typeof img.uploaded_at === 'object' ? img.uploaded_at.$date : img.uploaded_at;
          return new Date(dateStr).getFullYear();
        });
        setSelectedYear(Math.max(...years));
      }

    } catch (err: any) {
      setError(err.message || "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  // Filter Logic
  const filteredPhotos = useMemo(() => {
    return images.filter(img => {
      const dateStr = typeof img.uploaded_at === 'object' ? img.uploaded_at.$date : img.uploaded_at;
      const imgYear = new Date(dateStr).getFullYear();
      
      const categoryMatch = selectedCategory === 'all' || img.event_category === selectedCategory;
      const yearMatch = imgYear === selectedYear;
      
      return categoryMatch && yearMatch;
    });
  }, [images, selectedCategory, selectedYear]);

  // Extract unique years for the filter dropdown
  const availableYears = useMemo(() => {
    const years = images.map(img => {
      const dateStr = typeof img.uploaded_at === 'object' ? img.uploaded_at.$date : img.uploaded_at;
      return new Date(dateStr).getFullYear();
    });
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [images]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Curating your memories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        <GalleryHero />
        
        <EventFilters 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          availableYears={availableYears}
        />

        <section className="container mx-auto px-4 py-12 min-h-[400px]">
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <div 
                  key={typeof photo._id === 'object' ? photo._id.$oid : photo._id} 
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <img 
                    src={photo.image_url} 
                    alt={photo.event_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                      {photo.event_category} {photo.sub_event_name ? `| ${photo.sub_event_name}` : ''}
                    </span>
                    <h4 className="text-white font-semibold text-lg leading-tight">
                      {photo.event_name}
                    </h4>
                    {photo.caption && (
                      <p className="text-gray-300 text-sm mt-1 italic line-clamp-1">
                        "{photo.caption}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <ImageIcon className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No photos found</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                No images for {selectedCategory === 'all' ? 'any category' : `the ${selectedCategory} category`} in {selectedYear}.
              </p>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
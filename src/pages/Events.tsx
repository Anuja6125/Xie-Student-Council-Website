import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventDetailsModal from '@/components/EventDetailsModal';
import { Loader2, Calendar, MapPin, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Event {
  _id: string;
  event_name: string;
  event_type: string;
  event_category_name: string;
  description: string;

  // 🔥 FIX: support both formats (your DB vs UI usage)
  banner_image_url?: string;
  banner?: {
    url: string;
  };

  // 🔥 NEW: PDF support
  document?: {
    url: string;
  };

  date_time: string;
  duration: string;
  venue: string;
  socials?: any;
  contact_details?: any;
  year: number;
  status: string;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/events");
      const data = await res.json();

      // 🔥 Normalize backend → frontend
      const normalized = (data || []).map((e: any) => ({
        ...e,
        banner_image_url: e.banner?.url || e.banner_image_url,
        document: e.document || null
      }));

      setEvents(normalized);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'ongoing':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cultural':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'technical':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sports':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Date TBA';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Date TBA';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-24 pb-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              All Events
            </h1>
            <p className="text-lg text-gray-600">
              Explore our upcoming and past events. Click on any event to view full details.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  onClick={() => handleViewDetails(event)}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-600/20 overflow-hidden">
                    
                    {/* 🔥 FIXED image source */}
                    {(event.banner_image_url || event.banner?.url) ? (
                      <img 
                        src={event.banner_image_url || event.banner?.url} 
                        alt={event.event_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-16 w-16 text-gray-300" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    <div className="absolute top-4 left-4">
                      <Badge className={`${getStatusColor(event.status)} shadow-lg`}>
                        {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                      </Badge>
                    </div>

                    <div className="absolute top-4 right-4">
                      <Badge className={`${getTypeColor(event.event_type)} border shadow-lg`}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.event_name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.event_category_name}
                    </p>

                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date_time)}</span>
                      </div>

                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Check back later for upcoming events</p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default Events;
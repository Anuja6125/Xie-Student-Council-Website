import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Award, FileText, ShieldCheck, Trophy, Share2, Mail, Phone, MessageCircle, Facebook, Instagram, Twitter, Linkedin, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface EventDetailsModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose }) => {
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cultural': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'technical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sports': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Date TBA';
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? 'Date TBA' : date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Time TBA';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleShare = async () => {
    const text = `Check out ${event.event_name}!`;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event.event_name, text, url }); }
      catch (error) { console.log('Error sharing:', error); }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Page link copied to clipboard" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="min-h-screen px-2 py-4 sm:px-4 sm:py-8">
        <div className="bg-white rounded-3xl max-w-5xl mx-auto shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          
          {/* Header Image Section */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-primary/20 to-purple-600/20">
            {event.banner_image_url && (
              <>
                <img src={event.banner_image_url} alt={event.event_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              </>
            )}
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <X className="h-5 w-5 text-gray-700" />
            </button>
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className={`${getStatusColor(event.status)} text-white px-3 py-1 shadow-md border-0`}>
                {event.status?.toUpperCase() || 'UPCOMING'}
              </Badge>
              <Badge className={`${getTypeColor(event.event_type)} px-3 py-1 border shadow-md`}>
                {event.event_type}
              </Badge>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{event.event_name}</h1>
              <p className="text-white/90 text-lg font-medium">{event.event_category_name}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: <Calendar className="text-blue-600" />, label: 'Date', val: formatDate(event.date_time) },
                { icon: <Clock className="text-purple-600" />, label: 'Time', val: formatTime(event.date_time) },
                { icon: <MapPin className="text-green-600" />, label: 'Venue', val: event.venue || 'TBA' },
                { icon: <Award className="text-yellow-600" />, label: 'Duration', val: event.duration || 'TBA' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{stat.label}</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate px-1">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                
                {/* About Section */}
                {event.description && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h2 className="text-xl font-bold text-gray-900">About Event</h2>
                    </div>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                  </section>
                )}

                {/* --- PDF VIEWER SECTION --- */}
                {event.document?.url && (
                  <section className="pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        <h2 className="text-xl font-bold text-gray-900">Event PDF</h2>
                      </div>
                      <a 
                        href={event.document.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-red-600 flex items-center gap-1 hover:underline"
                      >
                        <Maximize2 className="h-3 w-3" /> FULL SCREEN
                      </a>
                    </div>
                    
                    {/* Embedded Viewer Container */}
                    <div className="relative w-full aspect-[3/4] sm:aspect-video bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                      <iframe
                        src={`${event.document.url}#toolbar=0&navpanes=0&scrollbar=0`}
                        className="w-full h-full"
                        title="Event Document Viewer"
                      />
                    </div>
                    <p className="mt-2 text-center text-xs text-gray-400">
                      Viewing: {event.document.filename || "event-details.pdf"}
                    </p>
                  </section>
                )}

                {/* Registration Section */}
                {event.registration_links?.length > 0 && (
                  <section className="pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-900">Secure Registration</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {event.registration_links.map((item: any, index: number) => (
                        <a
                          key={index}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-bold group"
                        >
                          Register Now (Page {item.page})
                          <Maximize2 className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Rules & Prize Details */}
                {event.rules && (
                  <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Rules & Regulations
                    </h3>
                    <p className="text-sm text-blue-800/80 leading-relaxed">{event.rules}</p>
                  </div>
                )}
                
                {event.prize_details && (
                  <div className="p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100">
                    <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Prize Pool
                    </h3>
                    <p className="text-sm text-yellow-800 leading-relaxed font-semibold">{event.prize_details}</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Share</h3>
                  <Button onClick={handleShare} className="w-full rounded-xl py-6" variant="outline">
                    <Share2 className="mr-2 h-4 w-4" /> Copy Event Link
                  </Button>
                </div>

                {event.contact_details && (
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Help & Support</h3>
                    <div className="space-y-4">
                      {event.contact_details.email && (
                        <a href={`mailto:${event.contact_details.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Mail className="h-4 w-4 text-blue-600" /></div>
                          <span className="truncate font-medium">{event.contact_details.email}</span>
                        </a>
                      )}
                      {event.contact_details.phone && (
                        <a href={`tel:${event.contact_details.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Phone className="h-4 w-4 text-green-600" /></div>
                          <span className="font-medium">{event.contact_details.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-5 bg-gray-900 rounded-2xl text-white">
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Final Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Category</span>
                      <span className="font-medium">{event.event_type}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Edition</span>
                      <span className="font-medium">{event.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400 font-bold uppercase text-[10px] bg-green-400/10 px-2 py-1 rounded-md">{event.status}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
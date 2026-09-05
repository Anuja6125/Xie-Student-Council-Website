import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AddEditEventModal from './AddEditEventModal';
import ViewEventModal from './ViewEventModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Event {
  _id: string;
  event_name: string;
  event_type: string;
  event_category_name: string;
  description: string;
  banner_image_url: string;
  date_time: string;
  duration: string;
  venue: string;
  year: number;
  status: string;
  prize_details: string;
  created_at: string;
}

const calculateStatus = (dateTime, durationStr) => {
  if (!dateTime) return 'upcoming';
  
  const start = new Date(dateTime).getTime();
  const now = new Date().getTime();
  
  // Parse duration (default to 2 hours if parsing fails or is empty)
  let durationMs = 2 * 60 * 60 * 1000; 
  const match = durationStr?.toLowerCase().match(/(\d+)\s*(hour|day|min)/);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit.includes('day')) durationMs = value * 24 * 60 * 60 * 1000;
    else if (unit.includes('hour')) durationMs = value * 60 * 60 * 1000;
    else if (unit.includes('min')) durationMs = value * 60 * 1000;
  }

  const end = start + durationMs;

  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
};

const EventsManagement: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedYear, selectedType, selectedStatus]);

const calculateStatus = (dateTime: string, durationStr: string) => {
  if (!dateTime) return 'upcoming';
  
  const start = new Date(dateTime).getTime();
  const now = new Date().getTime();
  
  let durationMs = 2 * 60 * 60 * 1000; // Default 2 hours
  const match = durationStr?.toLowerCase().match(/(\d+)\s*(hour|day|min)/);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit.includes('day')) durationMs = value * 24 * 60 * 60 * 1000;
    else if (unit.includes('hour')) durationMs = value * 60 * 60 * 1000;
    else if (unit.includes('min')) durationMs = value * 60 * 1000;
  }

  const end = start + durationMs;
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
};

const fetchEvents = async () => {
  try {
    setLoading(true);
    const res = await fetch("http://localhost:5000/events");
    const data = await res.json();

    // Map through events and refresh their status based on the current time
    const updatedEvents = (data || []).map((event: Event) => ({
      ...event,
      status: calculateStatus(event.date_time, event.duration)
    }));

    setEvents(updatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

  const filterEvents = () => {
    let filtered = [...events];

    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(event => event.year === parseInt(selectedYear));
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.event_type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    setFilteredEvents(filtered);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsAddEditModalOpen(true);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

   
  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      const res = await fetch(
        `http://localhost:5000/events/${eventToDelete._id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchEvents();

    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cultural': return 'bg-purple-100 text-purple-800';
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'sports': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableYears = Array.from(new Set(events.map(e => e.year))).sort((a, b) => b - a);
  const availableTypes = Array.from(new Set(events.map(e => e.event_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Events Management</h2>
      <Button onClick={handleAddEvent}>
        <Plus className="w-4 h-4 mr-2" />
        Add Event
      </Button>
    </div>

    {/* Filters */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Input
        placeholder="Search events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          <SelectItem value="all">All Years</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger>
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          <SelectItem value="all">All Types</SelectItem>
          {availableTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="ongoing">Ongoing</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Events List */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredEvents.length === 0 ? (
        <p className="text-gray-500">No events found</p>
      ) : (
        filteredEvents.map((event) => (
          <Card key={event._id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">
                  {event.event_name}
                </h3>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>

              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date(event.date_time).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  {new Date(event.date_time).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {event.venue}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Badge className={getTypeColor(event.event_type)}>
                  {event.event_type}
                </Badge>

                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleViewEvent(event)}>
                    <Eye size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleEditEvent(event)}>
                    <Edit size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(event)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>

    {/* Modals */}
    <AddEditEventModal
  isOpen={isAddEditModalOpen}
  onClose={() => setIsAddEditModalOpen(false)}
  event={selectedEvent}
  onSuccess={() => {
    setIsAddEditModalOpen(false);
    fetchEvents(); // refresh list
  }}
/>

    <ViewEventModal
  isOpen={isViewModalOpen}
  onClose={() => setIsViewModalOpen(false)}
  event={selectedEvent}
  onEdit={() => handleEditEvent(selectedEvent!)}
/>

    {/* Delete Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the event "{eventToDelete?.event_name}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
};

export default EventsManagement;
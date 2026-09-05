import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  Eye,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getUserName } from '@/lib/utils';

// Local UI Components to prevent import errors causing white screens
const Badge = ({ children, variant = "default", className = "" }: any) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${variant === "outline" ? "border border-gray-300" : "bg-primary/10 text-primary"} ${className}`}>
    {children}
  </span>
);

const Separator = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-gray-200 w-full ${className}`} />
);

const API = "http://localhost:5000";

interface Event { _id: string; event_name: string; year: number; }
interface SubEvent { _id: string; event_id: string; sub_event_name: string; }
interface GalleryImage {
  _id: string;
  event_id: string;
  sub_event_id: string | null;
  event_name: string;
  sub_event_name: string | null;
  event_category: string;
  image_url: string;
  cloudinary_id: string;
  caption: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

const EventGallery: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Data States
  const [events, setEvents] = useState<Event[]>([]);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('all-events');
  const [selectedSubEvent, setSelectedSubEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadEventId, setUploadEventId] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('General');
  const [uploadSubEventName, setUploadSubEventName] = useState<string>('');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Action States
  const [viewImage, setViewImage] = useState<GalleryImage | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => { 
    const init = async () => {
      await Promise.all([fetchEvents(), fetchGalleryImages()]);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedEvent && selectedEvent !== 'all-events') fetchSubEvents(selectedEvent);
    else setSubEvents([]);
  }, [selectedEvent]);

  useEffect(() => { filterImages(); }, [galleryImages, selectedEvent, selectedSubEvent, searchQuery]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API}/events`);
      const data = await res.json();
      setEvents(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSubEvents = async (id: string) => {
    try {
      const res = await fetch(`${API}/sub-events/${id}`);
      const data = await res.json();
      setSubEvents(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/gallery`);
      const data = await res.json();
      setGalleryImages(data || []);
    } catch { 
      toast({ title: "Error", description: "Failed to load gallery", variant: "destructive" }); 
    } finally { setLoading(false); }
  };

  const filterImages = () => {
    let filtered = [...galleryImages];
    if (selectedEvent !== 'all-events') filtered = filtered.filter(img => img.event_id === selectedEvent);
    if (selectedSubEvent !== 'all') {
      if (selectedSubEvent === 'main') filtered = filtered.filter(img => !img.sub_event_id);
      else filtered = filtered.filter(img => img.sub_event_id === selectedSubEvent);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(img =>
        img.sub_event_name?.toLowerCase().includes(q) ||
        img.caption?.toLowerCase().includes(q)
      );
    }
    setFilteredImages(filtered);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 10) {
      toast({ title: "Limit Reached", description: "Max 10 images", variant: "destructive" });
      return;
    }
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!uploadEventId || selectedFiles.length === 0) return;
    try {
      setUploading(true);
      const formData = new FormData();
      const selectedEventObj = events.find(e => e._id === uploadEventId);
      selectedFiles.forEach(f => formData.append('images', f));
      formData.append('event_id', uploadEventId);
      formData.append('event_name', selectedEventObj?.event_name || "");
      formData.append('event_category', uploadCategory);
      formData.append('sub_event_name', uploadSubEventName);
      formData.append('caption', uploadCaption);
      formData.append('uploaded_by', getUserName());

      const res = await fetch(`${API}/gallery/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      
      toast({ title: "Success", description: "Images uploaded!" });
      setIsUploadModalOpen(false);
      setPreviews([]); setSelectedFiles([]);
      fetchGalleryImages();
    } catch (err) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;
    try {
      await fetch(`${API}/gallery/${imageToDelete._id}`, { method: 'DELETE' });
      fetchGalleryImages();
      setIsDeleteDialogOpen(false);
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Gallery</h1>
          <p className="text-gray-500">Manage high-quality event visuals</p>
        </div>
        <Button onClick={() => { setPreviews([]); setSelectedFiles([]); setIsUploadModalOpen(true); }}>
          <Upload className="mr-2 h-4 w-4" /> Upload Images
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger><SelectValue placeholder="Select Event" /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all-events">All Events</SelectItem>
              {events.map(e => <SelectItem key={e._id} value={e._id}>{e.event_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSubEvent} onValueChange={setSelectedSubEvent} disabled={selectedEvent === 'all-events'}>
            <SelectTrigger><SelectValue placeholder="Sub-Event" /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="main">Main Only</SelectItem>
              {subEvents.map(s => <SelectItem key={s._id} value={s._id}>{s.sub_event_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-9" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredImages.map(img => (
          <div key={img._id} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md border">
            <img src={img.image_url} className="w-full h-full object-cover" alt="" />
            <div className="absolute top-2 right-2"><Badge className="bg-white/90 text-[10px]">{img.event_category}</Badge></div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => { setViewImage(img); setIsViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
              <Button size="icon" variant="destructive" onClick={() => { setImageToDelete(img); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Upload Gallery Images</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Target Event</Label>
                <Select value={uploadEventId} onValueChange={setUploadEventId}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {events.map(e => <SelectItem key={e._id} value={e._id}>{e.event_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={uploadCategory} onValueChange={setUploadCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Cultural">Cultural</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sub-Event (Optional)</Label>
              <Input value={uploadSubEventName} onChange={e => setUploadSubEventName(e.target.value)} placeholder="e.g. Stage Performance" />
            </div>
            <div className="space-y-1">
              <Label>Caption</Label>
              <Textarea value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="Add a story..." />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Queue ({selectedFiles.length}/10)</Label>
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={selectedFiles.length >= 10}>
                  <Plus className="h-4 w-4 mr-1" /> Add More
                </Button>
              </div>
              {previews.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center bg-gray-50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">Click to select images</p>
                </div>
              ) : (
                <div className="relative flex gap-3 overflow-x-auto p-2 border rounded-xl" ref={scrollContainerRef}>
                  {previews.map((url, i) => (
                    <div key={i} className="relative flex-shrink-0 w-24 aspect-square rounded-lg overflow-hidden border">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
            <Button className="w-full" onClick={handleUpload} disabled={uploading || selectedFiles.length === 0}>
              {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? "Uploading..." : `Confirm Upload (${selectedFiles.length})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          {viewImage && (
            <div className="flex flex-col md:flex-row h-full">
              <div className="flex-1 flex items-center justify-center bg-black">
                <img src={viewImage.image_url} className="max-w-full max-h-[80vh] object-contain" alt="" />
              </div>
              <div className="w-full md:w-80 bg-white p-6">
                <Badge className="mb-2">{viewImage.event_category}</Badge>
                <h3 className="text-xl font-bold">{viewImage.sub_event_name || viewImage.event_name}</h3>
                <Separator className="my-4" />
                <p className="text-sm text-gray-600">{viewImage.caption || "No caption provided."}</p>
                <div className="mt-10 text-[10px] text-gray-400 uppercase">Uploaded by {viewImage.uploaded_by}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete forever?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventGallery;
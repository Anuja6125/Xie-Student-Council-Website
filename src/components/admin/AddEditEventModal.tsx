import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Calendar, MapPin, Clock, Award, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddEditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  onSuccess: () => void;
}
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

const AddEditEventModal: React.FC<AddEditEventModalProps> = ({ isOpen, onClose, event, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // File States
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  
  const [registrationLinks, setRegistrationLinks] = useState([{ page: '', link: '' }]);

  const [formData, setFormData] = useState({
    event_name: '',
    event_type: '',
    event_category_name: '',
    description: '',
    date_time: '',
    duration: '',
    venue: 'Xavier Institute of Engineering, ',
    year: new Date().getFullYear(),
    status: 'upcoming',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    email: '',
    phone: '',
    whatsapp: ''
  });

  const eventTypes = ['Cultural', 'Technical', 'Sports'];
  const eventStatuses = ['upcoming', 'ongoing', 'completed'];
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);

  useEffect(() => {
    if (event) {
      setFormData({
        event_name: event.event_name || '',
        event_type: event.event_type || '',
        event_category_name: event.event_category_name || '',
        description: event.description || '',
        date_time: event.date_time ? event.date_time.slice(0, 16) : '',
        duration: event.duration || '',
        venue: event.venue || 'Xavier Institute of Engineering, ',
        year: event.year || new Date().getFullYear(),
        status: event.status || 'upcoming',
        facebook: event.socials?.facebook || '',
        instagram: event.socials?.instagram || '',
        twitter: event.socials?.twitter || '',
        linkedin: event.socials?.linkedin || '',
        email: event.contact_details?.email || '',
        phone: event.contact_details?.phone || '',
        whatsapp: event.contact_details?.whatsapp || ''
      });
      setBannerPreview(event.banner?.url || '');
      setRegistrationLinks(event.registration_links || [{ page: '', link: '' }]);
    } else {
      resetForm();
    }
  }, [event, isOpen]);

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_type: '',
      event_category_name: '',
      description: '',
      date_time: '',
      duration: '',
      venue: 'Xavier Institute of Engineering, ',
      year: new Date().getFullYear(),
      status: 'upcoming',
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      email: '',
      phone: '',
      whatsapp: ''
    });
    setBannerPreview('');
    setBannerFile(null);
    setPdfFile(null);
    setRegistrationLinks([{ page: '', link: '' }]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // Calculate status right before sending to backend
  const autoStatus = calculateStatus(formData.date_time, formData.duration);

  try {
    const data = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      // Override the status field with our calculated value
      if (key === 'status') {
        data.append(key, autoStatus);
      } else {
        data.append(key, value.toString());
      }
    });

    if (bannerFile) data.append('banner', bannerFile);
    if (pdfFile) data.append('pdf', pdfFile);
    data.append('registration_links', JSON.stringify(registrationLinks));

    const url = event 
      ? `http://localhost:5000/events/${event._id}` 
      : "http://localhost:5000/events";
    
    const method = event ? "PUT" : "POST";
    const res = await fetch(url, { method, body: data });

    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = { error: text || "Server Error" };
    }

    if (!res.ok) throw new Error(result.error || "Failed to save");

    toast({ title: "Success", description: `Event saved as ${autoStatus}` });
    onSuccess();
    onClose();
  } catch (error: any) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {event ? 'Update the details of your existing event.' : 'Fill in the details to create a new campus event.'}
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="banner">Banner</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Event Name *</Label>
                  <Input name="event_name" value={formData.event_name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label>Event Type *</Label>
                  <Select value={formData.event_type} onValueChange={(v) => setFormData(p => ({ ...p, event_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {eventTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.event_category_name} onValueChange={(v) => setFormData(p => ({ ...p, event_category_name: v }))}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="SPARX">SPARX</SelectItem>
                      <SelectItem value="SPANDAN">SPANDAN</SelectItem>
                      <SelectItem value="TRANSMISSION">TRANSMISSION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input name="date_time" type="datetime-local" value={formData.date_time} onChange={handleInputChange} />
                <Input name="duration" placeholder="Duration (e.g. 2 days)" value={formData.duration} onChange={handleInputChange} />
                <div className="col-span-2">
                   <Label>Venue</Label>
                   <Input name="venue" value={formData.venue} onChange={handleInputChange} />
                </div>
                <div className="col-span-2 border-t pt-4">
                  <Label>Upload Event PDF (Rules/Schedule)</Label>
                  <Input type="file" accept=".pdf" onChange={handlePdfChange} />
                </div>
                <div className="col-span-2">
                  <Label className="mb-2 block">Registration Links</Label>
                  {registrationLinks.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input placeholder="Page/Label" value={item.page} onChange={(e) => {
                        const newLinks = [...registrationLinks];
                        newLinks[idx].page = e.target.value;
                        setRegistrationLinks(newLinks);
                      }} />
                      <Input placeholder="URL" value={item.link} onChange={(e) => {
                        const newLinks = [...registrationLinks];
                        newLinks[idx].link = e.target.value;
                        setRegistrationLinks(newLinks);
                      }} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setRegistrationLinks([...registrationLinks, { page: '', link: '' }])}>
                    + Add Link
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                    <Input name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} />
                    <Input name="instagram" placeholder="Instagram URL" value={formData.instagram} onChange={handleInputChange} />
                    <Input name="whatsapp" placeholder="WhatsApp Number" value={formData.whatsapp} onChange={handleInputChange} />
                </div>
            </TabsContent>

            <TabsContent value="banner" className="space-y-4 pt-4">
                {bannerPreview && (
                    <div className="w-full h-48 overflow-hidden rounded-md border mb-4">
                        <img src={bannerPreview} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                )}
                <Label>Select Banner Image</Label>
                <Input type="file" accept="image/*" onChange={handleBannerChange} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditEventModal;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import emailjs from '@emailjs/browser';
import {
  Shield,
  Upload,
  Clock,
  Eye,
  Download,
  Trash2,
  Copy,
  Lock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Key,
  Send,
  AlertTriangle,
  UserCheck,
  Mail
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { getUserName, getUserData } from "@/lib/utils";

const SERVER_URL = 'http://localhost:5000';

// EmailJS Configuration
const EMAIL_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
};


interface ConfidentialDoc {
  id: string;
  title: string;
  description: string;
  file_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  encrypted_url: string;
  expires_at: string;
  max_views: number | null;
  view_count: number;
  download_count: number;
  require_auth: boolean;
  allowed_emails: string[];
  access_code: string | null;
  is_active: boolean;
  uploaded_by: string;
  uploaded_at: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
  department: string;
}

interface ValidatedRecipient {
  email: string;
  name: string;
  type: 'student' | 'admin';
  isValid: boolean;
}

const ConfidentialDocuments: React.FC = () => {
  const { toast } = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresIn, setExpiresIn] = useState('24'); // hours
  const [maxViews, setMaxViews] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [requireAuth, setRequireAuth] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  
  // Students list for validation
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [validatedRecipients, setValidatedRecipients] = useState<ValidatedRecipient[]>([]);
  
  // Documents list
  const [documents, setDocuments] = useState<ConfidentialDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ConfidentialDoc | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    emailjs.init(EMAIL_CONFIG.publicKey);
    fetchDocuments();
    fetchStudents();
  }, []);

const fetchStudents = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/students`);
    const data = await res.json();
    setAllStudents(data || []);
  } catch (error) {
    console.error('Error fetching students:', error);
  }
};

const fetchDocuments = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/confidential-documents`);
    const data = await res.json();
    setDocuments(data || []);
  } catch (error) {
    console.error('Error fetching documents:', error);
    toast({
      title: "Error",
      description: "Failed to load documents",
      variant: "destructive"
    });
  }
};

const validateRecipients = async (emails: string[]) => {
  const validated: ValidatedRecipient[] = [];

  for (const email of emails) {
    const trimmedEmail = email.trim().toLowerCase();

    const student = allStudents.find(s => s.email.toLowerCase() === trimmedEmail);

    if (student) {
      validated.push({
        email: student.email,
        name: student.name,
        type: 'student',
        isValid: true
      });
      continue;
    }

    // 🔥 MongoDB API check
    try {
      const res = await fetch(`${SERVER_URL}/api/admins/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail })
      });

      const adminData = await res.json();

      if (adminData && adminData.status === 'approved') {
        validated.push({
          email: adminData.email,
          name: adminData.name,
          type: 'admin',
          isValid: true
        });
      } else {
        validated.push({
          email: trimmedEmail,
          name: 'Unknown',
          type: 'student',
          isValid: false
        });
      }
    } catch {
      validated.push({
        email: trimmedEmail,
        name: 'Unknown',
        type: 'student',
        isValid: false
      });
    }
  }

  return validated;
};

  const handleValidateEmails = async () => {
    if (!recipientEmails.trim()) {
      toast({
        title: "No recipients",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }

    const emails = recipientEmails.split(/[,;\n]/).map(e => e.trim()).filter(e => e);
    const validated = await validateRecipients(emails);
    setValidatedRecipients(validated);

    const invalidCount = validated.filter(r => !r.isValid).length;
    
    if (invalidCount > 0) {
      toast({
        title: "⚠️ Some emails are invalid",
        description: `${invalidCount} email(s) not found in student/admin database`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ All emails validated",
        description: `${validated.length} valid recipient(s) found`,
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      toast({
        title: "Missing title",
        description: "Please enter a document title first",
        variant: "destructive"
      });
      e.target.value = '';
      return;
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const validEmails = validatedRecipients.filter(r => r.isValid).map(r => r.email).join(',');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('expiresIn', expiresIn);
      formData.append('maxViews', maxViews);
      formData.append('allowedEmails', validEmails);
      formData.append('accessCode', accessCode);
      formData.append('requireAuth', requireAuth.toString());
      formData.append('uploadedBy', localStorage.getItem('userData') ? getUserData() : 'Admin');

      const response = await fetch(`${SERVER_URL}/api/upload-confidential`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result);

// Save to MongoDB via backend
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

const saveRes = await fetch(`${SERVER_URL}/api/confidential-documents`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title,
    description,
    file_id: result.fileId,
    file_name: result.fileName,
    file_size: result.size,
    file_type: result.mimeType,
    encrypted_url: result.fileUrl,
    expires_at: expiresAt.toISOString(),
    max_views: maxViews ? parseInt(maxViews) : null,
    allowed_emails: validEmails ? validEmails.split(',').map((e: string) => e.trim()) : [],
    access_code: accessCode || null,
    require_auth: requireAuth,
    uploaded_by: localStorage.getItem('userData')
      ? getUserData()
      : 'Admin'
  })
});

const dbData = await saveRes.json();

      toast({
        title: "✅ Document Uploaded",
        description: `${result.fileName} uploaded successfully. Ready to send emails.`,
      });

      // Auto-send emails if recipients are validated
      if (validatedRecipients.filter(r => r.isValid).length > 0) {
        await sendEmailsToRecipients(result, dbData);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const sendEmailsToRecipients = async (fileData: any, docData: any) => {
    setIsSendingEmails(true);
    
    const validRecipients = validatedRecipients.filter(r => r.isValid);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const recipient of validRecipients) {
        try {
          const expiryDate = new Date(docData.expires_at).toLocaleString();
          
          let emailMessage = `Hello ${recipient.name},\n\n`;
          emailMessage += `You have been granted access to a confidential document:\n\n`;
          emailMessage += `📄 Document: ${title}\n`;
          if (description) {
            emailMessage += `📝 Description: ${description}\n`;
          }
          emailMessage += `⏰ Valid Until: ${expiryDate}\n`;
          if (maxViews) {
            emailMessage += `👁️ Maximum Views: ${maxViews}\n`;
          }
          if (accessCode) {
            emailMessage += `🔐 Access Code: ${accessCode}\n`;
          }
          emailMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          emailMessage += `🔗 SECURE ACCESS LINK:\n`;
          emailMessage += `${fileData.fileUrl}${requireAuth ? `?email=${recipient.email}` : ''}${accessCode ? `&code=${accessCode}` : ''}\n\n`;
          emailMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          emailMessage += `⚠️ SECURITY NOTICE:\n`;
          emailMessage += `• This link is encrypted and secured\n`;
          emailMessage += `• Do not share this link with anyone\n`;
          emailMessage += `• The link will expire on ${expiryDate}\n`;
          if (maxViews) {
            emailMessage += `• Limited to ${maxViews} view(s)\n`;
          }
          emailMessage += `\nIf you did not expect this email, please contact the admin immediately.\n\n`;
          emailMessage += `Best regards,\n`;
          emailMessage += `Xavier College Student Council`;

          const templateParams = {
            to_email: recipient.email,
            to_name: recipient.name,
            subject: `🔐 Confidential Document: ${title}`,
            message: emailMessage,
            from_name: `Admin - Xavier College`
          };

          const response = await emailjs.send(
            EMAIL_CONFIG.serviceId,
            EMAIL_CONFIG.templateId,
            templateParams
          );

          if (response.status === 200) {
            successCount++;
            console.log(`✅ Sent to ${recipient.email}`);
          } else {
            failCount++;
            console.error(`❌ Failed to send to ${recipient.email}`);
          }

          // Delay between emails
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error sending to ${recipient.email}:`, error);
          failCount++;
        }
      }

await fetch(`${SERVER_URL}/api/document-access-logs`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document_id: docData.id,
    accessed_by_email: 'system',
    accessed_by_name: 'Email Distribution',
    access_type: 'email_sent',
    access_granted: true,
    user_agent: `Sent to ${successCount} recipients`
  })
});


      toast({
        title: "✅ Emails Sent",
        description: `Successfully sent to ${successCount} recipient(s). Failed: ${failCount}`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setMaxViews('');
      setRecipientEmails('');
      setAccessCode('');
      setUploadedFile(null);
      setValidatedRecipients([]);
      
      // Refresh list
      fetchDocuments();

    } catch (error: any) {
      console.error('Email sending error:', error);
      toast({
        title: "Email sending failed",
        description: error.message || "Failed to send emails",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "✅ Link Copied",
      description: "Document link copied to clipboard",
    });
  };

  const deactivateDocument = async (docId: string) => {
  try {
    await fetch(`${SERVER_URL}/api/confidential-documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false })
    });

    toast({
      title: "Document Deactivated",
      description: "Document access has been revoked",
    });

    fetchDocuments();
  } catch (error) {
    console.error('Error:', error);
    toast({
      title: "Error",
      description: "Failed to deactivate document",
      variant: "destructive"
    });
  }
};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const isViewLimitReached = (doc: ConfidentialDoc) => {
    return doc.max_views !== null && doc.view_count >= doc.max_views;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Confidential Documents</h2>
        <p className="text-gray-600 mt-1">Upload secure documents and send encrypted links to validated recipients</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Send</TabsTrigger>
          <TabsTrigger value="documents">Active Documents</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Upload Confidential Document
              </CardTitle>
              <CardDescription>
                Upload files with security settings and send to validated users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Document Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Annual Budget Report 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expires In (hours) *
                  </label>
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white">
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours (1 day)</SelectItem>
                      <SelectItem value="48">48 hours (2 days)</SelectItem>
                      <SelectItem value="72">72 hours (3 days)</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Eye className="w-4 h-4 inline mr-1" />
                    Max Views (optional)
                  </label>
                  <Input
                    type="number"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Recipient Emails *
                </label>
                <Textarea
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  placeholder="Enter emails (comma or line separated)&#10;e.g., student1@example.com, student2@example.com"
                  rows={4}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleValidateEmails}
                    variant="outline"
                    size="sm"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Validate Recipients
                  </Button>
                  {validatedRecipients.length > 0 && (
                    <Badge variant={validatedRecipients.every(r => r.isValid) ? "default" : "destructive"}>
                      {validatedRecipients.filter(r => r.isValid).length} valid / {validatedRecipients.length} total
                    </Badge>
                  )}
                </div>
              </div>

              {/* Validated Recipients Display */}
              {validatedRecipients.length > 0 && (
                <Alert>
                  <UserCheck className="h-4 w-4" />
                  <AlertTitle>Validated Recipients</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1">
                      {validatedRecipients.map((recipient, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {recipient.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={recipient.isValid ? 'text-green-900' : 'text-red-900'}>
                            {recipient.email} - {recipient.name}
                            {recipient.isValid && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {recipient.type}
                              </Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Access Code (optional)
                </label>
                <Input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter a secret code"
                />
                <p className="text-xs text-gray-500 mt-1">Recipients will need this code to access the document</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireAuth"
                  checked={requireAuth}
                  onChange={(e) => setRequireAuth(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="requireAuth" className="text-sm font-medium">
                  Require authentication (email in URL)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Select File (Max 50MB)
                </label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading || !title || validatedRecipients.filter(r => r.isValid).length === 0}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Validate recipients first. Supported: PDF, Word, Excel, PowerPoint, Images, ZIP
                </p>
              </div>

              {isUploading && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Uploading...</AlertTitle>
                  <AlertDescription>
                    Please wait while the file is being uploaded and emails are being sent.
                  </AlertDescription>
                </Alert>
              )}

              {uploadedFile && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">✅ Document uploaded and emails sent!</p>
                      <p className="text-sm text-green-700">{uploadedFile.fileName} - {formatFileSize(uploadedFile.size)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Active Documents</CardTitle>
              <CardDescription>Manage all confidential documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
                ) : (
                  documents.map(doc => {
                    const expired = isExpired(doc.expires_at);
                    const viewLimitReached = isViewLimitReached(doc);
                    const isAccessible = doc.is_active && !expired && !viewLimitReached;

                    return (
                      <div
                        key={doc.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="w-5 h-5 text-blue-600 mt-1" />
                            <div className="flex-1">
                              <h3 className="font-medium">{doc.title}</h3>
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Expires: {formatDate(doc.expires_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Views: {doc.view_count}{doc.max_views ? `/${doc.max_views}` : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  Downloads: {doc.download_count}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Recipients: {doc.allowed_emails.length}
                                </span>
                                {doc.require_auth && (
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Lock className="w-3 h-3" />
                                    Auth Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {isAccessible ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                {expired ? 'Expired' : viewLimitReached ? 'View Limit' : 'Inactive'}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyLink(doc.encrypted_url);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>Track who accessed confidential documents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Access logs feature coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedDoc.title}</h3>
                {selectedDoc.description && (
                  <p className="text-gray-600 mt-1">{selectedDoc.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">File Name</p>
                  <p className="mt-1">{selectedDoc.file_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">File Size</p>
                  <p className="mt-1">{formatFileSize(selectedDoc.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Uploaded By</p>
                  <p className="mt-1">{selectedDoc.uploaded_by}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Uploaded At</p>
                  <p className="mt-1">{formatDate(selectedDoc.uploaded_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Expires At</p>
                  <p className="mt-1">{formatDate(selectedDoc.expires_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    {selectedDoc.is_active && !isExpired(selectedDoc.expires_at) && !isViewLimitReached(selectedDoc) ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Secure Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedDoc.encrypted_url}
                    readOnly
                    className="flex-1 text-xs font-mono p-2 bg-gray-50 rounded border"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyLink(selectedDoc.encrypted_url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {selectedDoc.allowed_emails.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Recipients ({selectedDoc.allowed_emails.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.allowed_emails.map((email, idx) => (
                      <Badge key={idx} variant="outline">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDoc.access_code && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Access Code</p>
                  <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">{selectedDoc.access_code}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    deactivateDocument(selectedDoc.id);
                    setIsDetailOpen(false);
                  }}
                  disabled={!selectedDoc.is_active}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Revoke Access
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfidentialDocuments;
import { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"student" | "admin">("student");
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dept: "",
    year: "",
    division: "",
    password: "",
    // Admin specific fields
    councilDept: "",
    councilRole: "",
    idCard: null as File | null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFormData({ ...formData, idCard: file });
      setPdfPreview(URL.createObjectURL(file));
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  const handleSignup = async (e: FormEvent) => {
  e.preventDefault();
  
  // 1. Basic College Email Validation
  const collegeEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.in|org)$/;
  if (!collegeEmailRegex.test(formData.email)) {
    alert("Please use a valid college email address.");
    return;
  }

  setIsLoading(true);

  // 2. Prepare FormData
  const data = new FormData();
  
  // Append basic fields
  Object.entries(formData).forEach(([key, value]) => {
    // We handle the file separately to ensure the key matches the backend
    if (key !== "idCard" && value) {
      data.append(key, value as string);
    }
  });

  // Append the Role
  data.append("role", role);

  // 3. Append the ID Card File (Crucial for Admin)
  if (role === 'admin') {
    if (!formData.idCard) {
      alert("Please upload your ID Card PDF");
      setIsLoading(false);
      return;
    }
    // 'idCard' must match the backend upload.single('idCard')
    data.append("idCard", formData.idCard); 
  }

  try {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      body: data, // Browser automatically sets Content-Type to multipart/form-data
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    // 4. Success Navigation
    alert("OTP sent to your college email!");
    
    // Pass the email to the OTP page so the user doesn't have to re-type it
    navigate("/verify-otp", { state: { email: formData.email } });

  } catch (error: any) {
    console.error(error);
    alert(error.message || "Signup failed");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-2xl shadow-lg border-t-4 border-t-primary transition-all">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join your college portal as a Student or Council Admin
          </CardDescription>
          
          <Tabs defaultValue="student" className="w-full pt-4" onValueChange={(v) => setRole(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="admin">Council Admin</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" placeholder="John Doe" onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@college.edu" onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Input id="dept" name="dept" placeholder="Computer Science" onChange={handleChange} required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" placeholder="FE/SE/TE/BE" onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division (Opt)</Label>
                  <Input id="division" name="division" placeholder="A" onChange={handleChange} />
                </div>
              </div>

              {/* Admin Specific Fields */}
              {role === "admin" && (
                <>
                  <div className="space-y-2">
                    <Label>Council Department</Label>
                    <Select onValueChange={(v) => handleSelectChange("councilDept", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Dept" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Cultural">Cultural</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="councilRole">Role in Dept</Label>
                    <Input id="councilRole" name="councilRole" placeholder="Secretary / Member" onChange={handleChange} required />
                  </div>

                  <div className="col-span-full space-y-2">
                    <Label htmlFor="idCard">College ID Card (PDF)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        id="idCard" 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange} 
                        className="cursor-pointer" 
                        required 
                      />
                    </div>
                  </div>

                  {pdfPreview && (
                    <div className="col-span-full mt-2 border rounded-lg p-2 bg-slate-100 relative">
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-semibold flex items-center gap-1">
                          <FileText size={14} /> ID_Preview.pdf
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPdfPreview(null)}>
                          <X size={14} />
                        </Button>
                      </div>
                      <iframe src={pdfPreview} className="w-full h-48 rounded border bg-white" title="ID Preview" />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2 col-span-full">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" onChange={handleChange} required />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Verifying Details..." : `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{""}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
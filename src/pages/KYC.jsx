import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COUNTRIES = [
  "Pakistan", "India", "United States", "United Kingdom", "Canada", 
  "Australia", "Germany", "France", "UAE", "Saudi Arabia", "Other"
];

export default function KYC() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({
    front: false,
    back: false
  });
  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
    cnic_front: "",
    cnic_back: ""
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, [type]: true });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [type === 'front' ? 'cnic_front' : 'cnic_back']: file_url });
    } catch (error) {
      console.error("Upload error:", error);
    }
    setUploading({ ...uploading, [type]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.country || !formData.cnic_front || !formData.cnic_back) {
      alert("Please fill all fields and upload both documents");
      return;
    }

    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        kyc_status: "pending",
        kyc_submitted_date: new Date().toISOString()
      });

      queryClient.invalidateQueries(["currentUser"]);
      alert("KYC submitted successfully!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("KYC submission error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (user?.kyc_status) {
      case "approved":
        return <CheckCircle className="w-12 h-12 text-green-400" />;
      case "pending":
        return <Clock className="w-12 h-12 text-amber-400" />;
      case "rejected":
        return <XCircle className="w-12 h-12 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6 pt-8">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">KYC Verification</h1>
          <p className="text-gray-400">Verify your identity to unlock all features</p>
        </div>

        {user?.kyc_status === "approved" && (
          <Card className="bg-green-500/20 border-green-500/50 backdrop-blur-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                {getStatusIcon()}
                <h3 className="text-xl font-bold text-white mt-4">KYC Approved!</h3>
                <p className="text-green-300 mt-2">You can now send and receive tokens</p>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.kyc_status === "pending" && (
          <Card className="bg-amber-500/20 border-amber-500/50 backdrop-blur-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                {getStatusIcon()}
                <h3 className="text-xl font-bold text-white mt-4">Under Review</h3>
                <p className="text-amber-300 mt-2">Your KYC is being reviewed. Please wait.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.kyc_status === "rejected" && (
          <Card className="bg-red-500/20 border-red-500/50 backdrop-blur-lg mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                {getStatusIcon()}
                <h3 className="text-xl font-bold text-white mt-4">KYC Rejected</h3>
                <p className="text-red-300 mt-2">Please submit again with correct details</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(user?.kyc_status === "not_submitted" || user?.kyc_status === "rejected") && (
          <Card className="bg-slate-800/50 border-indigo-500/30 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white">Submit KYC Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="full_name" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Enter your full name"
                    className="mt-2 bg-slate-900/50 border-indigo-500/30 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country" className="text-gray-300">
                    Country
                  </Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({...formData, country: value})}
                  >
                    <SelectTrigger className="mt-2 bg-slate-900/50 border-indigo-500/30 text-white">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-indigo-500/30">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country} className="text-white">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cnic_front" className="text-gray-300">
                    CNIC / ID Card (Front Side)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="cnic_front"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'front')}
                      className="bg-slate-900/50 border-indigo-500/30 text-white"
                      disabled={uploading.front}
                    />
                  </div>
                  {uploading.front && (
                    <p className="text-sm text-indigo-400 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </p>
                  )}
                  {formData.cnic_front && (
                    <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Front side uploaded!
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cnic_back" className="text-gray-300">
                    CNIC / ID Card (Back Side)
                  </Label>
                  <div className="mt-2">
                    <Input
                      id="cnic_back"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, 'back')}
                      className="bg-slate-900/50 border-indigo-500/30 text-white"
                      disabled={uploading.back}
                    />
                  </div>
                  {uploading.back && (
                    <p className="text-sm text-indigo-400 mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </p>
                  )}
                  {formData.cnic_back && (
                    <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Back side uploaded!
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={uploading.front || uploading.back}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Submit KYC
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

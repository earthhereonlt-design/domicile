'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PhotoUpload from '@/components/PhotoUpload';
import ProgressIndicator from '@/components/ProgressIndicator';
import { cn } from '@/lib/utils';

// AI steps definitions
const AI_STEPS = [
  { id: 1, name: 'Upload Doc' },
  { id: 2, name: 'AI Extract' },
  { id: 3, name: 'Review & Edit' },
  { id: 4, name: 'Photo' },
  { id: 5, name: 'Generate' },
];

export default function AIExtraction() {
  const [currentStep, setCurrentStep] = useState(1);
  const [docImageBase64, setDocImageBase64] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Storing extracted confidence levels
  const [confidence, setConfidence] = useState<Record<string, number>>({});



  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    houseNo: '00',
    streetLocality: '',
    village: '',
    thana: '',
    tehsil: '',
    district: '',
    state: 'उत्तर प्रदेश',
    pinCode: '',
    photoBase64: '',
    qrCodeEnabled: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear field-specific error and boost confidence if edited
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (confidence[name] !== undefined) {
      setConfidence((prev) => ({ ...prev, [name]: 1.0 })); // User corrected = 100% confidence
    }
  };

  // Trigger Gemini API endpoint
  const runAIExtraction = async () => {
    if (!docImageBase64) {
      setErrors({ docImage: 'Please upload a document image first.' });
      return;
    }

    setIsExtracting(true);
    setCurrentStep(2); // Go to loader step
    setErrors({});

    try {
      const res = await fetch('/api/extract-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: docImageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract details from document.');
      }

      // Populate form state — if AI returned empty/null for a field, keep it blank
      // so the user sees exactly what was (or wasn't) found on the document
      const val = (v: any) => (v == null ? '' : String(v));
      setFormData((prev) => ({
        ...prev,
        fullName: val(data.name),
        fatherName: val(data.fatherName),
        motherName: val(data.motherName),
        dob: val(data.dateOfBirth),
        houseNo: val(data.houseNo) || '00',
        streetLocality: val(data.streetLocality),
        village: val(data.village),
        thana: val(data.thana),
        tehsil: val(data.tehsil),
        district: val(data.district),
        state: val(data.state),
        pinCode: val(data.pinCode),
      }));

      // Store confidence scores
      setConfidence(data.confidence || {});
      setCurrentStep(3); // Go to review step
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'AI extraction failed. Please enter details manually.' });
      setCurrentStep(1); // Return to upload
    } finally {
      setIsExtracting(false);
    }
  };

  // Reformat DD/MM/YYYY into YYYY-MM-DD for HTML5 date input
  const reformatInputDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 3) {
      if (!formData.fullName.trim()) stepErrors.fullName = 'Full Name is required.';
      if (!formData.fatherName.trim()) stepErrors.fatherName = "Father's Name is required.";
      if (!formData.dob) stepErrors.dob = 'Date of Birth is required.';
      if (!formData.village.trim()) stepErrors.village = 'Village / City is required.';
      if (!formData.thana.trim()) stepErrors.thana = 'Police Station / Thana is required.';
      if (!formData.tehsil.trim()) stepErrors.tehsil = 'Tehsil is required.';
      if (!formData.district.trim()) stepErrors.district = 'District is required.';
      if (!formData.pinCode.trim()) {
        stepErrors.pinCode = 'PIN Code is required.';
      } else if (!/^\d{6}$/.test(formData.pinCode)) {
        stepErrors.pinCode = 'PIN Code must be exactly 6 digits.';
      }
    } else if (step === 4) {
      if (!formData.photoBase64) {
        stepErrors.photoBase64 = 'Please upload a passport-sized photo for the candidate.';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, AI_STEPS.length));
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep === 3) {
      setCurrentStep(1); // Skip loader step on back
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  // Submit to generate final certificate
  const handleGenerateCertificate = async () => {
    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Open the certificate in a new tab (triggers automatic browser print dialog)
      window.open(`/api/certificates/${data.id}/html`, '_blank');

      // Reset form and return to step 1
      setFormData({
        fullName: '',
        fatherName: '',
        motherName: '',
        dob: '',
        houseNo: '00',
        streetLocality: '',
        village: '',
        thana: '',
        tehsil: '',
        district: '',
        state: 'उत्तर प्रदेश',
        pinCode: '',
        photoBase64: '',
        qrCodeEnabled: true,
      });
      setDocImageBase64('');
      setConfidence({});
      setCurrentStep(1);
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render confidence badges
  const renderConfidenceBadge = (field: string) => {
    const val = formData[field as keyof typeof formData];
    const score = confidence[field];
    
    if (score === undefined) return null;

    if (!val || score === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Uncertain / Empty
        </span>
      );
    }

    if (score < 0.8) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Review ({(score * 100).toFixed(0)}% Match)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Verified ({(score * 100).toFixed(0)}% Match)
      </span>
    );
  };

  return (
    <div className="flex-1 py-12 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8">
        <Link
          href="/"
          className="flex items-center text-xs font-semibold text-muted-text hover:text-foreground transition-colors uppercase tracking-wider"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 mr-1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to method selection
        </Link>
        <span className="text-xs text-muted-text font-medium">Photo / AI Extraction Mode</span>
      </div>

      {currentStep !== 2 && (
        <ProgressIndicator steps={AI_STEPS} currentStep={currentStep} />
      )}

      {/* Main wizard card */}
      <div className="max-w-xl mx-auto bg-white dark:bg-stone-900 border border-border-color rounded-xl p-6 md:p-8 shadow-xs">
        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
            {errors.form}
          </div>
        )}

        <div>
            {/* Step 1: Upload Document Photo */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Upload Document Photo</h2>
                  <p className="text-xs text-muted-text">
                    Upload a high-quality photograph of the physical certificate. Gemini AI will analyze the image to extract all registration data.
                  </p>
                </div>

                <PhotoUpload
                  value={docImageBase64}
                  onChange={(val) => {
                    setDocImageBase64(val);
                    if (errors.docImage) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.docImage;
                        return next;
                      });
                    }
                  }}
                  label="Certificate Document File"
                  description="JPEG, PNG, or WEBP. Max size 2MB."
                  error={errors.docImage}
                />

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={runAIExtraction}
                    disabled={!docImageBase64}
                    className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Extract Information
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Extraction Loading State */}
            {currentStep === 2 && (
              <div className="py-8 space-y-6 text-center">
                {/* Clean loading skeleton */}
                <div className="w-12 h-12 rounded-full border-2 border-t-accent border-border-color animate-spin mx-auto mb-6" />
                
                <h3 className="text-lg font-bold text-foreground">Analyzing Certificate Document</h3>
                <p className="text-xs text-muted-text max-w-sm mx-auto">
                  Gemini API is securely scanning the image, verifying layout tables, and translating bilingual records. This will take a few moments...
                </p>

                <div className="max-w-xs mx-auto space-y-2.5 pt-6 text-left">
                  <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {/* Step 3: Review and Edit */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-color pb-4 gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Review Extracted Data</h2>
                    <p className="text-xs text-muted-text">
                      Review and correct the fields extracted by Gemini AI before continuing.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full">
                    Gemini Extraction Completed
                  </span>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Name field */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                        Full Name
                      </label>
                      {renderConfidenceBadge('name')}
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                        errors.fullName ? "border-red-500" : "border-border-color"
                      )}
                    />
                    {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
                  </div>

                  {/* Father Name */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                        Father's Name
                      </label>
                      {renderConfidenceBadge('fatherName')}
                    </div>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                        errors.fatherName ? "border-red-500" : "border-border-color"
                      )}
                    />
                    {errors.fatherName && <p className="mt-1.5 text-xs text-red-500">{errors.fatherName}</p>}
                  </div>

                  {/* Mother Name */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                        Mother's Name
                      </label>
                      {renderConfidenceBadge('motherName')}
                    </div>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      placeholder="Enter mother's name if missing"
                      className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-border-color text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                        जन्म तिथि (Date of Birth)
                      </label>
                      {renderConfidenceBadge('dateOfBirth')}
                    </div>
                    <input
                      type="text"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      placeholder="e.g. 14/07/2026"
                      className={cn(
                        "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                        errors.dob ? "border-red-500" : "border-border-color"
                      )}
                    />
                    {errors.dob && <p className="mt-1.5 text-xs text-red-500">{errors.dob}</p>}
                  </div>

                  {/* Address Grid */}
                  <div className="pt-4 border-t border-border-color/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <h3 className="sm:col-span-2 text-xs font-bold text-foreground">Extracted Address Details</h3>
                    


                    {/* Street Locality */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          Street / Locality
                        </label>
                        {renderConfidenceBadge('streetLocality')}
                      </div>
                      <input
                        type="text"
                        name="streetLocality"
                        value={formData.streetLocality}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-border-color text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs"
                      />
                    </div>

                    {/* Village */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          Village / Town / City
                        </label>
                        {renderConfidenceBadge('village')}
                      </div>
                      <input
                        type="text"
                        name="village"
                        value={formData.village}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                          errors.village ? "border-red-500" : "border-border-color"
                        )}
                      />
                      {errors.village && <p className="mt-1 text-xs text-red-500">{errors.village}</p>}
                    </div>

                    {/* Thana */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          Thana / Police Station
                        </label>
                        {renderConfidenceBadge('thana')}
                      </div>
                      <input
                        type="text"
                        name="thana"
                        value={formData.thana}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                          errors.thana ? "border-red-500" : "border-border-color"
                        )}
                      />
                      {errors.thana && <p className="mt-1 text-xs text-red-500">{errors.thana}</p>}
                    </div>

                    {/* Tehsil */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          Tehsil
                        </label>
                        {renderConfidenceBadge('tehsil')}
                      </div>
                      <input
                        type="text"
                        name="tehsil"
                        value={formData.tehsil}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                          errors.tehsil ? "border-red-500" : "border-border-color"
                        )}
                      />
                      {errors.tehsil && <p className="mt-1 text-xs text-red-500">{errors.tehsil}</p>}
                    </div>

                    {/* District */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          District
                        </label>
                        {renderConfidenceBadge('district')}
                      </div>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                          errors.district ? "border-red-500" : "border-border-color"
                        )}
                      />
                      {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district}</p>}
                    </div>

                    {/* State */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          State
                        </label>
                        {renderConfidenceBadge('state')}
                      </div>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-white dark:bg-stone-900 border border-border-color text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs"
                      />
                    </div>

                    {/* Pin Code */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text">
                          PIN Code
                        </label>
                        {renderConfidenceBadge('pinCode')}
                      </div>
                      <input
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full px-4 py-2.5 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
                          errors.pinCode ? "border-red-500" : "border-border-color"
                        )}
                      />
                      {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Passport Photo Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Applicant Photograph</h2>
                  <p className="text-xs text-muted-text">
                    Upload a clean, passport-sized photo of the applicant to print on the final certificate.
                  </p>
                </div>

                <PhotoUpload
                  value={formData.photoBase64}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, photoBase64: val }));
                    if (errors.photoBase64) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.photoBase64;
                        return next;
                      });
                    }
                  }}
                  error={errors.photoBase64}
                />
              </div>
            )}



            {/* Step 5: Confirmation Summary & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">Confirm and Compile</h2>
                  <p className="text-xs text-muted-text">
                    Review extracted AI details before saving the certificate.
                  </p>
                </div>

                <div className="border border-border-color rounded-xl overflow-hidden text-xs">
                  <div className="bg-stone-50 dark:bg-stone-800/40 p-4 border-b border-border-color flex justify-between items-center">
                    <span className="font-semibold text-foreground">Summary</span>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="text-accent hover:underline font-semibold"
                    >
                      Edit Info
                    </button>
                  </div>
                  <div className="p-4 space-y-3 bg-white dark:bg-stone-900 divide-y divide-border-color/50">
                    <div className="grid grid-cols-3 pt-1">
                      <span className="text-muted-text">Name:</span>
                      <span className="col-span-2 font-semibold text-foreground">{formData.fullName}</span>
                    </div>
                    <div className="grid grid-cols-3 pt-3">
                      <span className="text-muted-text">Father's Name:</span>
                      <span className="col-span-2 font-semibold text-foreground">{formData.fatherName}</span>
                    </div>
                    <div className="grid grid-cols-3 pt-3">
                      <span className="text-muted-text">Date of Birth:</span>
                      <span className="col-span-2 font-semibold text-foreground">{formData.dob}</span>
                    </div>
                    <div className="grid grid-cols-3 pt-3">
                      <span className="text-muted-text">District:</span>
                      <span className="col-span-2 font-semibold text-foreground">{formData.district}</span>
                    </div>
                    <div className="grid grid-cols-3 pt-3">
                      <span className="text-muted-text">Address:</span>
                      <span className="col-span-2 font-semibold text-foreground text-right sm:text-left">
                        {formData.houseNo}, {formData.streetLocality ? `${formData.streetLocality}, ` : ''}{formData.village}, {formData.thana}, {formData.tehsil}, {formData.district}, {formData.state} - {formData.pinCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation */}
            <div className="mt-8 pt-6 border-t border-border-color flex justify-between">
              {currentStep > 1 && currentStep !== 2 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-border-color rounded-lg text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 text-foreground transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < AI_STEPS.length && currentStep !== 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-sm rounded-lg transition-colors"
                >
                  Continue
                </button>
              ) : currentStep === AI_STEPS.length ? (
                <button
                  type="button"
                  onClick={handleGenerateCertificate}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-stone-950"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Compiling...
                    </>
                  ) : (
                    'Generate Certificate'
                  )}
                </button>
              ) : null}
            </div>
          </div>
      </div>
    </div>
  );
}

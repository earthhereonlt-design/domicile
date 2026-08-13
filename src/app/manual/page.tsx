'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProgressIndicator from '@/components/ProgressIndicator';
import DistrictSelect from '@/components/DistrictSelect';
import PhotoUpload from '@/components/PhotoUpload';
import { cn, formatDate } from '@/lib/utils';

// Wizard steps definitions
const STEPS = [
  { id: 1, name: 'District' },
  { id: 2, name: 'Basic Info' },
  { id: 3, name: 'Address' },
  { id: 4, name: 'Identifiers' },
  { id: 5, name: 'Photo' },
  { id: 6, name: 'Generate' },
];

const emptyForm = {
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
};

export default function ManualEntry() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ ...emptyForm });

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Validate each step before advancing
  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.district) {
        stepErrors.district = 'Please select a district to continue.';
      }
    } else if (step === 2) {
      if (!formData.fullName.trim()) {
        stepErrors.fullName = 'Full Name is required.';
      }
      if (!formData.fatherName.trim()) {
        stepErrors.fatherName = "Father's Name is required.";
      }
      if (!formData.dob.trim()) {
        stepErrors.dob = 'Date of Birth is required.';
      }
    } else if (step === 3) {
      if (!formData.village.trim()) {
        stepErrors.village = 'Village / Town / City is required.';
      }
      if (!formData.thana.trim()) {
        stepErrors.thana = 'Police Station / Thana is required.';
      }
      if (!formData.tehsil.trim()) {
        stepErrors.tehsil = 'Tehsil is required.';
      }
      if (!formData.district.trim()) {
        stepErrors.district = 'District is required.';
      }
      if (!formData.state.trim()) {
        stepErrors.state = 'State is required.';
      }
      if (!formData.pinCode.trim()) {
        stepErrors.pinCode = 'PIN Code is required.';
      } else if (!/^\d{6}$/.test(formData.pinCode)) {
        stepErrors.pinCode = 'PIN Code must be exactly 6 digits.';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        // Strip the English suffix from district display string
        const parts = formData.district.split('/');
        const hindiDistrict = parts[0].trim();
        setFormData((prev) => ({
          ...prev,
          district: hindiDistrict,
          tehsil: prev.tehsil || (hindiDistrict === 'खीरी' ? 'पलिया' : ''),
        }));
      }
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit form — generate certificate, open in new tab with auto-print, reset form
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate.');
      }

      // Open certificate in new tab — window.print() fires automatically on load
      window.open(`/api/certificates/${data.id}/html`, '_blank');

      // Reset form on current tab
      setFormData({ ...emptyForm });
      setCurrentStep(1);
    } catch (err: any) {
      console.error(err);
      setErrors({ form: err.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
        <span className="text-xs text-muted-text font-medium">Manual Guided Mode</span>
      </div>

      <ProgressIndicator steps={STEPS} currentStep={currentStep} />

      {/* Main Form Container */}
      <div className="max-w-xl mx-auto bg-white dark:bg-stone-900 border border-border-color rounded-xl p-6 md:p-8 shadow-xs">
        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
            {errors.form}
          </div>
        )}

        {/* Step 1: District Select */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Select Jurisdiction</h2>
              <p className="text-xs text-muted-text">
                Choose the district where the certificate should be registered.
              </p>
            </div>
            <DistrictSelect
              value={formData.district}
              onChange={(val) => setFormData((prev) => ({ ...prev, district: val }))}
              error={errors.district}
            />
          </div>
        )}

        {/* Step 2: Basic Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Basic Information</h2>
              <p className="text-xs text-muted-text">
                Enter the identity and demographic details of the applicant.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Himanshu Kumar / हिमांशु कुमार"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.fullName ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.fullName && <p className="mt-2 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              {/* Father's Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  placeholder="e.g. Arun Kumar / अरुण कुमार"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.fatherName ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.fatherName && <p className="mt-2 text-xs text-red-500">{errors.fatherName}</p>}
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Mother's Name <span className="text-[10px] text-muted-text/80 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleInputChange}
                  placeholder="e.g. Santosh Devi / संतोष देवी"
                  className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-border-color text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs"
                />
              </div>

              {/* जन्म तिथि / Date of Birth */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  जन्म तिथि (Date of Birth)
                </label>
                <input
                  type="text"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  placeholder="e.g. 14/07/2026"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.dob ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.dob && <p className="mt-2 text-xs text-red-500">{errors.dob}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Residence Address</h2>
              <p className="text-xs text-muted-text">
                Provide the detailed address of the applicant's residence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street / Locality */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Street / Locality <span className="text-[10px] text-muted-text/80 lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  name="streetLocality"
                  value={formData.streetLocality}
                  onChange={handleInputChange}
                  placeholder="e.g. Gram Nagla Post Palia Kalan"
                  className="w-full px-4 py-3 bg-white dark:bg-stone-900 border border-border-color text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs"
                />
              </div>

              {/* Village */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Village / Town / City
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  placeholder="e.g. Nagla"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.village ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.village && <p className="mt-2 text-xs text-red-500">{errors.village}</p>}
              </div>

              {/* Thana */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Police Station / Thana
                </label>
                <input
                  type="text"
                  name="thana"
                  value={formData.thana}
                  onChange={handleInputChange}
                  placeholder="e.g. Palia Kalan"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.thana ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.thana && <p className="mt-2 text-xs text-red-500">{errors.thana}</p>}
              </div>

              {/* Tehsil */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  Tehsil
                </label>
                <input
                  type="text"
                  name="tehsil"
                  value={formData.tehsil}
                  onChange={handleInputChange}
                  placeholder="e.g. Palia"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.tehsil ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.tehsil && <p className="mt-2 text-xs text-red-500">{errors.tehsil}</p>}
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="e.g. Kheri"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.district ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.district && <p className="mt-2 text-xs text-red-500">{errors.district}</p>}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Uttar Pradesh"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.state ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.state && <p className="mt-2 text-xs text-red-500">{errors.state}</p>}
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  placeholder="e.g. 262902"
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs',
                    errors.pinCode ? 'border-red-500' : 'border-border-color'
                  )}
                />
                {errors.pinCode && <p className="mt-2 text-xs text-red-500">{errors.pinCode}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Identifiers */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Generated Identifiers</h2>
              <p className="text-xs text-muted-text">
                Unique reference keys generated by our secure system database.
              </p>
            </div>

            <div className="p-6 border border-border-color rounded-lg bg-stone-50 dark:bg-stone-800/40 space-y-4">
              <div>
                <span className="block text-[10px] font-semibold text-muted-text uppercase tracking-wider mb-1">
                  Preview Application ID
                </span>
                <span className="font-mono text-sm text-foreground bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                  261530020105045-••••
                </span>
                <span className="block text-[10px] text-muted-text mt-1">
                  A unique 4-digit collision-resistant suffix will be generated at compilation.
                </span>
              </div>

              <div className="pt-2 border-t border-border-color">
                <span className="block text-[10px] font-semibold text-muted-text uppercase tracking-wider mb-1">
                  Preview Certificate ID
                </span>
                <span className="font-mono text-sm text-foreground bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                  23626201-••••
                </span>
                <span className="block text-[10px] text-muted-text mt-1">
                  A unique 4-digit verification suffix will be generated for public reference.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Photo Upload */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Applicant Photograph</h2>
              <p className="text-xs text-muted-text">
                Upload a clear, passport-sized photo of the applicant. Skip to use the default photo.
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

        {/* Step 6: Confirm & Generate */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Confirm and Generate</h2>
              <p className="text-xs text-muted-text">
                Review all details. The certificate will open in a new tab and the print dialog will launch automatically.
              </p>
            </div>

            <div className="border border-border-color rounded-xl overflow-hidden text-xs">
              <div className="bg-stone-50 dark:bg-stone-800/40 p-4 border-b border-border-color flex justify-between items-center">
                <span className="font-semibold text-foreground">Summary</span>
                <button
                  onClick={() => setCurrentStep(2)}
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
                  <span className="text-muted-text">जन्म तिथि:</span>
                  <span className="col-span-2 font-semibold text-foreground">{formData.dob}</span>
                </div>
                <div className="grid grid-cols-3 pt-3">
                  <span className="text-muted-text">District:</span>
                  <span className="col-span-2 font-semibold text-foreground">{formData.district}</span>
                </div>
                <div className="grid grid-cols-3 pt-3">
                  <span className="text-muted-text">Address:</span>
                  <span className="col-span-2 font-semibold text-foreground text-right sm:text-left">
                    {formData.streetLocality ? `${formData.streetLocality}, ` : ''}{formData.village}, {formData.thana}, {formData.tehsil}, {formData.district}, {formData.state} - {formData.pinCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-border-color flex justify-between">
          {currentStep > 1 ? (
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

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-sm rounded-lg transition-colors"
            >
              Continue
            </button>
          ) : (
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
                  Generating...
                </>
              ) : (
                'Generate Certificate'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

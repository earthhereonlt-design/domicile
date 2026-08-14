import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import CertificatePreview from '@/components/CertificatePreview';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;
  let certificate = null;

  try {
    certificate = await prisma.certificate.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Database query error on verification:', error);
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6">
      {/* Platform Header */}
      <div className="text-center max-w-xl mb-10">
        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 border border-border-color rounded-full text-[10px] font-semibold text-muted-text uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Secure Verification Ledger
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Document Verification
        </h1>
      </div>

      {certificate ? (
        /* Verified Record Card */
        <div className="w-full max-w-3xl bg-white dark:bg-stone-900 border border-border-color rounded-xl p-6 md:p-8 shadow-xs">
          {/* Status Badge */}
          <div className="flex items-center gap-2.5 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-400 mb-6">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider">
                Record Verified
              </span>
              <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-500/80">
                This document matches an authentic record in our database.
              </span>
            </div>
          </div>

          <div className="mb-8">
            <CertificatePreview certificate={certificate} />
          </div>

          <div className="flex flex-col lg:flex-row gap-3 justify-center w-full mt-8">
            <a
              href={`/api/certificates/${certificate.id}/html`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-xs rounded-lg shadow-sm transition-colors text-center flex-1 uppercase tracking-wider"
            >
              Print / Save PDF
            </a>
            <a
              href={`/api/certificates/${certificate.id}/html?download=true`}
              className="px-5 py-2.5 border border-border-color hover:bg-stone-50 dark:hover:bg-stone-800 text-foreground font-semibold text-xs rounded-lg transition-colors text-center flex-1 uppercase tracking-wider"
            >
              Download HTML
            </a>
            <Link
              href="/"
              className="px-5 py-2.5 border border-border-color hover:bg-stone-50 dark:hover:bg-stone-800 text-foreground font-semibold text-xs rounded-lg transition-colors text-center flex-1 uppercase tracking-wider"
            >
              Go Home
            </Link>
          </div>
        </div>
      ) : (
        /* Record Not Found Card */
        <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-border-color rounded-xl p-6 md:p-8 shadow-xs text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 flex items-center justify-center mx-auto mb-6 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">Record Invalid</h2>
          <p className="text-xs text-muted-text leading-relaxed mb-8">
            The certificate reference identifier could not be verified. This could be due to a broken URL, or the certificate record may have been deleted or never successfully generated.
          </p>

          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-950 font-semibold text-sm rounded-lg shadow-sm transition-colors text-center"
          >
            Return to Generator
          </Link>
        </div>
      )}
    </div>
  );
}

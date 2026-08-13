import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:py-24">
      {/* Small subtle badge at top */}
      <div className="mb-6 px-3 py-1 bg-border-color/40 border border-border-color rounded-full text-xs font-medium text-muted-text tracking-wide uppercase">
        Secure Document Engine
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-xl mb-12 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Certificate Generator
        </h1>
        <p className="text-sm md:text-base text-muted-text">
          Generate secure, verified general domicile certificates manually or through intelligent document analysis.
        </p>
      </div>

      {/* Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Manual Card */}
        <Link
          href="/manual"
          className="group relative flex flex-col justify-between p-8 bg-white dark:bg-stone-900 border border-border-color rounded-xl shadow-xs transition-border hover:border-foreground/45 hover:shadow-sm"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-6 text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Manual Entry
            </h2>
            <p className="text-sm text-muted-text leading-relaxed">
              Enter certificate information manually through a guided form with district selection, verification options, and photo uploads.
            </p>
          </div>
          <div className="mt-8 flex items-center text-xs font-semibold text-accent uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-200">
            Start Guided Form
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5 ml-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>

        {/* AI Extraction Card */}
        <Link
          href="/ai"
          className="group relative flex flex-col justify-between p-8 bg-white dark:bg-stone-900 border border-border-color rounded-xl shadow-xs transition-border hover:border-foreground/45 hover:shadow-sm"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-6 text-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Photo / AI Extraction
            </h2>
            <p className="text-sm text-muted-text leading-relaxed">
              Upload a photograph of an existing certificate. Our engine will analyze the document, extract key fields, and pre-populate your forms automatically.
            </p>
          </div>
          <div className="mt-8 flex items-center text-xs font-semibold text-accent uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-200">
            Upload & Extract
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5 ml-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Footer warning */}
      <div className="mt-16 text-center text-xs text-muted-text/80 max-w-md">
        This platform is for demonstration and productivity purposes. Generated certificates do not constitute official government documents unless issued by an authorized system.
      </div>
    </div>
  );
}

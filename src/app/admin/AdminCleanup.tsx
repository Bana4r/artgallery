'use client';

import { useState } from 'react';

export default function AdminCleanup() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCleanup = async () => {
    try {
      setIsRunning(true);
      setResults(null);
      setError(null);

      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to run cleanup process');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error('Error running cleanup:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Gallery Maintenance</h2>
      <p className="mb-4 text-gray-600">
        This utility checks for consistency between the database and file system.
        It will report orphaned files (files without database entries) and missing files
        (database entries pointing to non-existent files).
      </p>

      <button
        onClick={runCleanup}
        disabled={isRunning}
        className={`px-4 py-2 rounded-md ${
          isRunning
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isRunning ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Running Cleanup...
          </>
        ) : (
          'Run Cleanup Scan'
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">Scan Results:</h3>
          <ul className="space-y-1">
            <li>Processed Files: {results.processedFiles}</li>
            <li>Orphaned Files Found: {results.orphanedFilesRemoved}</li>
            <li>Missing Files in Database: {results.missingFilesInDb}</li>
            {results.errors.length > 0 && (
              <li className="text-red-600">
                Errors: {results.errors.length}
                <ul className="pl-4 mt-1">
                  {results.errors.slice(0, 5).map((err: string, idx: number) => (
                    <li key={idx} className="text-sm">
                      - {err}
                    </li>
                  ))}
                  {results.errors.length > 5 && (
                    <li className="text-sm">
                      ...and {results.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </li>
            )}
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Note: This scan only reports issues. To automatically fix them,
            edit the cleanup API route to enable automatic repairs.
          </p>
        </div>
      )}
    </div>
  );
}
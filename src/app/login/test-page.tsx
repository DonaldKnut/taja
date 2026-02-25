"use client";

// Minimal test page to isolate webpack issue
export default function TestLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test Login Page</h1>
        <p>If you see this, the page is loading correctly.</p>
        <p className="mt-4 text-sm text-gray-600">
          This is a minimal page to test if webpack is working.
        </p>
      </div>
    </div>
  );
}








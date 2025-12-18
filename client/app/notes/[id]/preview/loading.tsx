export default function PreviewLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading PDF Preview with AI Assistant...</p>
      </div>
    </div>
  );
}

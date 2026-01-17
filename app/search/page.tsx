import ChatInterface from "@/components/ChatInterface";

export default function SearchPage() {
  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Inventory</h1>
        <p className="text-gray-600">
          Ask questions about your inventory using natural language
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ChatInterface />
      </div>
    </div>
  );
}

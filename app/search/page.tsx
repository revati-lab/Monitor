import ChatInterface from "@/components/ChatInterface";

export default function SearchPage() {
  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Search Inventory</h1>
        <p className="text-muted-foreground">
          Ask questions about your inventory using natural language
        </p>
      </div>

      <div className="bg-card rounded-lg shadow border border-border p-6">
        <ChatInterface />
      </div>
    </div>
  );
}

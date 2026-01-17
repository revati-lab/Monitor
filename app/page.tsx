import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { getInventoryStats } from "@/lib/queryHelpers";

export default async function HomePage() {
  let stats = { totalItems: 0, totalVendors: 0, totalQuantitySf: 0, totalQuantitySlabs: 0 };
  
  try {
    const dbStats = await getInventoryStats();
    stats = {
      totalItems: dbStats.totalItems,
      totalVendors: dbStats.uniqueVendors,
      totalQuantitySf: Number(dbStats.totalQuantitySf) || 0,
      totalQuantitySlabs: dbStats.totalQuantitySlabs || 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Upload packing lists and query inventory using natural language
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Items</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Vendors</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVendors}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Quantity (SF)</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.totalQuantitySf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          {stats.totalQuantitySlabs > 0 && (
            <div className="mt-1 text-sm text-gray-500">
              {stats.totalQuantitySlabs} slab{stats.totalQuantitySlabs !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Upload</h2>
        <FileUpload />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/upload"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Upload Files</h3>
            <p className="text-sm text-gray-600">Upload packing lists and invoices</p>
          </Link>
          <Link
            href="/search"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Search Inventory</h3>
            <p className="text-sm text-gray-600">Query inventory using AI</p>
          </Link>
          <Link
            href="/inventory"
            className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-1">View All Items</h3>
            <p className="text-sm text-gray-600">Browse all inventory items</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

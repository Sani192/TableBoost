import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Dashboard</h1>
      
      <Link href="/add-visit">
        <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl text-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all mb-8">
          + Add New Visit
        </button>
      </Link>

      <div className="space-y-4">
        {/* StatsCard components will go here */}
        {/* VisitListItem components will go here */}
      </div>
    </div>
  )
}

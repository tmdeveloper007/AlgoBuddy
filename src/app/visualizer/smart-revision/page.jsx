export default function SmartRevisionPage() {
  return (
    <div className="min-h-screen p-8 bg-white dark:bg-[#1c1d1f] text-black dark:text-white">
      <h1 className="text-4xl font-bold mb-4">
        Smart Revision
      </h1>

      <p className="text-lg mb-6">
        Revise your completed DSA topics using interactive flashcards.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <button className="bg-green-600 text-white p-3 rounded">
          Easy
        </button>

        <button className="bg-yellow-500 text-white p-3 rounded">
          Medium
        </button>

        <button className="bg-red-600 text-white p-3 rounded">
          Hard
        </button>
      </div>
    </div>
  );
}
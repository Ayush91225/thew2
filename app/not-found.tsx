import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-zinc-400 mb-8">Page not found</p>
        <Link href="/" className="inline-block px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  )
}

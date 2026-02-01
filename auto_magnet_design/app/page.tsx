// app/page.tsx
import NavBar from "./components/NavBar";

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="flex flex-col items-center justify-center p-10 space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Welcome to <span className="text-indigo-600">Auto Magnet Design</span>
        </h1>
        <p className="text-lg text-gray-600">
          Please login or register to continue.
        </p>
      </main>
    </div>
  );
}
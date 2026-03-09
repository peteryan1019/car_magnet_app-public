import Link from "next/link";

export default async function Home() {
  return (
    <main className="min-h-[calc(100vh-73px)] grid place-items-center p-6 bg-slate-900 text-white font-sans">
      <section className="text-center max-w-4xl mx-auto space-y-8">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Welcome to <span className="text-blue-500 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Auto Magnet Design</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-300 font-medium">
          Create AI-Powered Banner Designs in Seconds.
        </p>
        
        <div className="pt-8">
          <Link 
            href="/preferences/setup"
            className="inline-block px-10 py-5 text-xl font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
          >
            Start Designing Now
          </Link>
        </div>
      </section>
    </main>
  );
}
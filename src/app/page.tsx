import React from 'react';
import Link from 'next/link';
import { auth, signIn, signOut } from "@/core/identity";

/**
 * InboxSense Premium Landing Page.
 * Designed with Glassmorphism and FAANG aesthetics.
 */
export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-center p-8 gap-12">
      
      {/* Hero Section */}
      <div className="glass-panel p-12 text-center max-w-2xl animate-in fade-in zoom-in duration-700">
        <h1 className="gradient-text text-6xl font-extrabold mb-6 tracking-tight">
          InboxSense
        </h1>
        <p className="text-secondary text-xl leading-relaxed mb-10">
          {session 
            ? `Welcome back, ${session.user?.name}. Your AI is ready to analyze your inbox.`
            : "The next-generation AI intelligence platform for your email ecosystem."}
        </p>
        
        <div className="flex gap-4 justify-center">
          {!session ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <form action={async () => {
                "use server";
                await signIn("google");
              }}>
                <button className="glass-panel px-8 py-4 bg-accent text-white font-bold hover:opacity-90 transition-all border-none">
                  Get Started with Google
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/dashboard" className="glass-panel px-8 py-4 bg-accent text-white font-bold hover:opacity-90 transition-all no-underline">
                Enter Dashboard
              </Link>
              <form action={async () => {
                "use server";
                await signOut();
              }}>
                <button className="glass-panel px-8 py-4 bg-white/5 text-white hover:bg-white/10 transition-all border-none">
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl w-full">
        <div className="glass-panel p-8 hover:border-accent/30 transition-colors">
          <h3 className="text-xl font-bold mb-3 text-accent">RAG Engine</h3>
          <p className="text-secondary text-sm leading-relaxed">
            Proprietary Retrieval Augmented Generation for noise-free inbox analysis.
          </p>
        </div>
        <div className="glass-panel p-8 hover:border-accent/30 transition-colors">
          <h3 className="text-xl font-bold mb-3 text-accent">Vector Index</h3>
          <p className="text-secondary text-sm leading-relaxed">
            Sub-millisecond semantic search powered by high-dimension ChromaDB.
          </p>
        </div>
        <div className="glass-panel p-8 hover:border-accent/30 transition-colors">
          <h3 className="text-xl font-bold mb-3 text-accent">Gemini Core</h3>
          <p className="text-secondary text-sm leading-relaxed">
            Powered by Google's latest 2026 multimodal intelligence models.
          </p>
        </div>
      </div>

    </div>
  );
}

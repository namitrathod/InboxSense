import React from 'react';
import Link from 'next/link';
import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      gap: '2rem',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px' }}>
        <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800 }}>
          InboxIntelligence
        </h1>
        <p style={{ color: 'var(--secondary)', fontSize: '1.2rem', lineHeight: '1.6' }}>
          {session 
            ? `Welcome back, ${session.user?.name}. Your AI is ready to analyze your inbox.`
            : "The premium AI research platform for your Gmail and Outlook accounts."}
        </p>
        
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!session ? (
            <>
              <form action={async () => {
                "use server";
                await signIn("google");
              }}>
                <button className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none' }}>
                  Sign in with Google
                </button>
              </form>
              <form action={async () => {
                "use server";
                await signIn("azure-ad");
              }}>
                <button className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', background: '#323130', color: '#fff', border: 'none' }}>
                  Sign in with Outlook
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/dashboard" className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', background: 'var(--accent)', textDecoration: 'none', color: '#fff' }}>
                Open Dashboard
              </Link>
              <form action={async () => {
                "use server";
                await signOut();
              }}>
                <button className="glass-panel" style={{ padding: '1rem 2rem', cursor: 'pointer', border: 'none', color: '#fff', background: 'transparent' }}>
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: '900px', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Sync Engine</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Stable. Waiting for OAuth2 handshake.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Vector Index</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Initializing ChromaDB bridge.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>AI Brain</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Gemini 1.5 Pro stand-by.</p>
        </div>
      </div>
    </div>
  );
}

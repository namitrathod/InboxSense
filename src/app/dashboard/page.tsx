"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { RefreshCw, Mail, Brain, Shield, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [emails, setEmails] = useState([]);

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Syncing Gmail...");
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    setSyncStatus(data.success ? `Synced ${data.count} emails. Now building index...` : `Sync error: ${data.error}`);
    if (data.success) handleIndex();
    setIsSyncing(false);
  };

  const handleIndex = async () => {
    setSyncStatus("Building vector index...");
    const res = await fetch("/api/index", { method: "POST" });
    const data = await res.json();
    setSyncStatus(data.success ? "Index updated successfully!" : `Indexing error: ${data.error}`);
  };

  const handlePurge = async () => {
    if (!confirm("Are you sure? This will delete all synced emails and your search index. You will need to Refresh Inbox to see your emails again.")) return;
    
    setIsSyncing(true);
    setSyncStatus("Clearing all data...");
    try {
      const res = await fetch("/api/purge", { method: "POST" });
      const data = await res.json();
      setSyncStatus(data.success ? "Database and Index cleared successfully." : `Purge error: ${data.error}`);
      setAnswer("");
    } catch (err) {
      setSyncStatus("Failed to clear index.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    setAnswer("Thinking...");
    
    try {
      const res = await fetch("/api/search", { 
        method: "POST", 
        body: JSON.stringify({ query }) 
      });
      const data = await res.json();
      setAnswer(data.answer || data.error);
    } catch (err) {
      setAnswer("Search failed.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-bold gradient-text mb-2">InboxSense</h1>
          </Link>
          <p className="text-secondary">Connected to {session?.user?.email}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePurge}
            disabled={isSyncing}
            className="glass-panel flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50"
          >
            <Trash2 size={20} />
            Clear Index
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="glass-panel flex items-center gap-2 px-6 py-3 bg-accent hover:opacity-90 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Processing..." : "Refresh Inbox"}
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Feed */}
        <div className="col-span-8 space-y-6">
          <form onSubmit={handleSearch} className="glass-panel p-6 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Search className="text-secondary" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your inbox anything..." 
                className="bg-transparent border-none outline-none w-full text-lg"
              />
            </div>
            <button type="submit" disabled={isSearching} className="px-4 py-2 bg-[#1a1a1a] rounded-lg text-sm border border-white/10 hover:bg-white/5 transition-colors">
              {isSearching ? "Searching..." : "Pro Search"}
            </button>
          </form>

          {answer && (
            <div className="glass-panel p-8 bg-accent/5 border-accent/20 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="flex items-center gap-2 font-bold mb-4">
                <Brain size={18} className="text-accent" />
                AI Analysis
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{answer}</p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold px-2">System Status</h2>
            <div className="glass-panel p-8 border-dashed">
              <p className="text-secondary">{syncStatus || "Standing by. System healthy."}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="flex items-center gap-2 font-bold mb-4">
              <Brain size={18} className="text-accent" />
              AI Status
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-secondary">Model</span>
                <span className="bg-white/10 px-2 py-1 rounded">Gemini 1.5 Pro</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Context Window</span>
                <span className="text-accent">Ready</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="flex items-center gap-2 font-bold mb-4">
              <Shield size={18} className="text-accent" />
              Security
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-secondary">OAuth Scope</span>
                <span className="text-green-400">gmail.readonly</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary">Local Index</span>
                <span className="text-secondary">ChromaDB Idle</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Contact {
  name: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem("kongsi_contacts") || "[]")); } catch {}
  }, []);

  function addContact() {
    if (!newName.trim()) return;
    if (contacts.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      toast.error("Contact already exists");
      return;
    }
    const next = [...contacts, { name: newName.trim() }];
    setContacts(next);
    localStorage.setItem("kongsi_contacts", JSON.stringify(next));
    setNewName("");
    toast.success("Added!");
  }

  function removeContact(name: string) {
    const next = contacts.filter((c) => c.name !== name);
    setContacts(next);
    localStorage.setItem("kongsi_contacts", JSON.stringify(next));
  }

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface shadow-sm flex justify-between items-center h-16 px-5">
        <button onClick={() => router.push("/app")} className="text-primary hover:opacity-80 active:scale-95 p-2 -ml-2">
          <User className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-primary">Kongsi</h1>
        <div className="w-10" />
      </header>

      <main className="pt-20 px-5 max-w-3xl mx-auto flex flex-col gap-6">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-outline" />
          <Input
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-outline shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
            placeholder="Search friends by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Recent Friends */}
        {contacts.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-on-surface">Recent</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 no-scrollbar">
              {contacts.slice(0, 8).map((c) => (
                <button key={c.name} className="flex flex-col items-center gap-2 min-w-[72px] active:scale-95 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-surface-container-lowest shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex items-center justify-center text-xl font-bold text-on-surface-variant">
                    {c.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant truncate w-full text-center">{c.name}</span>
                </button>
              ))}
              <button onClick={() => document.getElementById("addInput")?.focus()} className="flex flex-col items-center gap-2 min-w-[72px] active:scale-95 transition-transform group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] group-hover:bg-primary/10 transition-colors">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary truncate w-full text-center">New</span>
              </button>
            </div>
          </div>
        )}

        {/* Add Contact */}
        <div className="flex gap-2">
          <Input
            id="addInput"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a name..."
            className="bg-surface-container-lowest border-outline-variant rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && addContact()}
          />
          <Button onClick={addContact} size="icon" className="bg-primary text-primary-foreground rounded-xl shrink-0">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* All Contacts */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-semibold text-on-surface">All Contacts</h2>
            <span className="text-xs font-semibold text-outline">{contacts.length} {contacts.length === 1 ? "friend" : "friends"}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                <User className="w-8 h-8 text-on-surface-variant" />
              </div>
              <p className="text-sm text-on-surface-variant">
                {searchQuery ? "No matches found." : "People you split bills with appear here."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((c) => (
                <div key={c.name} className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-[0.99] transition-all border border-transparent hover:border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 text-lg font-bold text-on-surface-variant">
                      {c.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{c.name}</span>
                  </div>
                  <button
                    onClick={() => removeContact(c.name)}
                    className="border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform hover:bg-error-container/10 hover:border-error hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

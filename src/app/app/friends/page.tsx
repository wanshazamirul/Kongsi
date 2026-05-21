"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/top-bar";
import { AddFriendModal } from "@/components/add-friend-modal";
import { toast } from "sonner";

interface Contact {
  name: string;
  avatar?: string;
}

export default function FriendsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem("kongsi_contacts") || "[]")); } catch {}
  }, []);

  function addContact(name: string, avatar?: string) {
    if (contacts.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Contact already exists");
      return;
    }
    const next = [...contacts, { name, avatar }];
    setContacts(next);
    localStorage.setItem("kongsi_contacts", JSON.stringify(next));
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
      <TopBar />

      <main className="pt-14 px-5 max-w-3xl mx-auto flex flex-col gap-6">
        {/* Search */}
        <div className="relative flex items-center mt-1">
          <Search className="absolute left-4 w-5 h-5 text-outline" />
          <Input
            className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-outline shadow-[0px_4px_20px_rgba(15,23,42,0.05)]"
            placeholder="Search friends by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Recent + New button — always visible */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface">
            {contacts.length > 0 ? "Recent" : "Add Friends"}
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 no-scrollbar">
            {contacts.slice(0, 8).map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-2 min-w-[72px]">
                <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-surface-container-lowest shadow-[0px_4px_20px_rgba(15,23,42,0.05)] overflow-hidden flex items-center justify-center">
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-on-surface-variant">{c.name[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-on-surface-variant truncate w-full text-center">{c.name}</span>
              </div>
            ))}
            <button
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-center gap-2 min-w-[72px] active:scale-95 transition-transform group"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary shadow-[0px_4px_20px_rgba(15,23,42,0.05)] group-hover:bg-primary/10 transition-colors">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary truncate w-full text-center">New</span>
            </button>
          </div>
        </div>

        {/* All Contacts list — only when there are contacts */}
        {contacts.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-semibold text-on-surface">All Contacts</h2>
              <span className="text-xs font-semibold text-outline">{contacts.length} {contacts.length === 1 ? "friend" : "friends"}</span>
            </div>

            {filtered.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filtered.map((c) => (
                  <div key={c.name} className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between shadow-[0px_4px_20px_rgba(15,23,42,0.05)] active:scale-[0.99] transition-all border border-transparent hover:border-outline-variant">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-on-surface-variant">{c.name[0].toUpperCase()}</span>
                        )}
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
            ) : (
              <p className="text-center text-sm text-on-surface-variant py-8">No matches found.</p>
            )}
          </div>
        )}
      </main>

      <AddFriendModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addContact} />
    </div>
  );
}

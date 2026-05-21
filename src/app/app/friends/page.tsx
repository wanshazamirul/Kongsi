"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Contact {
  name: string;
}

export default function FriendsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    try {
      setContacts(JSON.parse(localStorage.getItem("kongsi_contacts") || "[]"));
    } catch {}
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
    toast.success("Contact added!");
  }

  function removeContact(name: string) {
    const next = contacts.filter((c) => c.name !== name);
    setContacts(next);
    localStorage.setItem("kongsi_contacts", JSON.stringify(next));
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Friends</h1>

      {/* Add contact */}
      <div className="flex gap-2 mb-6">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a name..."
          className="bg-surface-container-lowest border-outline-variant rounded-xl"
          onKeyDown={(e) => e.key === "Enter" && addContact()}
        />
        <Button onClick={addContact} size="icon" className="bg-primary text-primary-foreground rounded-xl">
          <UserPlus className="w-4 h-4" />
        </Button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
            <Users className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant text-center">
            People you've split bills with will appear here automatically.
            <br />
            You can also add them manually above.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.name} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center text-sm font-bold">
                  {c.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-on-surface">{c.name}</span>
              </div>
              <button onClick={() => removeContact(c.name)} className="p-2 text-on-surface-variant hover:text-error rounded-full hover:bg-error-container/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

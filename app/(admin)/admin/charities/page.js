"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Heart,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Calendar,
  Check,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [events, setEvents] = useState([]);

  // New Event Form fields
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  async function fetchCharities() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/charities");
      if (!res.ok) throw new Error("Failed to load charities");
      const data = await res.json();
      setCharities(data.charities || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCharities();
  }, []);

  function openCreateModal() {
    setEditingCharity(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setIsFeatured(false);
    setEvents([]);
    setModalOpen(true);
  }

  function openEditModal(charity) {
    setEditingCharity(charity);
    setName(charity.name || "");
    setSlug(charity.slug || "");
    setDescription(charity.description || "");
    setImageUrl(charity.image_url || "");
    setIsFeatured(!!charity.is_featured);
    setEvents(Array.isArray(charity.events) ? charity.events : []);
    setModalOpen(true);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/charities/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image upload failed");

      setImageUrl(data.url);
      toast.success("Media uploaded successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddEvent() {
    if (!eventTitle.trim()) {
      toast.error("Event title is required");
      return;
    }

    const newEv = {
      id: Date.now().toString(),
      title: eventTitle.trim(),
      date: eventDate || new Date().toISOString().split("T")[0],
      location: eventLocation.trim(),
      description: eventDescription.trim(),
    };

    setEvents([...events, newEv]);
    setEventTitle("");
    setEventDate("");
    setEventLocation("");
    setEventDescription("");
    toast.success("Event added to charity schedule");
  }

  function handleRemoveEvent(eventId) {
    setEvents(events.filter((ev) => ev.id !== eventId));
  }

  async function handleSaveCharity() {
    if (!name.trim()) {
      toast.error("Charity name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        slug: slug.trim() || undefined,
        description,
        image_url: imageUrl || null,
        is_featured: isFeatured,
        events,
      };

      const url = editingCharity
        ? `/api/admin/charities/${editingCharity.id}`
        : "/api/admin/charities";
      const method = editingCharity ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      toast.success(
        editingCharity ? "Charity updated" : "Charity created successfully"
      );
      setModalOpen(false);
      fetchCharities();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCharity(id, cName) {
    if (!confirm(`Are you sure you want to delete charity "${cName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/charities/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Charity deleted");
      fetchCharities();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Charity Partners
            <span className="text-xs font-mono text-[#8A8F98]">
              ({charities.length} registered)
            </span>
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Manage beneficiary causes, upload brand media to Supabase Storage, and schedule non-profit events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCharities}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs text-[#8A8F98] hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="add-charity"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-all shadow-md shadow-[#5E6AD2]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Charity</span>
          </button>
        </div>
      </div>

      {/* Charities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-[#8A8F98]">
            <div className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
            <div>Loading charities directory...</div>
          </div>
        ) : charities.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#8A8F98]">
            No charity partners registered yet. Click &quot;Add Charity&quot; to create one.
          </div>
        ) : (
          charities.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-xl bg-[#0F1011] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                        <Heart className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#8590EA] transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[10px] text-[#8A8F98] font-mono">
                        /charities/{c.slug}
                      </p>
                    </div>
                  </div>

                  {c.is_featured && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Featured
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#8A8F98] line-clamp-2 leading-relaxed">
                  {c.description || "No mission description provided."}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8A8F98]">Impact Raised</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(c.totalRaisedCents || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8A8F98]">Scheduled Events</span>
                  <span className="text-[#8A8F98]">
                    {Array.isArray(c.events) ? c.events.length : 0} events
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-[#8A8F98] hover:text-white transition-colors"
                    title="Edit charity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCharity(c.id, c.name)}
                    className="p-1.5 rounded bg-white/[0.04] hover:bg-red-500/10 text-[#8A8F98] hover:text-red-400 transition-colors"
                    title="Delete charity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl bg-[#0F1011] border border-white/[0.12] rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h2 className="text-base font-semibold text-white">
                {editingCharity ? "Edit Charity Partner" : "Add New Charity Partner"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8A8F98] font-medium mb-1">
                    Charity Name *
                  </label>
                  <input
                    type="text"
                    data-testid="charity-name-input"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCharity) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "")
                        );
                      }
                    }}
                    placeholder="e.g. Junior Golf Foundation"
                    className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#8A8F98] font-medium mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    data-testid="charity-slug-input"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="junior-golf-foundation"
                    className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white font-mono focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-[#8A8F98] font-medium mb-1">
                  Mission & Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain how funds raised support golfers and local communities..."
                  className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                />
              </div>

              {/* Image Upload & Storage */}
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                <label className="block text-xs text-white font-medium">
                  Charity Media / Logo (Supabase Storage Bucket: &quot;charity-media&quot;)
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Charity Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#8A8F98] shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? "Uploading to Storage..." : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste external image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-white/20 bg-[#08090A] text-[#5E6AD2] focus:ring-0"
                />
                <label htmlFor="featuredToggle" className="text-xs text-white cursor-pointer select-none">
                  Highlight on public Homepage Spotlight (is_featured)
                </label>
              </div>

              {/* Events Editor */}
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Upcoming Events Schedule
                  </h3>
                  <span className="text-[10px] text-[#8A8F98] font-mono">
                    {events.length} events
                  </span>
                </div>

                {/* Add Event Sub-form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Event Title (e.g. Charity Golf Classic)"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Location (e.g. Pine Valley Golf Club)"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                  <input
                    type="text"
                    placeholder="Brief description or ticket details"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-3 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium transition-colors"
                >
                  + Add Event to List
                </button>

                {/* Existing Events List */}
                <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2 rounded bg-[#08090A] border border-white/[0.04] text-xs"
                    >
                      <div>
                        <span className="font-medium text-white">{ev.title}</span>
                        <span className="text-[10px] text-[#8A8F98] ml-2 font-mono">
                          {ev.date} {ev.location ? `• ${ev.location}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(ev.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-[#8A8F98] hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                data-testid="charity-form-submit"
                onClick={handleSaveCharity}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Charity Partner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

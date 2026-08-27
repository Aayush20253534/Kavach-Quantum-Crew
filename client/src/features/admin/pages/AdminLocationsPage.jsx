import React, { useEffect, useMemo, useState } from 'react';
import {
  ImagePlus,
  Loader2,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { adminService } from '../api/adminService';

const EMPTY_FORM = {
  name: '',
  state: '',
  country: 'India',
  latitude: '',
  longitude: '',
  description: '',
  featured: true,
  active: true,
  sortOrder: 0,
};

export function AdminLocationsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminService.getDestinations({
        search: search.trim() || undefined,
        limit: 100,
      });
      setItems(Array.isArray(result) ? result : result?.items || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          requestError?.message ||
          'Unable to load destinations.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImage(null);
  };

  const edit = (destination) => {
    setEditingId(destination.id);
    setImage(null);
    setForm({
      name: destination.name || '',
      state: destination.state || '',
      country: destination.country || 'India',
      latitude: destination.latitude ?? '',
      longitude: destination.longitude ?? '',
      description: destination.description || '',
      featured: destination.featured ?? true,
      active: destination.active ?? true,
      sortOrder: destination.sortOrder ?? 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        description: form.description.trim() || null,
        featured: Boolean(form.featured),
        active: Boolean(form.active),
        sortOrder: Number(form.sortOrder) || 0,
      };

      const destination = editingId
        ? await adminService.updateDestination(editingId, payload)
        : await adminService.createDestination(payload);

      if (image) {
        await adminService.uploadDestinationImage(destination.id, image);
      }

      setSuccess(
        editingId
          ? 'Destination updated.'
          : 'Destination added and is now available to the tourist dashboard.',
      );
      reset();
      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          requestError?.message ||
          'Unable to save destination.',
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (destination) => {
    if (
      !window.confirm(
        `Remove ${destination.name}? It will disappear from tourist destination lists.`,
      )
    ) {
      return;
    }

    try {
      await adminService.deleteDestination(destination.id);
      if (editingId === destination.id) reset();
      await load();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to remove destination.',
      );
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Content Management
        </p>
        <h1 className="mt-1 text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <MapPinned className="w-6 h-6" /> Destination Registry
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Maintain approved tourist destinations, map coordinates, publishing status and dashboard media.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border p-4 text-xs ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || success}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white border border-slate-950 rounded-lg  overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-black text-xs uppercase tracking-wide">
              {editingId ? 'Update destination' : 'Create destination'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Define destination identity, geography and publishing details. Changes are reflected in tourist-facing destination experiences.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid gap-x-6 gap-y-5 p-5 md:grid-cols-2 lg:p-6">
          <AdminField
            label="Destination name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            required
          />
          <AdminField
            label="State / Region"
            value={form.state}
            onChange={(value) => setForm((current) => ({ ...current, state: value }))}
            required
          />
          <AdminField
            label="Country"
            value={form.country}
            onChange={(value) => setForm((current) => ({ ...current, country: value }))}
            required
          />
          <AdminField
            label="Display order"
            type="number"
            value={form.sortOrder}
            onChange={(value) =>
              setForm((current) => ({ ...current, sortOrder: value }))
            }
          />
          <AdminField
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(value) =>
              setForm((current) => ({ ...current, latitude: value }))
            }
            required
          />
          <AdminField
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(value) =>
              setForm((current) => ({ ...current, longitude: value }))
            }
            required
          />

          <div className="md:col-span-2">
            <label className="block mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="w-full min-h-24 rounded-lg rounded-lg border border-slate-950 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-100 resize-y"
              placeholder="Short tourist-facing description"
            />
          </div>

          <label className="md:col-span-2 rounded-lg border border-dashed border-slate-950 bg-slate-50 p-4 cursor-pointer flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-950 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-slate-800" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black">
                {image ? image.name : editingId ? 'Replace destination media' : 'Destination media'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                JPEG, PNG or WebP. Maximum file size: 5 MB.
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap gap-5">
            <Toggle
              label="Featured"
              checked={form.featured}
              onChange={(value) =>
                setForm((current) => ({ ...current, featured: value }))
              }
            />
            <Toggle
              label="Active"
              checked={form.active}
              onChange={(value) =>
                setForm((current) => ({ ...current, active: value }))
              }
            />
          </div>
        </div>

        <div className="rounded-lg flex justify-end border-t border-slate-950 bg-slate-50 px-5 py-4">
          <button
            disabled={saving}
            className="px-5 py-2.5 rounded-md bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editingId ? 'Save changes' : 'Create destination'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-950 rounded-lg  overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search destinations"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-md text-xs outline-none"
            />
          </div>
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 border border-slate-200 rounded-md text-[11px] font-bold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.length === 0 && (
              <p className="p-8 text-xs text-slate-500 text-center">
                No destinations configured.
              </p>
            )}
            {items.map((destination) => (
              <div
                key={destination.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-full sm:w-24 h-20 rounded-md overflow-hidden bg-slate-100 shrink-0">
                  {destination.imageUrl ? (
                    <img
                      src={destination.imageUrl}
                      alt={destination.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPinned className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="font-black">{destination.name}</h3>
                    {destination.featured && (
                      <span className="text-[9px] uppercase font-black bg-slate-100 text-slate-900 px-2 py-0.5 rounded-md">
                        Featured
                      </span>
                    )}
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md ${
                        destination.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {destination.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {destination.state}, {destination.country}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {destination.latitude}, {destination.longitude}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => edit(destination)}
                    className="w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(destination)}
                    className="w-9 h-9 rounded-md border border-red-200 flex items-center justify-center text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  type = 'text',
  step,
  required = false,
}) {
  return (
    <div>
      <label className="block mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-11 rounded-lg rounded-lg border border-slate-950 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-[11px] font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 accent-slate-950"
      />
      {label}
    </label>
  );
}

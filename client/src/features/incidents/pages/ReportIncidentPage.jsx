import React, { useEffect, useRef, useState } from 'react';

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import { useGeolocation } from '../../tracking/hooks/useGeolocation';

import { EvidenceUploader } from '../components/EvidenceUploader';

import { safetyService } from '../../safety/api/safetyService';

const TYPES = [
  ['CROWD', 'Crowd / stampede risk'],
  ['MEDICAL', 'Medical emergency'],
  ['FIRE', 'Fire / smoke'],
  ['ROAD_BLOCK', 'Road obstruction'],
  ['UNSAFE_AREA', 'Unsafe area / harassment / theft concern'],
  ['WEATHER', 'Severe weather'],
  ['OTHER', 'Other safety concern'],
];

function CategoryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    TYPES.find(([optionValue]) => optionValue === value) || TYPES[0];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative mt-2"
    >
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          flex
          h-11
          w-full
          items-center
          justify-between
          rounded-lg
          border
          bg-white
          px-3.5
          text-left
          text-[13px]
          font-medium
          text-slate-800
          outline-none
          transition
          sm:text-sm
          ${
            open
              ? 'border-rose-400 ring-2 ring-rose-100'
              : 'border-slate-200 hover:border-slate-300'
          }
        `}
      >
        <span className="truncate">
          {selectedOption[1]}
        </span>

        <ChevronDown
          className={`
            ml-3
            h-4
            w-4
            shrink-0
            text-slate-400
            transition-transform
            duration-200
            ${open ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Actual dropdown */}
      {open && (
        <div
          role="listbox"
          className="
            absolute
            left-0
            right-0
            top-full
            z-50
            mt-1.5
            max-h-64
            overflow-y-auto
            rounded-xl
            border
            border-slate-200
            bg-white
            p-1.5
            shadow-xl
            shadow-slate-900/10
          "
        >
          {TYPES.map(([optionValue, label]) => {
            const selected = optionValue === value;

            return (
              <button
                key={optionValue}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(optionValue)}
                className={`
                  flex
                  w-full
                  items-center
                  justify-between
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-[13px]
                  transition
                  ${
                    selected
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'font-medium text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <span>{label}</span>

                {selected && (
                  <Check className="h-4 w-4 shrink-0 text-rose-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportIncidentPage() {
  const { location } = useGeolocation(undefined, false);

  const [type, setType] = useState('CROWD');

  const [severity, setSeverity] = useState('HIGH');

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');

  const [locationName, setLocationName] = useState('');

  const [created, setCreated] = useState(null);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    if (!location) {
      setError(
        'Live location is required to submit a safety report.',
      );

      return;
    }

    setBusy(true);

    setError('');

    try {
      const result = await safetyService.reportHazard({
        type,

        severity,

        title: title.trim(),

        description: description.trim(),

        latitude: location.lat,

        longitude: location.lng,

        ...(locationName.trim()
          ? {
              locationName: locationName.trim(),
            }
          : {}),

        occurredAt: new Date().toISOString(),
      });

      setCreated(result);
    } catch (e) {
      setError(
        e?.response?.data?.error?.message ||
          e.message ||
          'Unable to submit report',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* HEADER */}

      <div className="mb-4 sm:mb-6">
        <h1 className="text-[20px] sm:text-2xl leading-tight font-black">
          Report Safety Concern
        </h1>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            mb-4
            rounded-lg
            border
            border-red-200
            bg-red-50
            p-3
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {!created ? (
        <form
          onSubmit={submit}
          className="
            space-y-4
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            sm:space-y-5
            sm:p-6
          "
        >
          {/* CATEGORY */}

          <div>
            <span className="text-xs font-bold text-slate-500">
              Category
            </span>

            <CategoryDropdown
              value={type}
              onChange={setType}
            />
          </div>

          {/* SEVERITY */}

          <div>
            <span className="text-xs font-bold text-slate-500">
              Severity
            </span>

            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL',
              ].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSeverity(value)}
                  className={`
                    rounded-lg
                    border
                    p-2
                    text-[10px]
                    font-black
                    transition
                    ${
                      severity === value
                        ? `
                          border-rose-300
                          bg-rose-50
                          text-rose-700
                        `
                        : `
                          border-slate-200
                          bg-white
                          text-slate-700
                          hover:bg-slate-50
                        `
                    }
                  `}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* TITLE */}

          <input
            required
            minLength={3}
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Short title"
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              px-3.5
              py-2.5
              text-[13px]
              outline-none
              transition
              focus:border-rose-400
              focus:ring-2
              focus:ring-rose-100
              sm:text-sm
            "
          />

          {/* LOCATION NAME */}

          <input
            value={locationName}
            onChange={(e) =>
              setLocationName(e.target.value)
            }
            placeholder="Readable location / landmark (optional)"
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              px-3.5
              py-2.5
              text-[13px]
              outline-none
              transition
              focus:border-rose-400
              focus:ring-2
              focus:ring-rose-100
              sm:text-sm
            "
          />

          {/* DESCRIPTION */}

          <textarea
            required
            minLength={3}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Describe what happened"
            rows={5}
            className="
              w-full
              resize-none
              rounded-lg
              border
              border-slate-200
              px-3.5
              py-2.5
              text-[13px]
              outline-none
              transition
              focus:border-rose-400
              focus:ring-2
              focus:ring-rose-100
              sm:text-sm
            "
          />

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={busy || !location}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-rose-600
              py-2.5
              text-[11px]
              font-black
              uppercase
              tracking-wider
              text-white
              transition
              hover:bg-rose-700
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:py-3
              sm:text-xs
            "
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}

            Submit Report
          </button>
        </form>
      ) : (
        /* SUCCESS */

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-7
            shadow-sm
          "
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />

          <h2 className="text-xl font-black mt-4">
            Report submitted
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Reference:{' '}

            <span className="font-mono">
              {created.id}
            </span>
          </p>

          <div className="mt-6">
            <EvidenceUploader
              entityId={created.id}
              entityType="HAZARD"
            />
          </div>

          <div className="mt-6">
            <Link
              to="/tourist/dashboard"
              className="
                inline-flex
                rounded-lg
                border
                border-slate-200
                px-5
                py-2.5
                text-xs
                font-black
              "
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
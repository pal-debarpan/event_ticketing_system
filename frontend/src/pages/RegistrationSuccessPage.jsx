import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Check, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { formatEventDateTime } from '../utils/formatters';

export default function RegistrationSuccessPage() {
  const location = useLocation();
  const state = location.state;

  // If directly navigated to without state, redirect to events list
  if (!state || !state.registrationId) {
    return <Navigate to="/" replace />;
  }

  const { fullFormatted } = formatEventDateTime(state.eventDate);

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8">
      {/* Institutional Confirmation Header */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 px-1 font-medium">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Institutional Event Confirmation</span>
      </div>

      {/* Confirmation Card */}
      <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        {/* Header with green check badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#d1fae5] dark:bg-emerald-950/60 text-[#065f46] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              OFFICE OF STUDENT & CIVIC ENGAGEMENT
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              Registration Successful
            </h1>
          </div>
        </div>

        {/* Informational Banner */}
        {state.emailSent === false ? (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3.5">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Registration successful, but we couldn't send the confirmation email.
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Please contact the organizer or save your Registration ID below to present at the venue.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl bg-[#f0f5ff] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3.5">
            <div className="p-1.5 bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Your QR ticket has been sent to your email.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Check your spam folder if you don't see it.
              </p>
            </div>
          </div>
        )}

        {/* Registration Summary Table */}
        <div className="mt-8">
          <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
            REGISTRATION SUMMARY
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/70">
            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-transparent">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Name</span>
              <span className="sm:col-span-2 font-bold text-slate-900 dark:text-white">{state.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-white dark:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Event</span>
              <span className="sm:col-span-2 font-bold text-slate-900 dark:text-white">{state.eventName || 'Campus Event'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-transparent">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Date & start time</span>
              <span className="sm:col-span-2 font-bold text-slate-900 dark:text-white">
                {fullFormatted || 'To be announced'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-white dark:bg-slate-800/40">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Venue</span>
              <span className="sm:col-span-2 font-bold text-slate-900 dark:text-white">{state.venue || 'Campus Venue'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs bg-[#f8fafc] dark:bg-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Registration ID</span>
              <span className="sm:col-span-2 font-mono font-medium text-slate-800 dark:text-slate-200 break-all">
                {state.registrationId}
              </span>
            </div>
          </div>
        </div>

        {/* Back to Events Action */}
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to events</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

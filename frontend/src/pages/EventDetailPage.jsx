import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Mail, 
  UserCheck, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Landmark, 
  Ban 
} from 'lucide-react';
import { api } from '../api';
import { formatEventDateTime } from '../utils/formatters';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getEventById(id);
    if (res.ok && res.data) {
      setEvent(res.data);
    } else {
      setError(res.status === 404 ? 'Event not found' : (res.data?.error || 'Failed to load event details'));
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setSubmitError('Please provide both your full name and university email address.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const res = await api.registerForEvent(id, {
      name: name.trim(),
      email: email.trim(),
    });

    setSubmitting(false);

    if (res.ok && res.data) {
      // Navigate to /registration-success with the actual backend registration reference ID
      navigate('/registration-success', {
        state: {
          registrationId: res.data.registration.id,
          name: name.trim(),
          email: email.trim(),
          eventName: event?.name,
          venue: event?.venue,
          eventDate: event?.event_date,
          emailSent: res.data.emailSent !== false,
        },
      });
    } else {
      // Backend error responses: 409 capacity full, 409 duplicate registration, 400 validation, 500
      const errorMsg = res.data?.error || res.data?.message || 'Registration failed. Please try again.';
      setSubmitError(errorMsg);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-80 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Error State
  if (error || !event) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center max-w-lg mx-auto shadow-xs my-8">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {error === 'Event not found' ? 'Event Not Found' : 'Error Loading Event'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-6">
          {error === 'Event not found'
            ? 'The requested campus event does not exist or may have been removed.'
            : error}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0055b3] dark:bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-[#004494] dark:hover:bg-blue-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to events
        </Link>
      </div>
    );
  }

  const { date, time } = formatEventDateTime(event.event_date);
  const capacity = Number(event.capacity) || 0;
  const spotsTaken = event.spots_taken !== undefined 
    ? Number(event.spots_taken) 
    : (event.registration_count !== undefined ? Number(event.registration_count) : null);
  
  const isFull = spotsTaken !== null && spotsTaken >= capacity;
  const spotsRemaining = spotsTaken !== null ? Math.max(0, capacity - spotsTaken) : null;
  const percentage = spotsTaken !== null && capacity > 0 ? Math.min(100, Math.round((spotsTaken / capacity) * 100)) : null;

  return (
    <div className="space-y-6">
      {/* Back to Events Navigation */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to events</span>
        </Link>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event details */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                <Landmark className="w-3 h-3" />
                Academic & Civic Engagement
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <MapPin className="w-3 h-3" />
                On Campus
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {event.name}
            </h1>

            {event.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Info Card: Date & Time + Venue */}
          <div className="bg-[#f0f4f8] dark:bg-slate-900/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0055b3] dark:text-blue-400 shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  DATE & TIME
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {date}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {time}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[#0055b3] dark:text-blue-400 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  VENUE
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {event.venue}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Campus Venue
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & Attendance Card */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 mb-2 font-medium">
              <div className="flex items-center gap-1.5 font-semibold">
                <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Capacity & Attendance</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {spotsTaken !== null ? `${spotsTaken} of ${capacity} spots taken` : `${capacity} seats capacity`}
              </span>
            </div>

            {spotsTaken !== null && (
              <>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-slate-400 dark:bg-slate-600' : 'bg-[#0055b3] dark:bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  <span>{isFull ? 'Registration closed' : 'Open registration'}</span>
                  <span>{isFull ? '0 spots remaining' : `${spotsRemaining} spots remaining`}</span>
                </div>
              </>
            )}
          </div>

          {/* Event Venue Photography / Visual */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs h-56 bg-slate-800">
            <img
              src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80"
              alt="Campus Auditorium"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
              {event.venue}
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900/95 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Register for this event
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Complete your registration to secure guaranteed entry.
            </p>

            {/* Error alerts from real backend validation */}
            {submitError && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Unable to register</div>
                  <div>{submitError}</div>
                </div>
              </div>
            )}

            {isFull ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center mx-auto">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Capacity Reached</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Registration for this event is currently full. No additional passes can be issued.
                  </p>
                </div>
                <button
                  disabled
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                >
                  Registration Unavailable
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="student-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full name *
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="student-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email address *
                  </label>
                  <input
                    id="student-email"
                    type="email"
                    required
                    placeholder="jane.doe@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>Your QR ticket will be emailed to this address.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering attendee...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Register</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>University single registration protocol</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

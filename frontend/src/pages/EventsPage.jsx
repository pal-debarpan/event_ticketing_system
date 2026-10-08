import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Hourglass, Ban, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { formatEventDateTime } from '../utils/formatters';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getEvents();
    if (res.ok && Array.isArray(res.data)) {
      setEvents(res.data);
    } else {
      setError(res.data?.error || 'Unable to connect to the server to fetch campus events.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Upcoming events
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Browse university campus events and register for admission.
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-2/3 mb-4"></div>
              <div className="flex gap-4 mb-4">
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-32"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-32"></div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-2 bg-slate-100 dark:bg-slate-800/60 rounded w-48"></div>
                <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error state */
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-xl p-8 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to load events</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
            {error}
          </p>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0055b3] dark:bg-blue-600 hover:bg-[#004494] dark:hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        /* Empty state */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No upcoming events</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            There are currently no events scheduled on campus. Please check back later.
          </p>
        </div>
      ) : (
        /* Real Events List */
        <div className="space-y-4">
          {events.map((event) => {
            const { fullFormatted } = formatEventDateTime(event.event_date);
            const capacity = Number(event.capacity) || 0;
            const spotsTaken = event.spots_taken !== undefined 
              ? Number(event.spots_taken) 
              : (event.registration_count !== undefined ? Number(event.registration_count) : null);
            
            const isFull = spotsTaken !== null && spotsTaken >= capacity;
            const isAlmostFull = spotsTaken !== null && !isFull && (capacity - spotsTaken <= 10);
            const spotsRemaining = spotsTaken !== null ? Math.max(0, capacity - spotsTaken) : null;
            const percentage = spotsTaken !== null && capacity > 0 ? Math.min(100, Math.round((spotsTaken / capacity) * 100)) : null;

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Status Badges */}
                {isFull ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-2.5">
                    <Ban className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Event full</span>
                  </div>
                ) : isAlmostFull ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50 mb-2.5">
                    <Hourglass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Almost full — {spotsRemaining} spots left</span>
                  </div>
                ) : null}

                {/* Event Name */}
                <h2 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition">
                  <Link to={`/events/${event.id}`}>
                    {event.name}
                  </Link>
                </h2>

                {/* Event Description */}
                {event.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Meta details: Date/time & Venue */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{fullFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                {/* Progress bar and Register Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Spots info */}
                  <div className="flex-1 max-w-md">
                    {spotsTaken !== null ? (
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                          <span>{spotsTaken} of {capacity} spots taken</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull
                                ? 'bg-slate-400 dark:bg-slate-600'
                                : isAlmostFull
                                ? 'bg-amber-600 dark:bg-amber-500'
                                : 'bg-[#0055b3] dark:bg-blue-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Capacity: <span className="font-semibold text-slate-700 dark:text-slate-200">{capacity} attendees</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div>
                    {isFull ? (
                      <button
                        disabled
                        className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      >
                        Registration unavailable
                      </button>
                    ) : (
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 transition shadow-xs"
                      >
                        View event & register
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

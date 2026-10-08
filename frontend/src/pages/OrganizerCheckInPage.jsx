import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Scan,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  CameraOff,
  RotateCw,
  Link as LinkIcon,
  Clock,
  MapPin,
  Calendar,
  User,
  Mail,
  PlusCircle,
  ChevronDown,
  PartyPopper,
} from 'lucide-react';
import { api, getAuthToken, clearAuthToken } from '../api';
import { formatTimestamp } from '../utils/formatters';

export default function OrganizerCheckInPage({ organizer, setOrganizer }) {
  const navigate = useNavigate();

  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualError, setManualError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [autoResumeSeconds, setAutoResumeSeconds] = useState(null);

  // ─── Create Event state ───────────────────────────────────────────────────
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createEventForm, setCreateEventForm] = useState({
    name: '', description: '', venue: '', event_date: '', capacity: ''
  });
  const [createEventLoading, setCreateEventLoading] = useState(false);
  const [createEventSuccess, setCreateEventSuccess] = useState(null);
  const [createEventError, setCreateEventError] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isStartingRef = useRef(false);
  const isLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const resumeTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const startScannerRef = useRef(null);

  // ─── Auth validation ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = getAuthToken();
    if (!token) { navigate('/organizer/login'); return; }
    api.getCurrentOrganizer().then((res) => {
      if (res.ok && res.data?.organizer) {
        if (mountedRef.current) setOrganizer(res.data.organizer);
      } else if (res.status === 401) {
        handleSessionExpired();
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSessionExpired = useCallback(() => {
    clearAuthToken();
    setOrganizer(null);
    navigate('/organizer/login', { state: { sessionExpired: true } });
  }, [navigate, setOrganizer]);

  const clearTimers = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    resumeTimerRef.current = null;
    countdownIntervalRef.current = null;
  }, []);

  // ─── Stop scanner cleanly ─────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    const s = html5QrCodeRef.current;
    if (s) {
      if (s.isScanning) {
        try {
          await s.stop();
          console.log('[QR] Scanner stopped');
        } catch (err) {
          console.warn('[QR] Error stopping scanner:', err);
        }
      }
      try {
        s.clear();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }
    if (mountedRef.current) {
      setScannerActive(false);
    }
  }, []);

  // ─── Token verification ───────────────────────────────────────────────────
  // UUID v4 pattern — matches the Ticket ID shown in the confirmation email
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const processTokenVerification = useCallback(async (token) => {
    if (!token || !mountedRef.current) return;
    setIsVerifying(true);
    setVerificationResult(null);
    setManualError(null);
    const value = token.trim();
    // If the input looks like a UUID Ticket ID (from the email fallback), use
    // the ticketId lookup path. Otherwise treat it as a signed QR token.
    const isTicketId = UUID_RE.test(value);
    console.log('[QR] Sending for verification as', isTicketId ? 'ticketId' : 'token');
    try {
      const res = await api.verifyTicket(isTicketId ? { ticketId: value } : { token: value });
      console.log('[QR] Verification response:', res.status, res.data?.status);
      if (!mountedRef.current) return;
      if (res.status === 401) { handleSessionExpired(); return; }
      if (res.status === 200 && res.data?.status === 'CHECKED-IN') {
        setVerificationResult({ status: 'CHECKED-IN', checkedInAt: res.data.checkedInAt || new Date().toISOString(), participant: res.data.participant, event: res.data.event });
      } else if (res.status === 409 && res.data?.status === 'ALREADY USED') {
        setVerificationResult({ status: 'ALREADY USED', checkedInAt: res.data.checkedInAt || null, participant: res.data.participant, event: res.data.event });
      } else if (res.status === 400 || res.data?.status === 'INVALID TICKET') {
        setVerificationResult({ status: 'INVALID TICKET', message: res.data?.message || 'Invalid or unrecognized ticket token' });
      } else {
        setVerificationResult({ status: 'NETWORK ERROR', message: res.data?.error || res.data?.message || 'Unable to communicate with verification server' });
      }
    } catch (err) {
      if (mountedRef.current) setVerificationResult({ status: 'NETWORK ERROR', message: err.message || 'An unexpected verification error occurred' });
    } finally {
      if (mountedRef.current) setIsVerifying(false);
    }
  }, [handleSessionExpired]);

  // ─── Auto-resume countdown ─────────────────────────────────────────────────
  const startAutoResumeCountdown = useCallback(() => {
    clearTimers();
    if (!mountedRef.current) return;
    let secs = 2;
    setAutoResumeSeconds(secs);
    countdownIntervalRef.current = setInterval(() => {
      secs -= 1;
      if (mountedRef.current) setAutoResumeSeconds(secs);
      if (secs <= 0) clearInterval(countdownIntervalRef.current);
    }, 1000);
    resumeTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setVerificationResult(null);
        setAutoResumeSeconds(null);
        isLockedRef.current = false;
        if (startScannerRef.current) startScannerRef.current();
      }
    }, 2200);
  }, [clearTimers]);

  // ─── Manual "Scan Next" reset ──────────────────────────────────────────────
  const resetAndScan = useCallback(() => {
    clearTimers();
    setVerificationResult(null);
    setIsVerifying(false);
    setAutoResumeSeconds(null);
    isLockedRef.current = false;
    if (startScannerRef.current) startScannerRef.current();
  }, [clearTimers]);

  // ─── Start scanner ─────────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (!mountedRef.current || isStartingRef.current) return;
    const el = document.getElementById('reader');
    if (!el) return;

    isStartingRef.current = true;
    console.log('[QR] Initializing scanner...');

    // Stop and clear any previous instance cleanly
    await stopScanner();
    if (!mountedRef.current) {
      isStartingRef.current = false;
      return;
    }

    const scanner = new Html5Qrcode('reader', {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: false,
      },
    });
    html5QrCodeRef.current = scanner;
    isLockedRef.current = false;

    const scanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(160, Math.floor(minEdge * 0.75));
        return { width: size, height: size };
      },
      disableFlip: false,
    };

    const handleSuccess = (decodedText) => {
      console.log('[QR] QR detected:', decodedText);
      if (isLockedRef.current) return;
      isLockedRef.current = true;

      stopScanner().then(() => {
        if (mountedRef.current) {
          processTokenVerification(decodedText).then(() => {
            startAutoResumeCountdown();
          });
        }
      });
    };

    const handleError = () => {
      // Ignored: expected per-frame callback when no QR code is in frame
    };

    try {
      try {
        await scanner.start({ facingMode: 'environment' }, scanConfig, handleSuccess, handleError);
      } catch (envErr) {
        // Fallback to default user-facing camera on devices without 'environment' camera
        await scanner.start({ facingMode: 'user' }, scanConfig, handleSuccess, handleError);
      }

      console.log('[QR] Camera started');
      if (mountedRef.current) {
        setScannerActive(true);
        setCameraError(null);
      }
    } catch (err) {
      console.error('[QR] Startup error:', err);
      if (mountedRef.current) {
        setScannerActive(false);
        setCameraError(err.message || 'Unable to access camera');
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [stopScanner, processTokenVerification, startAutoResumeCountdown]);

  // Keep stable ref in sync
  useEffect(() => { startScannerRef.current = startScanner; }, [startScanner]);

  // ─── Mount / Unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => {
      if (startScannerRef.current) startScannerRef.current();
    }, 100);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      clearTimers();
      stopScanner();
    };
  }, [clearTimers, stopScanner]);

  // ─── Manual submit ─────────────────────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) { setManualError('Please enter a ticket token'); return; }
    if (isLockedRef.current) return;
    isLockedRef.current = true;
    const tokenToVerify = manualToken.trim();
    setManualToken('');
    await stopScanner();
    await processTokenVerification(tokenToVerify);
    startAutoResumeCountdown();
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Scanner + Manual Entry */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Scan className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Scan ticket</span>
            </div>
            {scannerActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Camera Active
              </span>
            ) : cameraError ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/60">
                <CameraOff className="w-3 h-3" />Camera Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Camera Starting...
              </span>
            )}
          </div>

          {/* Scanner viewport — #reader must be the ONLY element with z-index inside this box */}
          <div className="relative bg-[#0b141a] rounded-xl aspect-[4/3] overflow-hidden border border-slate-800 shadow-inner">
            {/* html5-qrcode mounts here — full coverage, lowest z-index */}
            <div id="reader" className="absolute inset-0 z-10" />

            {/* Decorative overlays — pointer-events:none so they never block video */}
            <div className="absolute inset-8 pointer-events-none z-20 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
                <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
              </div>
              <div className="mx-auto opacity-15"><QrCode className="w-20 h-20 text-cyan-200" /></div>
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
                <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />
              </div>
            </div>

            {/* Laser line — pointer-events:none */}
            {scannerActive && !isVerifying && (
              <div className="laser-line z-20 pointer-events-none" />
            )}

            {/* Camera error overlay */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 z-30 flex flex-col items-center justify-center p-6 text-center text-white">
                <CameraOff className="w-10 h-10 text-red-400 mb-2" />
                <p className="text-xs font-semibold text-slate-200">Camera Unavailable</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{cameraError}</p>
                <button type="button" onClick={() => { setCameraError(null); startScanner(); }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition">
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">Hold the QR code inside the frame.</div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              <span className="bg-white dark:bg-slate-900 px-3">ENTER TOKEN MANUALLY</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label htmlFor="token-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ticket Token</label>
              <div className="flex gap-2">
                <input id="token-input" type="text" placeholder="Paste ticket token" value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)} disabled={isVerifying}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition font-mono" />
                <button type="submit" disabled={isVerifying}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.99] transition shadow-xs disabled:opacity-75">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                </button>
              </div>
            </div>
            {manualError && <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{manualError}</p>}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Paste the ticket token from the confirmation email if QR scanning is unavailable.</span>
            </div>
          </form>
        </div>

        {/* Right: Result Display */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 min-h-[460px] flex flex-col justify-center">
          {isVerifying ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Ticket...</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Validating cryptographic pass token against the institutional admission ledger.</p>
            </div>
          ) : verificationResult?.status === 'CHECKED-IN' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">ADMISSION APPROVED</div>
                  <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-200 tracking-tight">CHECKED-IN</h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Attendee is verified and authorized for entry.</p>
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/70">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><User className="w-4 h-4 text-slate-400" /><span>Attendee Name</span></div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{verificationResult.participant?.name || 'Verified Attendee'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><Mail className="w-4 h-4 text-slate-400" /><span>Email</span></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationResult.participant?.email || 'N/A'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><Calendar className="w-4 h-4 text-slate-400" /><span>Event</span></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationResult.event?.name || 'Campus Event'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><MapPin className="w-4 h-4 text-slate-400" /><span>Venue</span></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationResult.event?.venue || 'Campus Venue'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs bg-[#f0fdf4] dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium"><Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><span>Check-in Timestamp</span></div>
                  <span className="font-mono font-semibold text-emerald-900 dark:text-emerald-300">{formatTimestamp(verificationResult.checkedInAt)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span>Auto-resuming in {autoResumeSeconds ?? 2}s for next attendee...</span>
                </div>
                <button type="button" onClick={resetAndScan} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 transition">Scan Next</button>
              </div>
            </div>
          ) : verificationResult?.status === 'ALREADY USED' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold tracking-wider text-amber-800 dark:text-amber-300 uppercase">DUPLICATE SCAN ATTEMPT</div>
                  <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200 tracking-tight">ALREADY USED</h2>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">This ticket has already been used for entry.</p>
                </div>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/70">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><User className="w-4 h-4 text-slate-400" /><span>Attendee Name</span></div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{verificationResult.participant?.name || 'Attendee'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><Mail className="w-4 h-4 text-slate-400" /><span>Email</span></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationResult.participant?.email || 'N/A'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium"><Calendar className="w-4 h-4 text-slate-400" /><span>Event</span></div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{verificationResult.event?.name || 'Campus Event'}</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs bg-amber-50/70 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium"><Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" /><span>Original Check-in</span></div>
                  <span className="font-mono font-bold text-amber-950 dark:text-amber-200">{formatTimestamp(verificationResult.checkedInAt)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span>Auto-resuming in {autoResumeSeconds ?? 2}s...</span>
                </div>
                <button type="button" onClick={resetAndScan} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 transition">Scan Next</button>
              </div>
            </div>
          ) : verificationResult?.status === 'INVALID TICKET' || verificationResult?.status === 'NETWORK ERROR' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <XCircle className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold tracking-wider text-red-800 dark:text-red-300 uppercase">ENTRY DENIED</div>
                  <h2 className="text-2xl font-black text-red-900 dark:text-red-200 tracking-tight">
                    {verificationResult.status === 'NETWORK ERROR' ? 'NETWORK ERROR' : 'INVALID TICKET'}
                  </h2>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{verificationResult.message || 'The presented ticket could not be validated.'}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-100">Inspection Note:</div>
                <p>Ensure the attendee is displaying their official email ticket QR code, or retry pasting their ticket token manually.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span>Auto-resuming in {autoResumeSeconds ?? 2}s...</span>
                </div>
                <button type="button" onClick={resetAndScan} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 transition">Scan Again</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#e0e7ff] dark:bg-blue-950/60 text-[#4338ca] dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Waiting for scan...</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  Present attendee QR code to the entrance camera or paste the pass token manually.
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Station ready for entrance throughput
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Event ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Accordion header */}
        <button
          type="button"
          onClick={() => { setCreateEventOpen(o => !o); setCreateEventSuccess(null); setCreateEventError(null); }}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">Create New Event</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${createEventOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {createEventOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5">
            {createEventSuccess ? (
              <div className="flex flex-col items-center text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PartyPopper className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Event Created!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{createEventSuccess}</span> is now listed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCreateEventSuccess(null); setCreateEventForm({ name: '', description: '', venue: '', event_date: '', capacity: '' }); }}
                  className="mt-1 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 transition"
                >
                  Create Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCreateEventError(null);
                  setCreateEventLoading(true);
                  try {
                    const res = await api.createEvent({
                      name: createEventForm.name.trim(),
                      description: createEventForm.description.trim() || undefined,
                      venue: createEventForm.venue.trim(),
                      event_date: createEventForm.event_date,
                      capacity: Number(createEventForm.capacity),
                    });
                    if (res.ok && res.data?.id) {
                      setCreateEventSuccess(res.data.name || createEventForm.name.trim());
                      setCreateEventForm({ name: '', description: '', venue: '', event_date: '', capacity: '' });
                    } else if (res.status === 401) {
                      handleSessionExpired();
                    } else {
                      setCreateEventError(res.data?.error || res.data?.message || 'Failed to create event. Please try again.');
                    }
                  } catch (err) {
                    setCreateEventError(err.message || 'Unexpected error.');
                  } finally {
                    setCreateEventLoading(false);
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {/* Event Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" required placeholder="e.g. Annual Tech Fest 2026"
                    value={createEventForm.name}
                    onChange={e => setCreateEventForm(f => ({ ...f, name: e.target.value }))}
                    disabled={createEventLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea
                    rows={2} placeholder="Brief description of the event…"
                    value={createEventForm.description}
                    onChange={e => setCreateEventForm(f => ({ ...f, description: e.target.value }))}
                    disabled={createEventLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue <span className="text-red-500">*</span></label>
                  <input
                    type="text" required placeholder="e.g. Main Auditorium"
                    value={createEventForm.venue}
                    onChange={e => setCreateEventForm(f => ({ ...f, venue: e.target.value }))}
                    disabled={createEventLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacity <span className="text-red-500">*</span></label>
                  <input
                    type="number" required min="1" placeholder="e.g. 200"
                    value={createEventForm.capacity}
                    onChange={e => setCreateEventForm(f => ({ ...f, capacity: e.target.value }))}
                    disabled={createEventLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                </div>

                {/* Date & Time */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date &amp; Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local" required
                    value={createEventForm.event_date}
                    onChange={e => setCreateEventForm(f => ({ ...f, event_date: e.target.value }))}
                    disabled={createEventLoading}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0055b3] dark:focus:border-blue-500 transition"
                  />
                </div>

                {/* Error */}
                {createEventError && (
                  <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">{createEventError}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit" disabled={createEventLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0055b3] hover:bg-[#004494] dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.99] transition shadow-xs disabled:opacity-70"
                  >
                    {createEventLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                      : <><PlusCircle className="w-4 h-4" /> Create Event</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
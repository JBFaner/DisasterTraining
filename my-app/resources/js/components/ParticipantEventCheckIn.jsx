import React from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { CheckCircle2, Keyboard, QrCode } from 'lucide-react';

function parseCheckInCode(raw) {
    const trimmed = String(raw || '').trim();
    if (!trimmed) {
        return null;
    }

    try {
        const json = JSON.parse(trimmed);
        if (json.attendance_code) {
            return String(json.attendance_code).trim();
        }
        if (json.type === 'simulation_event_checkin' && json.code) {
            return String(json.code).trim();
        }
    } catch {
        // plain code
    }

    return trimmed;
}

export function ParticipantEventCheckIn({ eventId, checkIn = {}, onSuccess }) {
    const [code, setCode] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [scanOpen, setScanOpen] = React.useState(false);
    const scannerRef = React.useRef(null);
    const regionId = `participant-checkin-${eventId}`;
    const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content || '';

    const submitCode = React.useCallback(async (rawCode, method = 'attendance_code') => {
        const attendanceCode = parseCheckInCode(rawCode);
        if (!attendanceCode) {
            Swal.fire({ icon: 'warning', title: 'Enter a code', text: 'Scan the venue QR or type the check-in code.' });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/participant/simulation-events/${eventId}/check-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    attendance_code: attendanceCode,
                    check_in_method: method,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Check-in failed.');
            }

            Swal.fire({
                icon: 'success',
                title: data.already_checked_in ? 'Already checked in' : 'Checked in',
                text: data.message,
                timer: 2200,
                showConfirmButton: false,
            });
            onSuccess?.();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Check-in failed',
                text: error.message || 'Could not complete check-in.',
            });
        } finally {
            setSubmitting(false);
        }
    }, [csrf, eventId, onSuccess]);

    React.useEffect(() => {
        if (!scanOpen) {
            return undefined;
        }

        let scanner = null;
        const start = async () => {
            try {
                scanner = new Html5Qrcode(regionId);
                scannerRef.current = scanner;
                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        if (scanner?.isScanning) {
                            await scanner.stop().catch(() => {});
                        }
                        setScanOpen(false);
                        await submitCode(decodedText, 'qr_code');
                    },
                    () => {},
                );
            } catch {
                Swal.fire('Camera Error', 'Unable to access the camera. Enter the code manually instead.', 'error');
                setScanOpen(false);
            }
        };

        start();

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current = null;
        };
    }, [scanOpen, submitCode]);

    if (checkIn.checked_in) {
        return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">You are checked in</p>
                    <p className="text-xs text-emerald-800 mt-0.5">Attendance recorded for this drill.</p>
                </div>
            </div>
        );
    }

    if (!checkIn.enabled) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Self check-in is not enabled for this event. Ask your facilitator to mark attendance manually.
            </div>
        );
    }

    if (!checkIn.available) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {checkIn.window_open
                    ? 'Check-in opens once your registration is approved.'
                    : 'Self check-in opens on the event day (or while the drill is ongoing).'}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
                <h3 className="text-sm font-bold text-slate-900">Self check-in</h3>
                <p className="mt-1 text-xs text-slate-600">
                    Scan the QR code at the venue or enter the check-in code from your facilitator.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setScanOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                    <QrCode className="w-4 h-4" />
                    Scan venue QR
                </button>
            </div>

            <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    submitCode(code, 'attendance_code');
                }}
            >
                <label className="flex-1">
                    <span className="sr-only">Check-in code</span>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter check-in code"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm uppercase tracking-wide focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </label>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                    <Keyboard className="w-4 h-4" />
                    {submitting ? 'Checking in…' : 'Submit code'}
                </button>
            </form>

            {scanOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-900">Scan venue QR</h4>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (scannerRef.current?.isScanning) {
                                        await scannerRef.current.stop().catch(() => {});
                                    }
                                    setScanOpen(false);
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Close
                            </button>
                        </div>
                        <div id={regionId} className="w-full rounded-lg overflow-hidden bg-slate-100 min-h-[280px]" />
                    </div>
                </div>
            )}
        </div>
    );
}

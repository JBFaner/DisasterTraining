import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';

/**
 * QR scanner for marking event attendance via participant QR codes.
 */
export default function AttendanceQrScanner({ eventId, csrfToken, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const regionId = `qr-reader-${eventId}`;

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        let scanner = null;
        const start = async () => {
            try {
                scanner = new Html5Qrcode(regionId);
                scannerRef.current = scanner;
                setScanning(true);
                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        await handleScan(decodedText, scanner);
                    },
                    () => {},
                );
            } catch (err) {
                setScanning(false);
                Swal.fire('Camera Error', 'Unable to access camera. Enter participant ID manually or check permissions.', 'error');
            }
        };

        start();

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current = null;
        };
    }, [open]);

    const parsePayload = (raw) => {
        try {
            const json = JSON.parse(raw);
            return {
                user_id: json.user_id ?? json.userId ?? null,
                participant_id: json.participant_id ?? json.participantId ?? null,
            };
        } catch {
            if (/^\d+$/.test(raw)) {
                return { user_id: parseInt(raw, 10), participant_id: null };
            }
            return { user_id: null, participant_id: raw };
        }
    };

    const handleScan = async (decodedText, scanner) => {
        if (scanner?.isScanning) {
            await scanner.stop().catch(() => {});
        }
        setScanning(false);
        setOpen(false);

        const payload = parsePayload(decodedText.trim());
        const body = {
            check_in_method: 'qr_code',
            ...payload,
        };

        try {
            const response = await fetch(`/admin/simulation-events/${eventId}/attendance/mark-present`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Present', text: data.message, timer: 2000, showConfirmButton: false });
                onSuccess?.();
            } else {
                Swal.fire({ icon: 'error', title: 'Scan Failed', text: data.message || 'Could not mark attendance.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to submit attendance.' });
        }
    };

    const handleManualEntry = async () => {
        const { value } = await Swal.fire({
            title: 'Enter Participant ID',
            input: 'text',
            inputPlaceholder: 'Participant ID or QR payload',
            showCancelButton: true,
        });
        if (value) {
            await handleScan(value, null);
        }
    };

    if (!open) {
        return (
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1.5"
                >
                    📷 Scan QR
                </button>
                <button
                    type="button"
                    onClick={handleManualEntry}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5"
                >
                    Manual ID
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Scan Participant QR</h3>
                    <button
                        type="button"
                        onClick={async () => {
                            if (scannerRef.current?.isScanning) {
                                await scannerRef.current.stop().catch(() => {});
                            }
                            setOpen(false);
                            setScanning(false);
                        }}
                        className="text-slate-500 hover:text-slate-700 text-sm"
                    >
                        Close
                    </button>
                </div>
                <div id={regionId} className="w-full rounded-lg overflow-hidden bg-slate-100 min-h-[280px]" />
                {scanning && <p className="text-xs text-slate-500 mt-2 text-center">Point camera at participant QR code</p>}
            </div>
        </div>
    );
}

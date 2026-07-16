import React from 'react';
import Swal from 'sweetalert2';

const MAX_TAB_SWITCH_VIOLATIONS = 3;

/**
 * Lightweight proctoring guards for quiz pages: block copy/paste and warn on tab switches.
 */
export function useQuizIntegrityGuards({ enabled = true, onAutoSubmit } = {}) {
    const violationsRef = React.useRef(0);
    const warnedRef = React.useRef(false);

    React.useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const blockClipboard = (event) => {
            event.preventDefault();
        };

        const blockContextMenu = (event) => {
            event.preventDefault();
        };

        const handleVisibility = () => {
            if (document.visibilityState !== 'hidden') {
                return;
            }

            violationsRef.current += 1;
            const count = violationsRef.current;

            if (count >= MAX_TAB_SWITCH_VIOLATIONS) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Quiz submitted',
                    text: 'Too many tab switches detected. Your quiz will be submitted automatically.',
                    allowOutsideClick: false,
                }).then(() => {
                    onAutoSubmit?.();
                });
                return;
            }

            if (!warnedRef.current) {
                warnedRef.current = true;
            }

            Swal.fire({
                icon: 'warning',
                title: 'Stay on this page',
                text: `Switching tabs or windows is not allowed during the quiz. Warning ${count} of ${MAX_TAB_SWITCH_VIOLATIONS}.`,
                confirmButtonColor: '#059669',
            });
        };

        document.addEventListener('copy', blockClipboard);
        document.addEventListener('cut', blockClipboard);
        document.addEventListener('paste', blockClipboard);
        document.addEventListener('contextmenu', blockContextMenu);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('copy', blockClipboard);
            document.removeEventListener('cut', blockClipboard);
            document.removeEventListener('paste', blockClipboard);
            document.removeEventListener('contextmenu', blockContextMenu);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [enabled, onAutoSubmit]);
}

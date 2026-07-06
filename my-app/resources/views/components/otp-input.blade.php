@props([
    'name' => 'otp',
    'length' => 6,
    'label' => 'Verification Code',
    'error' => null,
    'clearOnError' => false,
])

@php
    $groupId = 'otp-group-' . $name;
    $hiddenId = $name . '-hidden';
    $errorId = $name . '-client-error';
@endphp

<div
    class="otp-input-component"
    data-otp-root
    data-otp-length="{{ $length }}"
    data-otp-name="{{ $name }}"
    data-otp-clear="{{ $clearOnError ? '1' : '0' }}"
>
    <label class="block text-sm font-semibold text-slate-700 mb-2" for="{{ $groupId }}-digit-0">
        {{ $label }}
    </label>

    <div
        id="{{ $groupId }}"
        class="flex gap-2 sm:gap-3 justify-center"
        role="group"
        aria-label="{{ $label }}"
    >
        @for ($i = 0; $i < $length; $i++)
            <input
                id="{{ $groupId }}-digit-{{ $i }}"
                type="text"
                inputmode="numeric"
                pattern="[0-9]"
                maxlength="1"
                autocomplete="{{ $i === 0 ? 'one-time-code' : 'off' }}"
                aria-label="Digit {{ $i + 1 }} of {{ $length }}"
                data-otp-digit
                data-otp-index="{{ $i }}"
                class="otp-digit w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-semibold text-slate-800 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition shadow-sm"
            />
        @endfor
    </div>

    <input type="hidden" name="{{ $name }}" id="{{ $hiddenId }}" value="" data-otp-hidden />

    <p id="{{ $errorId }}" class="mt-2 text-xs text-rose-600 hidden" data-otp-client-error role="alert"></p>

    @if ($error)
        <p class="mt-2 text-xs text-rose-600" id="{{ $name }}-server-error">{{ $error }}</p>
    @endif
</div>

@once
    @push('scripts')
        <script>
            (function () {
                function initOtpRoot(root) {
                    if (!root || root.dataset.otpInitialized === '1') {
                        return;
                    }
                    root.dataset.otpInitialized = '1';

                    const length = parseInt(root.dataset.otpLength || '6', 10);
                    const shouldClear = root.dataset.otpClear === '1';
                    const form = root.closest('form');
                    const digits = Array.from(root.querySelectorAll('[data-otp-digit]'));
                    const hidden = root.querySelector('[data-otp-hidden]');
                    const clientError = root.querySelector('[data-otp-client-error]');

                    if (!digits.length || !hidden || !form) {
                        return;
                    }

                    function showClientError(message) {
                        if (!clientError) {
                            return;
                        }
                        if (message) {
                            clientError.textContent = message;
                            clientError.classList.remove('hidden');
                        } else {
                            clientError.textContent = '';
                            clientError.classList.add('hidden');
                        }
                    }

                    function getCode() {
                        return digits.map((input) => input.value).join('');
                    }

                    function syncHidden() {
                        hidden.value = getCode();
                    }

                    function focusDigit(index) {
                        const target = digits[Math.max(0, Math.min(index, digits.length - 1))];
                        if (target) {
                            target.focus();
                            target.select();
                        }
                    }

                    function focusFirstEmpty() {
                        const firstEmpty = digits.findIndex((input) => input.value === '');
                        focusDigit(firstEmpty === -1 ? digits.length - 1 : firstEmpty);
                    }

                    function clearAll(focusFirstDigit) {
                        digits.forEach((input) => {
                            input.value = '';
                        });
                        syncHidden();
                        showClientError('');
                        if (focusFirstDigit) {
                            focusDigit(0);
                        }
                    }

                    function fillFromString(value, startIndex) {
                        const onlyDigits = String(value || '').replace(/\D/g, '');
                        if (!onlyDigits) {
                            return startIndex;
                        }

                        let index = startIndex;
                        for (const char of onlyDigits) {
                            if (index >= digits.length) {
                                break;
                            }
                            digits[index].value = char;
                            index += 1;
                        }

                        syncHidden();
                        return index;
                    }

                    digits.forEach((input, index) => {
                        input.addEventListener('input', (event) => {
                            showClientError('');
                            const raw = event.target.value;
                            const numeric = raw.replace(/\D/g, '');

                            if (!numeric) {
                                input.value = '';
                                syncHidden();
                                return;
                            }

                            if (numeric.length > 1) {
                                const nextIndex = fillFromString(numeric, index);
                                focusDigit(Math.min(nextIndex, digits.length - 1));
                                return;
                            }

                            input.value = numeric.slice(-1);
                            syncHidden();

                            if (index < digits.length - 1) {
                                focusDigit(index + 1);
                            }
                        });

                        input.addEventListener('keydown', (event) => {
                            if (event.key === 'Backspace') {
                                if (input.value === '') {
                                    if (index > 0) {
                                        event.preventDefault();
                                        digits[index - 1].value = '';
                                        syncHidden();
                                        focusDigit(index - 1);
                                    }
                                } else {
                                    input.value = '';
                                    syncHidden();
                                }
                                showClientError('');
                                return;
                            }

                            if (event.key === 'ArrowLeft' && index > 0) {
                                event.preventDefault();
                                focusDigit(index - 1);
                                return;
                            }

                            if (event.key === 'ArrowRight' && index < digits.length - 1) {
                                event.preventDefault();
                                focusDigit(index + 1);
                                return;
                            }

                            if (event.key === 'Enter') {
                                event.preventDefault();
                                syncHidden();
                                const code = getCode();
                                if (code.length === length && /^\d+$/.test(code)) {
                                    form.requestSubmit();
                                } else {
                                    showClientError('Please enter all ' + length + ' digits.');
                                    focusDigit(code.length);
                                }
                            }
                        });

                        input.addEventListener('paste', (event) => {
                            event.preventDefault();
                            const pasted = event.clipboardData?.getData('text') || '';
                            const nextIndex = fillFromString(pasted, index);
                            focusDigit(Math.min(nextIndex, digits.length - 1));
                            showClientError('');
                        });

                        input.addEventListener('focus', () => {
                            const firstEmpty = digits.findIndex((d) => d.value === '');
                            if (firstEmpty !== -1 && firstEmpty < index) {
                                focusDigit(firstEmpty);
                                return;
                            }
                            input.select();
                        });
                    });

                    form.addEventListener('submit', (event) => {
                        syncHidden();
                        const code = getCode();

                        if (code.length !== length || !/^\d+$/.test(code)) {
                            event.preventDefault();
                            showClientError('Please enter all ' + length + ' digits.');
                            focusDigit(code.length);
                        }
                    });

                    if (shouldClear) {
                        clearAll(true);
                    } else {
                        syncHidden();
                        focusFirstEmpty();
                    }
                }

                function initAllOtpInputs() {
                    document.querySelectorAll('[data-otp-root]').forEach(initOtpRoot);
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initAllOtpInputs);
                } else {
                    initAllOtpInputs();
                }
            })();
        </script>
    @endpush
@endonce

// ===== Mascare automată =====
        function applyDateMask(input) {
            let val = input.value.replace(/\D/g, '');
            if (val.length > 8) val = val.slice(0, 8);
            let formatted = '';
            if (val.length > 0) formatted += val.substring(0, 2);
            if (val.length >= 3) formatted += '.' + val.substring(2, 4);
            if (val.length >= 5) formatted += '.' + val.substring(4, 8);
            input.value = formatted;
        }
        function applyTimeMask(input) {
            let val = input.value.replace(/\D/g, '');
            if (val.length > 4) val = val.slice(0, 4);
            let formatted = '';
            if (val.length > 0) formatted += val.substring(0, 2);
            if (val.length >= 3) formatted += ':' + val.substring(2, 4);
            input.value = formatted;
        }
        document.addEventListener('input', function(e) {
            if (e.target.classList.contains('date-masked')) applyDateMask(e.target);
            if (e.target.classList.contains('time-masked')) applyTimeMask(e.target);
        });

        // ===== Funcții parsare/formatare =====
        function parseRoDate(str) {
            if (!str) return null;
            const parts = str.trim().split('.');
            if (parts.length !== 3) return null;
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
            const d = new Date(year, month - 1, day);
            if (d.getDate() !== day || d.getMonth() !== month - 1 || d.getFullYear() !== year) return null;
            return d;
        }
        function parseRoTime(str) {
            if (!str) return { hours: 0, minutes: 0 };
            const parts = str.trim().split(':');
            if (parts.length !== 2) return { hours: 0, minutes: 0 };
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
            return { hours, minutes };
        }
        function combineRoDateTime(dateStr, timeStr) {
            const d = parseRoDate(dateStr);
            if (!d) return null;
            const time = parseRoTime(timeStr);
            if (!time) return null;
            d.setHours(time.hours, time.minutes, 0, 0);
            return d;
        }
        function formatRoDate(date) {
            if (!date || isNaN(date)) return '—';
            return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        }
        function formatRoDateTime(date) {
            return `${formatRoDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        function setToday(inputId) {
            const input = document.getElementById(inputId);
            if (input) input.value = formatRoDate(new Date());
        }
        function setNow(inputId) {
            const input = document.getElementById(inputId);
            if (input) {
                const now = new Date();
                input.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            }
        }

        const { calculateDeadline } = TermeneCore;

        // ===== Termene predefinite =====
        const predefinedTerms = {
            manual: {
                duration: '',
                unit: 'days',
                termType: 'general'
            },
            contestatie: {
                duration: 3,
                unit: 'days',
                termType: 'general'
            },
            apel: {
                duration: 10,
                unit: 'days',
                termType: 'general'
            },
            recurs: {
                duration: 30,
                unit: 'days',
                termType: 'general'
            }
        };

        function applyPreset(presetId) {
            const preset = predefinedTerms[presetId];
            if (!preset) return;

            document.getElementById('durationInput').value = preset.duration;
            document.getElementById('unitSelect').value = preset.unit;
            document.getElementById('termTypeSelect').value = preset.termType;
        }

        // ===== Interfață =====
        function calculateTerm() {
            const startDateStr = document.getElementById('startDateInput').value.trim();
            const startTimeStr = document.getElementById('startTimeInput').value.trim();
            const duration = Number(document.getElementById('durationInput').value);
            const unit = document.getElementById('unitSelect').value;
            const termType = document.getElementById('termTypeSelect').value;
            const preset = document.getElementById('presetSelect').value;

            if (!startDateStr) {
                alert('Completează data de început.');
                return;
            }
            if (!Number.isSafeInteger(duration) || duration <= 0) {
                alert('Introdu o durată validă.');
                return;
            }

            if (unit === 'hours' && !startTimeStr) { alert('Pentru termenele calculate pe ore, completează ora de început.'); return; }
            const start = combineRoDateTime(startDateStr, startTimeStr || '00:00');
            if (!start) {
                alert('Data de început este invalidă.');
                return;
            }

            try {
                const res = calculateDeadline({ start, duration, unit, termType });

                const displayDate = res.effectiveDeadline;

                const resultDiv = document.getElementById('deadlineResult');
                resultDiv.style.display = 'block';
                const displayStr = unit === 'hours' ? formatRoDateTime(displayDate) : formatRoDate(displayDate);
                resultDiv.innerHTML = `<div class="big-result">TERMEN-LIMITĂ EFECTIV:<br>${displayStr}</div>`;
            } catch (err) {
                alert(err.message);
            }
        }

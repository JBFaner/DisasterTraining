import React from 'react';

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white';
const readOnlyClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700';

/**
 * Cascading location selector scoped to Quezon City (NCR → Metro Manila → Quezon City → Barangays).
 */
export function PhilippineLocationSelect({
    initialBarangayId = '',
    namePrefix = '',
    required = true,
    onResolved = null,
    apiBase = '/api/locations',
}) {
    const prefix = namePrefix ? `${namePrefix}_` : '';
    const [regionId, setRegionId] = React.useState('');
    const [provinceId, setProvinceId] = React.useState('');
    const [cityId, setCityId] = React.useState('');
    const [barangayId, setBarangayId] = React.useState(initialBarangayId ? String(initialBarangayId) : '');

    const [regions, setRegions] = React.useState([]);
    const [provinces, setProvinces] = React.useState([]);
    const [cities, setCities] = React.useState([]);
    const [barangays, setBarangays] = React.useState([]);
    const [resolved, setResolved] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        fetch(`${apiBase}/regions`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setRegions(d.regions || []))
            .catch(console.error);
    }, [apiBase]);

    React.useEffect(() => {
        if (!regionId) {
            setProvinces([]);
            return;
        }
        fetch(`${apiBase}/provinces?region_id=${regionId}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setProvinces(d.provinces || []))
            .catch(console.error);
    }, [regionId, apiBase]);

    React.useEffect(() => {
        if (!provinceId && !regionId) {
            setCities([]);
            return;
        }
        const params = provinceId ? `province_id=${provinceId}` : `region_id=${regionId}`;
        fetch(`${apiBase}/cities?${params}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setCities(d.cities || []))
            .catch(console.error);
    }, [regionId, provinceId, apiBase]);

    React.useEffect(() => {
        if (!cityId) {
            setBarangays([]);
            return;
        }
        fetch(`${apiBase}/barangays?city_id=${cityId}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setBarangays(d.barangays || []))
            .catch(console.error);
    }, [cityId, apiBase]);

    const resolveBarangay = React.useCallback(async (id) => {
        if (!id) {
            setResolved(null);
            onResolved?.(null);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/resolve?barangay_id=${id}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const data = await res.json();
            setResolved(data);
            if (data.region_id) setRegionId(String(data.region_id));
            if (data.province_id) setProvinceId(String(data.province_id));
            if (data.city_id) setCityId(String(data.city_id));
            onResolved?.(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [apiBase, onResolved]);

    // Auto-select NCR → Metro Manila → Quezon City on first load
    React.useEffect(() => {
        if (initialized || regions.length === 0) return;
        const ncr = regions.find((r) => r.name === 'NCR') || regions[0];
        if (ncr && !regionId) {
            setRegionId(String(ncr.id));
        }
    }, [regions, initialized, regionId]);

    React.useEffect(() => {
        if (initialized || provinces.length === 0 || !regionId) return;
        const mm = provinces.find((p) => p.name === 'Metro Manila') || provinces[0];
        if (mm && !provinceId) {
            setProvinceId(String(mm.id));
        }
    }, [provinces, initialized, regionId, provinceId]);

    React.useEffect(() => {
        if (initialized || cities.length === 0) return;
        const qc = cities.find((c) => c.name === 'Quezon City') || cities[0];
        if (qc && !cityId) {
            setCityId(String(qc.id));
        }
    }, [cities, initialized, cityId]);

    React.useEffect(() => {
        if (initialBarangayId && cityId && !initialized) {
            setBarangayId(String(initialBarangayId));
            resolveBarangay(String(initialBarangayId)).finally(() => setInitialized(true));
        } else if (cityId && !initialBarangayId) {
            setInitialized(true);
        }
    }, [initialBarangayId, cityId, initialized, resolveBarangay]);

    const handleBarangayChange = (e) => {
        const id = e.target.value;
        setBarangayId(id);
        resolveBarangay(id);
    };

    const location = resolved?.location;
    const completeAddress = location?.barangay_address || '';

    return (
        <div className="space-y-4">
            <input type="hidden" name={`${prefix}philippine_barangay_id`} value={barangayId} />
            <input type="hidden" name={`${prefix}region`} value={location?.region || 'NCR'} />
            <input type="hidden" name={`${prefix}province`} value={location?.province || 'Metro Manila'} />
            <input type="hidden" name={`${prefix}municipality_city`} value={location?.municipality_city || 'Quezon City'} />
            <input type="hidden" name={`${prefix}barangay_name`} value={location?.barangay_name || ''} />
            <input type="hidden" name={`${prefix}barangay_address`} value={completeAddress} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Region{required && <span className="text-rose-500"> *</span>}
                    </label>
                    <select value={regionId} required={required} disabled className={readOnlyClass}>
                        {regions.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                        {!regions.length && <option value="">NCR</option>}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Province{required && <span className="text-rose-500"> *</span>}
                    </label>
                    <select value={provinceId} required={required} disabled className={readOnlyClass}>
                        {provinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        {!provinces.length && <option value="">Metro Manila</option>}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Municipality / City{required && <span className="text-rose-500"> *</span>}
                    </label>
                    <select value={cityId} required={required} disabled className={readOnlyClass}>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        {!cities.length && <option value="">Quezon City</option>}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Barangay{required && <span className="text-rose-500"> *</span>}
                    </label>
                    <select
                        value={barangayId}
                        onChange={handleBarangayChange}
                        required={required}
                        disabled={!cityId || loading}
                        className={inputClass}
                    >
                        <option value="">Select barangay...</option>
                        {barangays.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Complete Barangay Address</label>
                <input
                    type="text"
                    readOnly
                    value={completeAddress}
                    placeholder="Auto-generated after selecting a barangay"
                    className={readOnlyClass}
                />
            </div>
        </div>
    );
}

export default PhilippineLocationSelect;

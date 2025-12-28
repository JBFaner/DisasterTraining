import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    Download,
    AlertCircle,
    Package,
    CheckCircle,
    Clock,
    AlertTriangle,
    Home,
    Link2,
    RotateCcw,
} from 'lucide-react';
import Swal from 'sweetalert2';

export function ResourceInventory() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [conditionFilter, setConditionFilter] = useState('all');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [selectedResourceHistory, setSelectedResourceHistory] = useState(null);

    const resourceTypes = ['PPE', 'Fire Equipment', 'Medical', 'Communication', 'Vehicles', 'Tools', 'Other'];
    const statusOptions = ['Available', 'In Use', 'Under Maintenance', 'Damaged', 'Missing', 'Reserved'];
    const conditionOptions = ['New', 'Good', 'Needs Repair', 'Damaged'];

    // Fetch resources from API on component mount
    useEffect(() => {
        fetchResources();
        fetchEvents();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/resources');
            const data = await response.json();
            
            if (!response.ok) {
                console.error('API Error:', response.status, data);
                throw new Error(data.error || 'Failed to fetch resources');
            }
            
            console.log('Resources loaded:', data);
            setResources(data.resources || data);
        } catch (error) {
            console.error('Error fetching resources:', error);
            Swal.fire('Error', 'Failed to load resources: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/simulation-events');
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchResourceHistory = async (resourceId) => {
        try {
            const response = await fetch(`/api/resources/${resourceId}/history`);
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setSelectedResourceHistory(data);
        } catch (error) {
            console.error('Error fetching resource history:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Available':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'In Use':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'Under Maintenance':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case 'Damaged':
            case 'Missing':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return <Package className="w-4 h-4 text-slate-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available':
                return 'bg-emerald-100 text-emerald-800';
            case 'In Use':
                return 'bg-blue-100 text-blue-800';
            case 'Under Maintenance':
                return 'bg-yellow-100 text-yellow-800';
            case 'Damaged':
            case 'Missing':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getConditionColor = (condition) => {
        switch (condition) {
            case 'New':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'Good':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'Needs Repair':
                return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'Damaged':
                return 'bg-red-50 text-red-700 border border-red-200';
            default:
                return 'bg-slate-50 text-slate-700 border border-slate-200';
        }
    };

    // Normalize resource strings to avoid undefined errors
    const normalizedResources = resources.map((resource) => ({
        ...resource,
        _name: (resource.name || '').toLowerCase(),
        _serial: (resource.serialNumber || resource.serial_number || '').toLowerCase(),
    }));

    const filteredResources = normalizedResources.filter((resource) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            query === '' ||
            resource._name.includes(query) ||
            resource._serial.includes(query);
        const matchesType = resourceTypeFilter === 'all' || resource.category === resourceTypeFilter;
        const matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
        const matchesCondition = conditionFilter === 'all' || resource.condition === conditionFilter;

        return matchesSearch && matchesType && matchesStatus && matchesCondition;
    });

    // Suggestions for typeahead dropdown (startsWith)
    const searchSuggestions = searchQuery
        ? normalizedResources
              .filter((resource) =>
                  resource._name.startsWith(searchQuery.toLowerCase()) ||
                  resource._serial.startsWith(searchQuery.toLowerCase())
              )
              .slice(0, 6)
        : [];

    const handleAddResource = () => {
        Swal.fire({
            title: 'Add New Resource',
            html: `
                <form id="addResourceForm" class="text-left space-y-4">
                    <input type="text" id="resourceName" placeholder="Resource Name" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                    <select id="resourceCategory" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        <option value="">Select Category</option>
                        ${resourceTypes.map((type) => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                    <input type="number" id="resourceQuantity" placeholder="Quantity" class="w-full px-3 py-2 border border-slate-300 rounded-md" required min="1">
                    <input type="text" id="serialNumber" placeholder="Serial Number (Optional)" class="w-full px-3 py-2 border border-slate-300 rounded-md">
                    <select id="resourceCondition" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        <option value="">Select Condition</option>
                        ${conditionOptions.map((cond) => `<option value="${cond}">${cond}</option>`).join('')}
                    </select>
                    <input type="text" id="location" placeholder="Storage Location (e.g., Warehouse A, Shelf 3)" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Add Resource',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10b981',
            preConfirm: async () => {
                const name = document.getElementById('resourceName').value;
                const category = document.getElementById('resourceCategory').value;
                const quantity = document.getElementById('resourceQuantity').value;
                const serialNumber = document.getElementById('serialNumber').value;
                const condition = document.getElementById('resourceCondition').value;
                const location = document.getElementById('location').value;

                if (!name || !category || !quantity || !condition || !location) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                try {
                    const response = await fetch('/resources', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                        },
                        body: JSON.stringify({
                            name,
                            category,
                            quantity: parseInt(quantity),
                            serial_number: serialNumber,
                            condition,
                            location,
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to add resource');
                    
                    fetchResources();
                    Swal.fire('Success', 'Resource added successfully', 'success');
                } catch (error) {
                    Swal.showValidationMessage(error.message);
                    return false;
                }
            },
        });
    };

    const handleEditResource = (resource) => {
        Swal.fire({
            title: 'Edit Resource',
            html: `
                <form id="editResourceForm" class="text-left space-y-4">
                    <input type="text" id="resourceName" placeholder="Resource Name" value="${resource.name}" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                    <select id="resourceCategory" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        ${resourceTypes.map((type) => `<option value="${type}" ${type === resource.category ? 'selected' : ''}>${type}</option>`).join('')}
                    </select>
                    <input type="number" id="resourceQuantity" placeholder="Quantity" value="${resource.quantity}" class="w-full px-3 py-2 border border-slate-300 rounded-md" required min="1">
                    <select id="resourceStatus" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        ${statusOptions.map((status) => `<option value="${status}" ${status === resource.status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                    <select id="resourceCondition" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        ${conditionOptions.map((cond) => `<option value="${cond}" ${cond === resource.condition ? 'selected' : ''}>${cond}</option>`).join('')}
                    </select>
                    <input type="text" id="location" placeholder="Storage Location" value="${resource.location}" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update Resource',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3b82f6',
            preConfirm: async () => {
                const name = document.getElementById('resourceName').value;
                const category = document.getElementById('resourceCategory').value;
                const quantity = document.getElementById('resourceQuantity').value;
                const status = document.getElementById('resourceStatus').value;
                const condition = document.getElementById('resourceCondition').value;
                const location = document.getElementById('location').value;

                if (!name || !category || !quantity || !status || !condition || !location) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                try {
                    const response = await fetch(`/resources/${resource.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            _method: 'PUT',
                            name,
                            category,
                            quantity: parseInt(quantity),
                            status,
                            condition,
                            location,
                        }),
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to update resource');
                    }
                    
                    await fetchResources();
                    return true;
                } catch (error) {
                    console.error('Update error:', error);
                    Swal.showValidationMessage(error.message);
                    return false;
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Success', 'Resource updated successfully', 'success');
            }
        });
    };

    const handleDeleteResource = (resource) => {
        Swal.fire({
            title: 'Delete Resource?',
            text: `Are you sure you want to delete "${resource.name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/resources/${resource.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                        },
                    });

                    if (!response.ok) throw new Error('Failed to delete resource');
                    
                    fetchResources();
                    Swal.fire('Deleted', 'Resource has been deleted', 'success');
                } catch (error) {
                    Swal.fire('Error', error.message, 'error');
                }
            }
        });
    };

    const handleExportReport = () => {
        const csvContent = [
            ['ID', 'Name', 'Category', 'Quantity', 'Available', 'Status', 'Condition', 'Location', 'Last Updated'],
            ...filteredResources.map((r) => [
                r.id,
                r.name,
                r.category,
                r.quantity,
                r.available,
                r.status,
                r.condition,
                r.location,
                r.lastUpdated,
            ]),
        ]
            .map((row) => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resource-inventory-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleAssignToEvent = (resource) => {
        if (events.length === 0) {
            Swal.fire('No Events', 'No simulation events available for assignment', 'info');
            return;
        }

        Swal.fire({
            title: 'Assign Resource to Event',
            html: `
                <form id="assignResourceForm" class="text-left space-y-4">
                    <select id="eventId" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        <option value="">Select Simulation Event</option>
                        ${events.map((event) => `<option value="${event.id}">${event.title} - ${event.event_date}</option>`).join('')}
                    </select>
                    <input type="number" id="quantity" placeholder="Quantity to assign" value="1" class="w-full px-3 py-2 border border-slate-300 rounded-md" required min="1" max="${resource.available}">
                    <select id="handlerId" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                        <option value="">Select Resource Handler</option>
                        <option value="1">Handler 1</option>
                        <option value="2">Handler 2</option>
                        <option value="3">Handler 3</option>
                    </select>
                </form>
            `,
            showCancelButton: true,
            confirmButtonText: 'Assign Resource',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10b981',
            preConfirm: async () => {
                const eventId = document.getElementById('eventId').value;
                const quantity = parseInt(document.getElementById('quantity').value);
                const handlerId = document.getElementById('handlerId').value;

                if (!eventId || !handlerId || quantity < 1) {
                    Swal.showValidationMessage('Please fill in all fields');
                    return false;
                }

                try {
                    const response = await fetch(`/resources/${resource.id}/assign-to-event`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                        },
                        body: JSON.stringify({
                            event_id: eventId,
                            handler_id: handlerId,
                            quantity,
                        }),
                    });

                    if (!response.ok) throw new Error('Failed to assign resource');
                    
                    fetchResources();
                    Swal.fire('Success', 'Resource assigned to event', 'success');
                } catch (error) {
                    Swal.showValidationMessage(error.message);
                    return false;
                }
            },
        });
    };

    const stats = {
        total: resources.length,
        available: resources.filter((r) => r.status === 'Available').length,
        inUse: resources.filter((r) => r.status === 'In Use').length,
        needsRepair: resources.filter((r) => r.condition === 'Needs Repair').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Resource & Equipment Inventory</h1>
                    <p className="text-slate-600 mt-1">Manage all materials, equipment, and tools for disaster training and simulation events</p>
                </div>
                <button
                    onClick={handleAddResource}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Add New Resource
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={Package} label="Total Resources" value={stats.total} color="bg-blue-50 text-blue-700" />
                <StatCard icon={CheckCircle} label="Available" value={stats.available} color="bg-emerald-50 text-emerald-700" />
                <StatCard icon={Clock} label="In Use" value={stats.inUse} color="bg-indigo-50 text-indigo-700" />
                <StatCard icon={AlertTriangle} label="Needs Repair" value={stats.needsRepair} color="bg-yellow-50 text-yellow-700" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                {['dashboard', 'resources', 'maintenance', 'reports'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium transition-colors ${
                            activeTab === tab
                                ? 'text-emerald-600 border-b-2 border-emerald-600'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Search & Filters */}
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by resource name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {searchSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                        {searchSuggestions.map((res) => (
                                            <button
                                                key={res.id}
                                                type="button"
                                                onClick={() => setSearchQuery(res.name)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50"
                                            >
                                                <div className="font-medium text-slate-900">{res.name}</div>
                                                <div className="text-xs text-slate-500">{res.serialNumber || res.serial_number || 'No ID'} • {res.category}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2 font-medium">
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <select
                                value={resourceTypeFilter}
                                onChange={(e) => setResourceTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Resource Types</option>
                                {resourceTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Status</option>
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={conditionFilter}
                                onChange={(e) => setConditionFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="all">All Conditions</option>
                                {conditionOptions.map((condition) => (
                                    <option key={condition} value={condition}>
                                        {condition}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Resources Table */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Resource</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Category</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Quantity</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Condition</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Location</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Last Updated</th>
                                        <th className="px-6 py-3 text-left font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredResources.length > 0 ? (
                                        filteredResources.map((resource) => (
                                            <tr key={resource.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{resource.name}</div>
                                                        <div className="text-xs text-slate-500">{resource.serialNumber}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                                                        {resource.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {resource.available}/{resource.quantity}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(resource.status)}`}>
                                                        {getStatusIcon(resource.status)}
                                                        {resource.status}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getConditionColor(resource.condition)}`}>
                                                        {resource.condition}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{resource.location}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{resource.lastUpdated}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {(resource.status === 'Available' || resource.status === 'Partially Assigned') && resource.available > 0 && (
                                                            <button
                                                                onClick={() => handleAssignToEvent(resource)}
                                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                                                title="Assign to Event"
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                fetchResourceHistory(resource.id);
                                                                Swal.fire({
                                                                    title: `${resource.name} - Usage History`,
                                                                    html: `<div id="historyContent" class="text-left max-h-96 overflow-y-auto"></div>`,
                                                                    width: 600,
                                                                    didOpen: () => {
                                                                        if (selectedResourceHistory?.history) {
                                                                            const historyHtml = selectedResourceHistory.history.map(log => `
                                                                                <div class="p-2 border-l-4 border-slate-300 mb-2">
                                                                                    <p class="text-sm font-medium text-slate-900">${log.action}</p>
                                                                                    <p class="text-xs text-slate-600">${log.notes || 'No notes'}</p>
                                                                                    <p class="text-xs text-slate-500">${new Date(log.created_at).toLocaleString()}</p>
                                                                                </div>
                                                                            `).join('');
                                                                            document.getElementById('historyContent').innerHTML = historyHtml;
                                                                        }
                                                                    },
                                                                    showConfirmButton: false,
                                                                    showCancelButton: true,
                                                                    cancelButtonText: 'Close',
                                                                });
                                                            }}
                                                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                                            title="View History"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditResource(resource)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteResource(resource)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                                                No resources found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'resources' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Resource Assignment & Usage Tracking</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 mb-3">Assignment Workflow</h3>
                                    <ol className="space-y-2 text-sm text-blue-800">
                                        <li>✓ Select a resource from inventory</li>
                                        <li>✓ Click "Assign to Event"</li>
                                        <li>✓ Choose simulation event</li>
                                        <li>✓ Specify quantity needed</li>
                                        <li>✓ Assign resource handler</li>
                                        <li>✓ Status changes: Available → Reserved</li>
                                    </ol>
                                </div>

                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <h3 className="font-semibold text-emerald-900 mb-3">During Event</h3>
                                    <ol className="space-y-2 text-sm text-emerald-800">
                                        <li>✓ Resources marked as "In Use"</li>
                                        <li>✓ Track deployed vs unused items</li>
                                        <li>✓ Flag damaged/missing resources</li>
                                        <li>✓ Log deployment notes</li>
                                        <li>✓ Update condition status</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
                                <h3 className="font-semibold text-slate-900 mb-3">Currently Assigned Resources</h3>
                                {resources.filter(r => r.status === 'Reserved' || r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned').length > 0 ? (
                                    <div className="space-y-2">
                                        {resources
                                            .filter(r => r.status === 'Reserved' || r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned')
                                            .map(r => (
                                                <div key={r.id} className="p-2 bg-white rounded border border-slate-200 text-sm flex justify-between items-center">
                                                    <div>
                                                        <strong>{r.name}</strong>
                                                        <div className="text-xs text-slate-600">{r.category}</div>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(r.status)}`}>
                                                        {r.status}
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No resources currently assigned to events</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Post-Event Resource Return</h2>
                        <div className="space-y-3">
                            {resources.filter(r => r.status === 'In Use' || r.status === 'Reserved' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned').length > 0 ? (
                                resources
                                    .filter(r => r.status === 'In Use' || r.status === 'Reserved' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned')
                                    .map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                                            <div>
                                                <p className="font-medium text-slate-900">{r.name}</p>
                                                <p className="text-xs text-slate-600">{r.serial_number}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: 'Return Resource from Event',
                                                        html: `
                                                            <form class="text-left space-y-3">
                                                                <label class="block">
                                                                    <span class="text-sm font-medium text-slate-700">Condition after use:</span>
                                                                    <select id="newCondition" class="w-full px-3 py-2 border border-slate-300 rounded-md mt-1">
                                                                        <option value="Good">Good - No issues</option>
                                                                        <option value="Needs Repair">Needs Repair - Minor damage</option>
                                                                        <option value="Damaged">Damaged - Major damage</option>
                                                                    </select>
                                                                </label>
                                                                <label class="block">
                                                                    <span class="text-sm font-medium text-slate-700">Remarks:</span>
                                                                    <textarea id="remarks" placeholder="Enter any damage or usage notes..." class="w-full px-3 py-2 border border-slate-300 rounded-md mt-1" rows="3"></textarea>
                                                                </label>
                                                            </form>
                                                        `,
                                                        showCancelButton: true,
                                                        confirmButtonText: 'Return Resource',
                                                        cancelButtonText: 'Cancel',
                                                        confirmButtonColor: '#10b981',
                                                        preConfirm: async () => {
                                                            const newCondition = document.getElementById('newCondition').value;
                                                            const remarks = document.getElementById('remarks').value;
                                                            
                                                            try {
                                                                const response = await fetch(`/resources/${r.id}/return-from-event`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                                                                    },
                                                                    body: JSON.stringify({
                                                                        condition: newCondition,
                                                                        damage_report: remarks,
                                                                    }),
                                                                });

                                                                if (!response.ok) throw new Error('Failed to return resource');
                                                                
                                                                fetchResources();
                                                                Swal.fire('Success', 'Resource returned successfully', 'success');
                                                            } catch (error) {
                                                                Swal.showValidationMessage(error.message);
                                                                return false;
                                                            }
                                                        },
                                                    });
                                                }}
                                                className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4 inline mr-1" /> Return
                                            </button>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-slate-500 text-sm">No resources to return</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Maintenance & Inspection Tracking</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-700">Needs Repair</p>
                                <p className="text-2xl font-bold text-yellow-900">{resources.filter(r => r.condition === 'Needs Repair').length}</p>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">Under Maintenance</p>
                                <p className="text-2xl font-bold text-red-900">{resources.filter(r => r.status === 'Under Maintenance').length}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <p className="text-sm text-emerald-700">Recently Maintained</p>
                                <p className="text-2xl font-bold text-emerald-900">{resources.filter(r => r.last_maintenance_date).length}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-900">Resources Requiring Attention</h3>
                            {resources.filter(r => r.condition === 'Needs Repair' || r.status === 'Damaged').length > 0 ? (
                                <div className="space-y-2">
                                    {resources
                                        .filter(r => r.condition === 'Needs Repair' || r.status === 'Damaged')
                                        .map(r => (
                                            <div key={r.id} className="p-3 bg-slate-50 border border-red-300 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{r.name}</p>
                                                        <p className="text-xs text-slate-600">{r.serial_number || 'No serial'}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getConditionColor(r.condition)}`}>
                                                        {r.condition}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            Swal.fire({
                                                                title: 'Schedule Maintenance',
                                                                html: `
                                                                    <form class="text-left space-y-3">
                                                                        <textarea id="notes" placeholder="Maintenance notes..." class="w-full px-3 py-2 border border-slate-300 rounded-md" rows="3"></textarea>
                                                                        <input type="text" id="technician" placeholder="Technician name (optional)" class="w-full px-3 py-2 border border-slate-300 rounded-md">
                                                                    </form>
                                                                `,
                                                                showCancelButton: true,
                                                                confirmButtonText: 'Schedule',
                                                                confirmButtonColor: '#f59e0b',
                                                                preConfirm: async () => {
                                                                    const notes = document.getElementById('notes').value;
                                                                    const technician = document.getElementById('technician').value;

                                                                    if (!notes) {
                                                                        Swal.showValidationMessage('Please add maintenance notes');
                                                                        return false;
                                                                    }

                                                                    try {
                                                                        const response = await fetch(`/resources/${r.id}/schedule-maintenance`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                                'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                                                                            },
                                                                            body: JSON.stringify({
                                                                                notes,
                                                                                technician: technician || null,
                                                                            }),
                                                                        });

                                                                        if (!response.ok) throw new Error('Failed to schedule');
                                                                        
                                                                        fetchResources();
                                                                        Swal.fire('Success', 'Maintenance scheduled', 'success');
                                                                    } catch (error) {
                                                                        Swal.showValidationMessage(error.message);
                                                                        return false;
                                                                    }
                                                                },
                                                            });
                                                        }}
                                                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                                    >
                                                        Schedule Maintenance
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">No resources requiring maintenance</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Resource Reports & Analytics</h2>
                                <p className="text-slate-600 mt-1">Export and view detailed resource usage statistics</p>
                            </div>
                            <button
                                onClick={handleExportReport}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Download className="w-5 h-5" />
                                Export to CSV
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Inventory Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Total Items:</span>
                                    <span className="font-medium text-slate-900">{resources.reduce((sum, r) => sum + r.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Unique Resources:</span>
                                    <span className="font-medium text-slate-900">{stats.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Damaged Items:</span>
                                    <span className="font-medium text-red-600">{resources.filter((r) => r.condition === 'Damaged').length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Under Maintenance:</span>
                                    <span className="font-medium text-yellow-600">{resources.filter((r) => r.status === 'Under Maintenance').length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Resource Distribution by Category</h3>
                            <div className="space-y-3 text-sm">
                                {resourceTypes.map((type) => {
                                    const count = resources.filter((r) => r.category === type).length;
                                    return (
                                        count > 0 && (
                                            <div key={type} className="flex justify-between items-center">
                                                <span className="text-slate-600">{type}:</span>
                                                <span className="font-medium text-slate-900">{count} items</span>
                                            </div>
                                        )
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Alerts */}
            {stats.needsRepair > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-yellow-900">Attention Required</h3>
                        <p className="text-sm text-yellow-800 mt-1">{stats.needsRepair} resource(s) need repair or maintenance</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className={`${color} rounded-lg p-6 border border-slate-200`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-75">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <Icon className="w-10 h-10 opacity-30" />
            </div>
        </div>
    );
}

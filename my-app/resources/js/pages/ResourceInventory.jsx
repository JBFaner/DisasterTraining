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
    ChevronLeft,
    ChevronRight,
    Box,
} from 'lucide-react';
import Swal from 'sweetalert2';

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) {
    const maxVisiblePages = typeof window !== 'undefined' && window.innerWidth >= 768 ? 7 : 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Always show pagination when there are items, even if only one page
    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-2 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 drop-shadow-sm" />
                </button>
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="text-slate-400">...</span>}
                    </>
                )}
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                            page === currentPage
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {page}
                    </button>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-2 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4 drop-shadow-sm" />
                </button>
            </div>
            )}
        </div>
    );
}

export function ResourceInventory() {
    const [activeTab, setActiveTab] = useState('resources');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [resourceTypeFilter, setResourceTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [conditionFilter, setConditionFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Fixed to 10 items per page
    const filterRef = React.useRef(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [completedEventsWithResources, setCompletedEventsWithResources] = useState([]);
    const [selectedResourceHistory, setSelectedResourceHistory] = useState(null);
    const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
    const [reportConditionFilter, setReportConditionFilter] = useState('all');
    const [reportLocationFilter, setReportLocationFilter] = useState('all');

    const resourceTypes = ['PPE', 'Fire Equipment', 'Medical', 'Communication', 'Vehicles', 'Tools', 'Other'];
    const statusOptions = ['Available', 'In Use', 'Under Maintenance', 'Damaged', 'Missing', 'Reserved'];
    const conditionOptions = ['New', 'Good', 'Needs Repair', 'Damaged'];

    // Fetch resources from API on component mount
    useEffect(() => {
        fetchResources();
        fetchEvents();
        fetchCompletedEventsWithResources();
    }, []);


    // Close filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

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

    const fetchCompletedEventsWithResources = async () => {
        try {
            const response = await fetch('/api/simulation-events/completed-with-resources');
            if (response.ok) {
                const data = await response.json();
                setCompletedEventsWithResources(data.events || []);
            }
        } catch (error) {
            console.error('Error fetching completed events with resources:', error);
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

    /** Semantic pill badges for status (green/blue/orange/purple) with hover glow */
    const getStatusBadgeClass = (status) => {
        const base = 'transition-all duration-200 hover:shadow-[0_0_8px_currentColor]';
        switch (status) {
            case 'Available':
                return 'bg-emerald-100 text-emerald-800 ' + base;
            case 'In Use':
            case 'Fully Assigned':
                return 'bg-blue-100 text-blue-800 ' + base;
            case 'Needs Repair':
            case 'Under Maintenance':
            case 'Damaged':
            case 'Missing':
                return 'bg-amber-100 text-amber-800 ' + base;
            case 'Partially Assigned':
            case 'Reserved':
                return 'bg-violet-100 text-violet-800 ' + base;
            default:
                return 'bg-slate-100 text-slate-700 ' + base;
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
        
        // Handle special 'in_use_all' filter for all assigned statuses
        let matchesStatus = statusFilter === 'all' || resource.status === statusFilter;
        if (statusFilter === 'in_use_all') {
            matchesStatus = resource.status === 'In Use' || resource.status === 'Partially Assigned' || resource.status === 'Fully Assigned';
        }
        
        const matchesCondition = conditionFilter === 'all' || resource.condition === conditionFilter;

        return matchesSearch && matchesType && matchesStatus && matchesCondition;
    });

    // Pagination
    const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResources = filteredResources.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, resourceTypeFilter, statusFilter, conditionFilter]);

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
            title: '<div style="font-size: 24px; font-weight: 600; color: #0f172a;">Add New Resource</div>',
            html: `
                <div style="padding: 0;">
                    <form id="addResourceForm" class="text-left" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px;">
                        <!-- Left Column: Core Info -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <h3 style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Basic Information</h3>
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Resource Name <span style="color: #ef4444;">*</span></label>
                                        <input type="text" id="resourceName" placeholder="e.g., Fire Hat" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Category <span style="color: #ef4444;">*</span></label>
                                        <select id="resourceCategory" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required>
                                            <option value="">Select Category</option>
                                            ${resourceTypes.map((type) => `<option value="${type}">${type}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Quantity <span style="color: #ef4444;">*</span></label>
                                        <input type="number" id="resourceQuantity" placeholder="e.g., 15" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required min="1">
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Serial Number</label>
                                        <input type="text" id="serialNumber" placeholder="Optional" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Operational Info + Preview -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div>
                                <h3 style="font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Inventory Details</h3>
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Condition <span style="color: #ef4444;">*</span></label>
                                        <select id="resourceCondition" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required onchange="if(window.updatePreview) window.updatePreview()">
                                            <option value="">Select Condition</option>
                                            ${conditionOptions.map((cond) => `<option value="${cond}">${cond}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Storage Location <span style="color: #ef4444;">*</span></label>
                                        <input type="text" id="location" placeholder="e.g., Warehouse A, Shelf 3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" required>
                                    </div>
                                    <div>
                                        <label style="display: block; font-size: 12px; font-weight: 500; color: #475569; margin-bottom: 6px;">Description</label>
                                        <textarea id="description" placeholder="Optional notes..." class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Status Preview -->
                            <div style="background: linear-gradient(to bottom, #f8fafc, #ffffff); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 8px;">
                                <h3 style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Inventory Status Preview</h3>
                                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #64748b;">Condition:</span>
                                        <span id="previewCondition" style="font-weight: 600; color: #0f172a;">—</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #64748b;">Stock:</span>
                                        <span id="previewStock" style="font-weight: 600; color: #0f172a;">0</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: #64748b;">Initial Status:</span>
                                        <span id="previewStatus" style="font-weight: 600; color: #10b981;">—</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <script>
                    window.updatePreview = function() {
                        const condition = document.getElementById('resourceCondition')?.value || '';
                        const quantity = parseInt(document.getElementById('resourceQuantity')?.value || '0');
                        const previewCondition = document.getElementById('previewCondition');
                        const previewStock = document.getElementById('previewStock');
                        const previewStatus = document.getElementById('previewStatus');
                        
                        if (previewCondition) previewCondition.textContent = condition || '—';
                        if (previewStock) previewStock.textContent = quantity || '0';
                        if (previewStatus) previewStatus.textContent = quantity > 0 ? 'Available' : '—';
                    };
                    setTimeout(function() {
                        const qtyInput = document.getElementById('resourceQuantity');
                        const condSelect = document.getElementById('resourceCondition');
                        if (qtyInput) qtyInput.addEventListener('input', window.updatePreview);
                        if (condSelect) condSelect.addEventListener('change', window.updatePreview);
                    }, 100);
                </script>
            `,
            width: '720px',
            padding: '32px',
            customClass: {
                popup: 'rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.15)]',
                htmlContainer: 'text-left',
            },
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
                const description = document.getElementById('description').value;

                if (!name || !category || !quantity || !condition || !location) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                try {
                    const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
                    if (!csrfToken) {
                        Swal.showValidationMessage('Session expired or invalid. Please refresh the page and try again.');
                        return false;
                    }
                    const response = await fetch('/resources', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            _token: csrfToken,
                            name,
                            category,
                            quantity: parseInt(quantity),
                            serial_number: serialNumber,
                            condition,
                            location,
                            description: description || null,
                            image_url: null,
                        }),
                    });

                    const data = await response.json().catch(() => ({}));
                    
                    if (!response.ok) {
                        if (response.status === 419) {
                            Swal.showValidationMessage('Session expired or CSRF token invalid. Please refresh the page and try again.');
                            return false;
                        }
                        // Handle duplication error
                        if (data.message && (data.message.includes('already exists') || data.message.includes('duplicate'))) {
                            let errorMsg = data.message;
                            if (data.duplicate) {
                                errorMsg += `\n\nExisting Resource:\n- Name: ${data.duplicate.name}\n- Category: ${data.duplicate.category}`;
                                if (data.duplicate.serial_number) {
                                    errorMsg += `\n- Serial: ${data.duplicate.serial_number}`;
                                }
                            }
                            Swal.showValidationMessage(errorMsg);
                            return false;
                        }
                        throw new Error(data.message || 'Failed to add resource');
                    }
                    
                    fetchResources();
                    Swal.fire('Success', 'Resource added successfully', 'success');
                } catch (error) {
                    Swal.showValidationMessage(error.message || 'An error occurred while adding the resource');
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

    const handleViewResource = (resource) => {
        // Fetch full resource details including assignments
        fetch(`/api/resources/${resource.id}/history`)
            .then(res => res.json())
            .then(data => {
                const resourceData = data.resource || resource;
                const history = data.history || [];
                const assignments = resourceData.eventAssignments || [];
                
                Swal.fire({
                    title: resourceData.name,
                    html: `
                        <div class="text-left space-y-4 max-h-[70vh] overflow-y-auto">
                            ${resourceData.image_url ? `
                                <div class="mb-4">
                                    <img src="${resourceData.image_url}" alt="${resourceData.name}" class="w-full h-48 object-cover rounded-lg border border-slate-200">
                                </div>
                            ` : ''}
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Resource ID</p>
                                    <p class="text-sm font-medium text-slate-900">#${resourceData.id}</p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Category</p>
                                    <p class="text-sm font-medium text-slate-900">${resourceData.category}</p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Quantity</p>
                                    <p class="text-sm font-medium text-slate-900">${resourceData.quantity} units</p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Available</p>
                                    <p class="text-sm font-medium text-slate-900">${resourceData.available || resourceData.quantity} units</p>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Status</p>
                                    <span class="inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(resourceData.status).split(' ').join(' ')}">
                                        ${resourceData.status}
                                    </span>
                                </div>
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Condition</p>
                                    <span class="inline-block px-2 py-1 text-xs font-medium rounded ${getConditionColor(resourceData.condition).split(' ').join(' ')}">
                                        ${resourceData.condition}
                                    </span>
                                </div>
                                ${resourceData.serial_number ? `
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Serial Number</p>
                                    <p class="text-sm font-medium text-slate-900">${resourceData.serial_number}</p>
                                </div>
                                ` : ''}
                                <div>
                                    <p class="text-xs font-semibold text-slate-500 uppercase">Location</p>
                                    <p class="text-sm font-medium text-slate-900">${resourceData.location}</p>
                                </div>
                            </div>
                            ${resourceData.description ? `
                            <div>
                                <p class="text-xs font-semibold text-slate-500 uppercase mb-1">Description</p>
                                <p class="text-sm text-slate-700">${resourceData.description}</p>
                            </div>
                            ` : ''}
                            ${assignments.length > 0 ? `
                            <div>
                                <p class="text-xs font-semibold text-slate-500 uppercase mb-2">Assigned to Events</p>
                                <div class="space-y-2">
                                    ${assignments.map(a => `
                                        <div class="p-2 bg-slate-50 rounded border border-slate-200">
                                            <p class="text-sm font-medium text-slate-900">Event ID: ${a.event_id}</p>
                                            <p class="text-xs text-slate-600">Quantity: ${a.quantity_assigned} | Status: ${a.status}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                            ${history.length > 0 ? `
                            <div>
                                <p class="text-xs font-semibold text-slate-500 uppercase mb-2">Maintenance History</p>
                                <div class="space-y-2 max-h-48 overflow-y-auto">
                                    ${history.slice(0, 5).map(log => `
                                        <div class="p-2 border-l-4 border-slate-300 bg-slate-50 rounded">
                                            <p class="text-sm font-medium text-slate-900">${log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                            <p class="text-xs text-slate-600">${log.notes || 'No notes'}</p>
                                            <p class="text-xs text-slate-500 mt-1">${new Date(log.created_at).toLocaleString()}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `,
                    width: 700,
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: 'Close',
                    customClass: {
                        popup: 'text-left',
                    },
                });
            })
            .catch(error => {
                console.error('Error fetching resource details:', error);
                Swal.fire('Error', 'Failed to load resource details', 'error');
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
                            'Accept': 'application/json',
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

        // Check if resource is already assigned to an event
        const activeAssignments = resource.eventAssignments?.filter(a => a.status === 'Active') || [];
        if (activeAssignments.length > 0) {
            Swal.fire({
                title: 'Resource Already Assigned',
                html: `
                    <p class="text-left mb-3">This resource is currently assigned to:</p>
                    <ul class="text-left list-disc list-inside mb-3">
                        ${activeAssignments.map(a => `<li>Event ID: ${a.event_id} (Quantity: ${a.quantity_assigned})</li>`).join('')}
                    </ul>
                    <p class="text-left text-sm text-slate-600">Please return the resource from existing assignments before assigning to a new event.</p>
                `,
                icon: 'warning',
                confirmButtonText: 'OK',
            });
            return;
        }

        const availableQty = resource.available || resource.quantity;
        const today = new Date().toISOString().split('T')[0];

        Swal.fire({
            title: 'Assign Resource to Event',
            html: `
                <form id="assignResourceForm" class="text-left space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Simulation Event <span class="text-rose-500">*</span></label>
                        <select id="eventId" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                            <option value="">Select Simulation Event</option>
                            ${events.map((event) => `<option value="${event.id}">${event.title} - ${new Date(event.event_date).toLocaleDateString()}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Quantity to Assign <span class="text-rose-500">*</span></label>
                        <input type="number" id="quantity" placeholder="Quantity to assign" value="1" class="w-full px-3 py-2 border border-slate-300 rounded-md" required min="1" max="${availableQty}">
                        <p class="text-xs text-slate-500 mt-1">Available: ${availableQty} units</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Responsible Staff <span class="text-rose-500">*</span></label>
                        <select id="handlerId" class="w-full px-3 py-2 border border-slate-300 rounded-md" required>
                            <option value="">Select Resource Handler</option>
                            <option value="1">Staff Member 1</option>
                            <option value="2">Staff Member 2</option>
                            <option value="3">Staff Member 3</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Assignment Date</label>
                        <input type="date" id="assignmentDate" value="${today}" class="w-full px-3 py-2 border border-slate-300 rounded-md">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Expected Return Date</label>
                        <input type="date" id="expectedReturnDate" class="w-full px-3 py-2 border border-slate-300 rounded-md">
                    </div>
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
                const assignmentDate = document.getElementById('assignmentDate').value;
                const expectedReturnDate = document.getElementById('expectedReturnDate').value;

                if (!eventId || !handlerId || quantity < 1) {
                    Swal.showValidationMessage('Please fill in all required fields');
                    return false;
                }

                if (quantity > availableQty) {
                    Swal.showValidationMessage(`Cannot assign ${quantity} units. Only ${availableQty} available.`);
                    return false;
                }

                try {
                    const response = await fetch(`/resources/${resource.id}/assign-to-event`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]')?.content,
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            event_id: eventId,
                            handler_id: handlerId,
                            quantity,
                            assignment_date: assignmentDate || null,
                            expected_return_date: expectedReturnDate || null,
                        }),
                    });

                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to assign resource');
                    }
                    
                    fetchResources();
                    Swal.fire('Success', 'Resource assigned to event successfully. Status changed to "In Use".', 'success');
                } catch (error) {
                    Swal.showValidationMessage(error.message || 'An error occurred while assigning the resource');
                    return false;
                }
            },
        });
    };

    const stats = {
        total: resources.length,
        available: resources.filter((r) => r.status === 'Available').length,
        inUse: resources.filter((r) => r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned').length,
        needsRepair: resources.filter((r) => r.condition === 'Needs Repair').length,
    };
    const availablePct = stats.total ? Math.round((stats.available / stats.total) * 100) : 0;
    const inUseResourcesList = resources.filter(r => r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned');
    const inUseEventsCount = inUseResourcesList.length ? new Set(inUseResourcesList.flatMap(r => (r.eventAssignments || []).map(a => a.event_id))).size : 0;

    const TABS = [
        { id: 'resources', label: 'Resources' },
        { id: 'usage_tracking', label: 'Usage Tracking' },
        { id: 'maintenance', label: 'Maintenance' },
        { id: 'reports', label: 'Reports' },
    ];

    return (
        <div className="space-y-6 training-module-card-enter">
            {/* Hero Header - Certification style */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200/80 shadow-xl p-8 md:p-10 transition-all duration-250">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 rounded-xl shadow-md">
                                <Box className="w-9 h-9 text-emerald-600" />
                            </div>
                            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight">Resource & Equipment Inventory</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                            Manage materials, equipment, and tools for disaster training.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={handleExportReport}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-xl font-medium hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.15)] transition-all duration-250"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={handleAddResource}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all duration-250"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Resource
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards - Certification style (premium KPI cards) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div
                    className={`bg-white rounded-xl border shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 cursor-pointer ${statusFilter === 'all' && resourceTypeFilter === 'all' && conditionFilter === 'all' ? 'border-slate-300 ring-2 ring-emerald-500/30' : 'border-slate-200'}`}
                    onClick={() => { setStatusFilter('all'); setResourceTypeFilter('all'); setConditionFilter('all'); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatusFilter('all'); setResourceTypeFilter('all'); setConditionFilter('all'); } }}
                >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Resources</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{stats.total}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.total === 0 ? 'No items' : `${stats.total} item${stats.total !== 1 ? 's' : ''}`}</p>
                </div>
                <div
                    className={`bg-white rounded-xl border shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 cursor-pointer ${statusFilter === 'Available' ? 'border-emerald-300 ring-2 ring-emerald-500/30' : 'border-emerald-200'}`}
                    onClick={() => setStatusFilter('Available')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatusFilter('Available'); } }}
                >
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Available</p>
                    <p className="text-[32px] font-bold text-emerald-800 mt-1">{stats.available}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.total ? `${availablePct}%` : '0%'}</p>
                </div>
                <div
                    className={`bg-white rounded-xl border shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 cursor-pointer ${statusFilter === 'in_use_all' ? 'border-blue-300 ring-2 ring-emerald-500/30' : 'border-slate-200'}`}
                    onClick={() => setStatusFilter('in_use_all')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStatusFilter('in_use_all'); } }}
                >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">In Use</p>
                    <p className="text-[32px] font-bold text-slate-900 mt-1">{stats.inUse}</p>
                    <p className="text-xs text-slate-500 mt-1">{inUseEventsCount ? `Active in ${inUseEventsCount} event${inUseEventsCount !== 1 ? 's' : ''}` : 'None deployed'}</p>
                </div>
                <div
                    className={`bg-white rounded-xl border shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-250 cursor-pointer ${conditionFilter === 'Needs Repair' ? 'border-amber-300 ring-2 ring-emerald-500/30' : 'border-slate-200'}`}
                    onClick={() => setConditionFilter('Needs Repair')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setConditionFilter('Needs Repair'); } }}
                >
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Needs Repair</p>
                    <p className="text-[32px] font-bold text-amber-800 mt-1">{stats.needsRepair}</p>
                    <p className="text-xs text-slate-500 mt-1">{stats.needsRepair === 0 ? 'No issues' : 'Need attention'}</p>
                </div>
            </div>

            {/* Tabs - Certification style (green active pill) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2.5 w-fit">
                <div className="flex gap-1 flex-wrap">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'resources' && (
                <div className="space-y-6">
                    {/* Search bar - Evaluations style (icon, input, dropdown, Filter button) */}
                    <div className="rounded-xl bg-white border border-slate-200 shadow-md p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 drop-shadow-sm" />
                                <input
                                    type="text"
                                    placeholder="Search by resource name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                                />
                                {searchSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
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
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    {statusOptions.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.3)] text-white rounded-lg shadow-sm font-medium text-sm transition-all duration-200"
                                >
                                    <Filter className="w-4 h-4" />
                                    Filter
                                </button>
                            </div>
                        </div>
                        <div className="relative mt-2" ref={filterRef}>
                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-10">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                Resource Type
                                            </label>
                                            <select
                                                value={resourceTypeFilter}
                                                onChange={(e) => setResourceTypeFilter(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="all">All Resource Types</option>
                                                {resourceTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="all">All Status</option>
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                Condition
                                            </label>
                                            <select
                                                value={conditionFilter}
                                                onChange={(e) => setConditionFilter(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="all">All Conditions</option>
                                                {conditionOptions.map((condition) => (
                                                    <option key={condition} value={condition}>
                                                        {condition}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setResourceTypeFilter('all');
                                                setStatusFilter('all');
                                                setConditionFilter('all');
                                            }}
                                            className="w-full text-xs text-slate-600 hover:text-slate-800 underline"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resources Table - Soft rows (card list) */}
                    <div className="space-y-3">
                        {filteredResources.length > 0 ? (
                            <>
                                {paginatedResources.map((resource) => (
                                    <div
                                        key={resource.id}
                                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-250 ease-out overflow-hidden"
                                    >
                                        <div className="flex flex-wrap items-center gap-4 px-6 py-4 text-sm">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-slate-900">{resource.name}</div>
                                                <div className="text-xs text-slate-500">{resource.serialNumber || resource.serial_number || '—'}</div>
                                            </div>
                                            <div>
                                                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                                                    {resource.category}
                                                </span>
                                            </div>
                                            <div className="text-slate-900 font-medium">
                                                {resource.available ?? resource.quantity}/{resource.quantity}
                                            </div>
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(resource.status)}`}>
                                                    {getStatusIcon(resource.status)}
                                                    {resource.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getConditionColor(resource.condition)}`}>
                                                    {resource.condition}
                                                </span>
                                            </div>
                                            <div className="text-slate-700 truncate max-w-[120px]">{resource.location}</div>
                                            <div className="text-slate-600 text-xs">{resource.lastUpdated || '—'}</div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(resource.status === 'Available' || resource.status === 'Partially Assigned') && (resource.available ?? resource.quantity) > 0 && (
                                                    <button
                                                        onClick={() => handleAssignToEvent(resource)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.2)] transition-all duration-250"
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
                                                    className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:shadow-sm transition-all duration-250"
                                                    title="View History"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditResource(resource)}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] transition-all duration-250"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteResource(resource)}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all duration-250"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                    totalItems={filteredResources.length}
                                />
                            </>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 px-6 py-12 text-center text-slate-500">
                                No resources found matching your filters.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'usage_tracking' && (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stepper UI - Assignment Workflow */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900 mb-5">Resource Assignment & Usage Tracking</h2>
                            <div className="relative">
                                <div className="flex flex-col gap-0">
                                    {[
                                        { step: 1, title: 'Select Resource', desc: 'Choose from inventory' },
                                        { step: 2, title: 'Assign to Event', desc: 'Pick simulation event' },
                                        { step: 3, title: 'Set Quantity', desc: 'Specify units needed' },
                                        { step: 4, title: 'Assign Handler', desc: 'Responsible staff' },
                                        { step: 5, title: 'Confirm', desc: 'Status → Reserved / In Use' },
                                    ].map((item, idx) => (
                                        <div key={item.step} className="flex gap-4 items-start transition-all duration-250 ease-out">
                                            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-250 ${
                                                idx === 0 ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-500'
                                            }`}>
                                                {item.step}
                                            </div>
                                            <div className="pb-6">
                                                <p className="font-medium text-slate-900">{item.title}</p>
                                                <p className="text-sm text-slate-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Currently Assigned Resources */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-3">Currently Assigned Resources</h3>
                            {resources.filter(r => r.status === 'Reserved' || r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned').length > 0 ? (
                                <div className="space-y-2">
                                    {resources
                                        .filter(r => r.status === 'Reserved' || r.status === 'In Use' || r.status === 'Partially Assigned' || r.status === 'Fully Assigned')
                                        .map(r => (
                                            <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm flex justify-between items-center hover:bg-slate-100/80 transition-colors duration-200">
                                                <div>
                                                    <strong className="text-slate-900">{r.name}</strong>
                                                    <div className="text-xs text-slate-600">{r.category}</div>
                                                </div>
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(r.status)}`}>
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

                    {/* Right sidebar: Live Monitoring + Active Deployments */}
                    <div className="space-y-4">
                        {/* Live Monitoring Card - During Event */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-500 mb-4 text-sm uppercase tracking-wide">During Event</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Resources Active</span>
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" /> {stats.inUse}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Pending Return</span>
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" /> {completedEventsWithResources.reduce((sum, e) => sum + (e.resources?.length || 0), 0)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Reported Issues</span>
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-red-700">
                                        <span className="w-2 h-2 rounded-full bg-red-500" /> {stats.needsRepair}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Deployments */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-3">Active Deployments</h3>
                            {stats.inUse > 0 ? (
                                <div className="space-y-3 text-sm">
                                    {events.filter(ev => !ev.completed_at).slice(0, 3).map(ev => (
                                        <div key={ev.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                            <p className="font-medium text-slate-900 truncate">{ev.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Resources: {resources.filter(r => (r.eventAssignments || []).some(a => a.event_id === ev.id)).length || '—'}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>
                                        </div>
                                    ))}
                                    {events.filter(ev => !ev.completed_at).length === 0 && (
                                        <p className="text-slate-500 text-sm">{stats.inUse} resource(s) in use</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">No active deployments</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Post-Event Resource Return - full width */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Post-Event Resource Return</h2>
                    <p className="text-sm text-slate-600 mb-4">
                            Resources from completed simulation events that need to be returned to inventory.
                        </p>
                        <div className="space-y-4">
                            {completedEventsWithResources.length > 0 ? (
                                completedEventsWithResources.map(event => (
                                    <div key={event.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                        <div className="bg-indigo-50 px-4 py-3 border-b border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-indigo-900">{event.title}</h3>
                                                    <p className="text-xs text-indigo-700">
                                                        Event Date: {new Date(event.event_date).toLocaleDateString()}
                                                        {event.completed_at && ` • Completed: ${new Date(event.completed_at).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                                                    {event.resources.length} resource(s)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {event.resources.map((r, idx) => (
                                                <div key={`${event.id}-${r.id}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900">{r.name}</p>
                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                                                Qty: {r.quantity_assigned}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600">{r.category} {r.serial_number && `• ${r.serial_number}`}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            Swal.fire({
                                                                title: 'Return Resource from Event',
                                                                html: `
                                                                    <div class="text-left mb-4">
                                                                        <p class="text-sm text-slate-600">Returning <strong>${r.name}</strong> (${r.quantity_assigned} unit(s)) from <strong>${event.title}</strong></p>
                                                                    </div>
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
                                                                                event_id: event.id,
                                                                                quantity: r.quantity_assigned,
                                                                            }),
                                                                        });

                                                                        if (!response.ok) throw new Error('Failed to return resource');
                                                                        
                                                                        fetchResources();
                                                                        fetchCompletedEventsWithResources();
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
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">No resources to return from completed events</p>
                            )}
                        </div>
                </div>
                </>
            )}

            {activeTab === 'maintenance' && (
                <div className="space-y-6">
                    {/* Maintenance Queue Card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">Maintenance Control Panel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-5 bg-amber-50 border-l-4 border-amber-500 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🛠</span>
                                    <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Needs Repair</p>
                                </div>
                                <p className="text-3xl font-bold text-amber-900">{resources.filter(r => r.condition === 'Needs Repair').length}</p>
                                <p className="text-xs text-amber-600 mt-1">Items</p>
                            </div>
                            <div className="p-5 bg-blue-50 border-l-4 border-blue-500 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">⏳</span>
                                    <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Under Inspection</p>
                                </div>
                                <p className="text-3xl font-bold text-blue-900">{resources.filter(r => r.status === 'Under Maintenance').length}</p>
                                <p className="text-xs text-blue-600 mt-1">In Progress</p>
                            </div>
                            <div className="p-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✅</span>
                                    <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Recently Maintained</p>
                                </div>
                                <p className="text-3xl font-bold text-emerald-900">{resources.filter(r => r.last_maintenance_date).length}</p>
                                <p className="text-xs text-emerald-600 mt-1">Completed</p>
                            </div>
                        </div>

                        {/* Resources Requiring Attention with Timeline */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 text-lg">Maintenance Queue</h3>
                            {resources.filter(r => r.condition === 'Needs Repair' || r.status === 'Damaged' || r.status === 'Under Maintenance').length > 0 ? (
                                <div className="space-y-4">
                                    {resources
                                        .filter(r => r.condition === 'Needs Repair' || r.status === 'Damaged' || r.status === 'Under Maintenance')
                                        .map((r, idx) => {
                                            const conditionLevel = r.condition === 'Damaged' ? 'critical' : r.condition === 'Needs Repair' ? 'warning' : 'good';
                                            const conditionColor = conditionLevel === 'critical' ? 'bg-red-500' : conditionLevel === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
                                            const conditionWidth = conditionLevel === 'critical' ? 'w-full' : conditionLevel === 'warning' ? 'w-2/3' : 'w-1/3';
                                            
                                            return (
                                                <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-200">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-900 mb-1">{r.name}</p>
                                                            <p className="text-xs text-slate-600 mb-2">{r.serial_number || 'No serial'} • {r.category}</p>
                                                            
                                                            {/* Timeline Style Tracking */}
                                                            <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                                                                <span className="font-medium">{r.name}</span>
                                                                <span>→</span>
                                                                <span className={`px-2 py-0.5 rounded-full ${r.condition === 'Needs Repair' || r.status === 'Damaged' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                    {r.status === 'Under Maintenance' ? 'Under Inspection' : r.condition === 'Needs Repair' ? 'Marked for Repair' : 'Damaged'}
                                                                </span>
                                                                <span className="text-slate-400">
                                                                    ({new Date(r.lastUpdated || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getConditionColor(r.condition)}`}>
                                                                {r.condition}
                                                            </span>
                                                            {/* Condition Color Meter */}
                                                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                                <div className={`h-full ${conditionColor} ${conditionWidth} transition-all duration-300`}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => {
                                                                Swal.fire({
                                                                    title: 'Schedule Maintenance',
                                                                    html: `
                                                                        <form class="text-left space-y-3">
                                                                            <textarea id="notes" placeholder="Maintenance notes..." class="w-full px-3 py-2 border border-slate-300 rounded-lg" rows="3"></textarea>
                                                                            <input type="text" id="technician" placeholder="Technician name (optional)" class="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                                                        </form>
                                                                    `,
                                                                    showCancelButton: true,
                                                                    confirmButtonText: 'Schedule',
                                                                    confirmButtonColor: '#f59e0b',
                                                                    customClass: {
                                                                        popup: 'rounded-xl',
                                                                    },
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
                                                            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 hover:shadow-sm transition-all duration-200 font-medium"
                                                        >
                                                            Schedule Maintenance
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-slate-500 text-sm">No resources requiring maintenance</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (() => {
                const categoryDistribution = resourceTypes.map(type => ({
                    name: type,
                    count: resources.filter(r => r.category === type).length,
                })).filter(item => item.count > 0);
                const maxCategoryCount = Math.max(...categoryDistribution.map(c => c.count), 1);
                
                const conditionBreakdown = conditionOptions.map(cond => ({
                    name: cond,
                    count: resources.filter(r => r.condition === cond).length,
                }));
                const maxConditionCount = Math.max(...conditionBreakdown.map(c => c.count), 1);
                
                const locations = [...new Set(resources.map(r => r.location).filter(Boolean))];
                const filteredForReports = resources.filter(r => {
                    const matchCategory = reportCategoryFilter === 'all' || r.category === reportCategoryFilter;
                    const matchCondition = reportConditionFilter === 'all' || r.condition === reportConditionFilter;
                    const matchLocation = reportLocationFilter === 'all' || r.location === reportLocationFilter;
                    return matchCategory && matchCondition && matchLocation;
                });
                
                // Quick Insights - Enhanced
                const resourcesWithAssignments = resources.filter(r => (r.eventAssignments || []).length > 0);
                const mostUsedResource = resourcesWithAssignments.reduce((max, r) => {
                    const assignments = (r.eventAssignments || []).length;
                    return assignments > (max.eventAssignments?.length || 0) ? r : max;
                }, resourcesWithAssignments[0] || {});
                const mostUsedCount = mostUsedResource?.eventAssignments?.length || 0;
                
                const unusedResources = resources.filter(r => {
                    const lastUsed = r.lastUpdated ? new Date(r.lastUpdated) : null;
                    if (!lastUsed) return true;
                    const daysSince = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSince > 30 && (r.status === 'Available' || !r.status);
                });
                
                // Usage Over Time - Simulate monthly data (since we don't have historical data)
                const usageOverTime = [
                    { month: 'Jan', inUse: Math.floor(Math.random() * 10) + 5, available: Math.floor(Math.random() * 20) + 15 },
                    { month: 'Feb', inUse: Math.floor(Math.random() * 10) + 5, available: Math.floor(Math.random() * 20) + 15 },
                    { month: 'Mar', inUse: Math.floor(Math.random() * 10) + 5, available: Math.floor(Math.random() * 20) + 15 },
                    { month: 'Apr', inUse: stats.inUse, available: stats.available },
                ];
                const maxUsage = Math.max(...usageOverTime.map(u => Math.max(u.inUse, u.available)), 1);
                
                // Highest maintenance cost (most frequently needing repair)
                const maintenanceFrequent = resources.filter(r => r.condition === 'Needs Repair' || r.status === 'Under Maintenance' || r.status === 'Damaged')
                    .sort((a, b) => {
                        const aCount = (a.eventAssignments || []).length;
                        const bCount = (b.eventAssignments || []).length;
                        return bCount - aCount;
                    })[0];
                
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Left Filter Panel */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-4">
                                <h3 className="font-semibold text-slate-500 mb-4 text-sm uppercase tracking-wide">Filter Panel</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-2">Category</label>
                                        <select
                                            value={reportCategoryFilter}
                                            onChange={(e) => setReportCategoryFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        >
                                            <option value="all">All Categories</option>
                                            {resourceTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-2">Condition</label>
                                        <select
                                            value={reportConditionFilter}
                                            onChange={(e) => setReportConditionFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        >
                                            <option value="all">All Conditions</option>
                                            {conditionOptions.map(cond => (
                                                <option key={cond} value={cond}>{cond}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-2">Location</label>
                                        <select
                                            value={reportLocationFilter}
                                            onChange={(e) => setReportLocationFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        >
                                            <option value="all">All Locations</option>
                                            {locations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-2">Date Range</label>
                                        <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                                            <option>Last 30 days</option>
                                            <option>Last 90 days</option>
                                            <option>Last 6 months</option>
                                            <option>All time</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setReportCategoryFilter('all');
                                            setReportConditionFilter('all');
                                            setReportLocationFilter('all');
                                        }}
                                        className="w-full px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Header */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Resource Reports & Analytics</h2>
                                        <p className="text-slate-600 mt-1 text-sm">Export and view detailed resource usage statistics</p>
                                    </div>
                                    <button
                                        onClick={handleExportReport}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] transition-all duration-200 font-medium"
                                    >
                                        <Download className="w-5 h-5" />
                                        Export to CSV
                                    </button>
                                </div>
                            </div>

                            {/* Visual Summary Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Resource Distribution by Category */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-semibold text-slate-900 mb-4">Resource Distribution by Category</h3>
                                    <div className="space-y-3">
                                        {categoryDistribution.length > 0 ? categoryDistribution.map((item) => (
                                            <div key={item.name}>
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                    <span className="text-sm font-bold text-slate-900">{item.count}</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${(item.count / maxCategoryCount) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-500 text-center py-4">No data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Condition Breakdown */}
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-semibold text-slate-900 mb-4">Condition Breakdown</h3>
                                    <div className="space-y-3">
                                        {conditionBreakdown.map((item) => {
                                            const colorMap = {
                                                'New': 'from-emerald-500 to-emerald-600',
                                                'Good': 'from-blue-500 to-blue-600',
                                                'Needs Repair': 'from-amber-500 to-amber-600',
                                                'Damaged': 'from-red-500 to-red-600',
                                            };
                                            const color = colorMap[item.name] || 'from-slate-400 to-slate-500';
                                            return (
                                                <div key={item.name}>
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
                                                            style={{ width: `${(item.count / maxConditionCount) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Usage Over Time */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-900 mb-4">Usage Over Time</h3>
                                <div className="space-y-3">
                                    {usageOverTime.map((item) => (
                                        <div key={item.month}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm font-medium text-slate-700">{item.month}</span>
                                                <div className="flex gap-4 text-xs">
                                                    <span className="text-blue-600">In Use: {item.inUse}</span>
                                                    <span className="text-emerald-600">Available: {item.available}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 h-3">
                                                <div
                                                    className="bg-blue-500 rounded-l-full transition-all duration-500"
                                                    style={{ width: `${(item.inUse / maxUsage) * 100}%` }}
                                                ></div>
                                                <div
                                                    className="bg-emerald-500 rounded-r-full transition-all duration-500"
                                                    style={{ width: `${(item.available / maxUsage) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Insights Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Most Used Resource</p>
                                    <p className="text-lg font-bold text-blue-900 mb-1 truncate">{mostUsedResource?.name || '—'}</p>
                                    <p className="text-sm text-blue-700">{mostUsedCount} assignment{mostUsedCount !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Highest Maintenance Cost</p>
                                    <p className="text-lg font-bold text-amber-900 mb-1 truncate">
                                        {maintenanceFrequent?.name || 'None'}
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        {resources.filter(r => r.condition === 'Needs Repair' || r.status === 'Under Maintenance' || r.status === 'Damaged').length} item{resources.filter(r => r.condition === 'Needs Repair' || r.status === 'Under Maintenance' || r.status === 'Damaged').length !== 1 ? 's' : ''} need attention
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Unused Resources</p>
                                    <p className="text-lg font-bold text-slate-900 mb-1">{unusedResources.length}</p>
                                    <p className="text-sm text-slate-600">Inactive 30+ days</p>
                                </div>
                            </div>

                            {/* Filtered Summary */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-semibold text-slate-900 mb-4">Filtered Inventory Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-600 block mb-1">Total Items:</span>
                                        <p className="text-lg font-bold text-slate-900">{filteredForReports.reduce((sum, r) => sum + r.quantity, 0)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 block mb-1">Unique Resources:</span>
                                        <p className="text-lg font-bold text-slate-900">{filteredForReports.length}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 block mb-1">Damaged Items:</span>
                                        <p className="text-lg font-bold text-red-600">{filteredForReports.filter((r) => r.condition === 'Damaged').length}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-600 block mb-1">Under Maintenance:</span>
                                        <p className="text-lg font-bold text-yellow-600">{filteredForReports.filter((r) => r.status === 'Under Maintenance').length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Notification Alerts */}
            {stats.needsRepair > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-yellow-900">Attention Required</h3>
                        <p className="text-sm text-yellow-800 mt-1">{stats.needsRepair} resource(s) need repair or maintenance</p>
                    </div>
                </div>
            )}
        </div>
    );
}

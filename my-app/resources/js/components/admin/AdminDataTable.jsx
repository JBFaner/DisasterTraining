import React from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { AdminContentCard } from './AdminLayout';

/**
 * Reusable admin data table — Stronghold-style layout with sortable headers,
 * loading state, empty state, and optional pagination footer.
 */
export function AdminDataTable({
    columns = [],
    data = [],
    rowKey = 'id',
    sortKey = null,
    sortDir = 'asc',
    onSort = null,
    isLoading = false,
    emptyTitle = 'No records found',
    emptyDescription = 'Try adjusting your search or filter criteria.',
    pagination = null,
    onPageChange = null,
    renderActions = null,
    minWidth = '900px',
}) {
    const SortIcon = ({ columnKey }) => {
        if (!onSort || !columns.find((c) => c.key === columnKey)?.sortable) {
            return null;
        }
        if (sortKey === columnKey) {
            return sortDir === 'asc'
                ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />;
        }
        return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />;
    };

    const handleSort = (column) => {
        if (!onSort || !column.sortable) return;
        if (sortKey === column.key) {
            onSort(column.key, sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            onSort(column.key, 'asc');
        }
    };

    return (
        <AdminContentCard className="w-full">
            <div className="overflow-x-auto w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <table className="w-full text-sm" style={{ minWidth }}>
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-5 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap ${
                                        column.align === 'right' ? 'text-right' : 'text-left'
                                    } ${column.sortable && onSort ? 'cursor-pointer select-none hover:bg-slate-100/80' : ''}`}
                                    onClick={() => handleSort(column)}
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        {column.label}
                                        <SortIcon columnKey={column.key} />
                                    </span>
                                </th>
                            ))}
                            {renderActions && (
                                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {!isLoading && data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length + (renderActions ? 1 : 0)}
                                    className="px-5 py-12 text-center"
                                >
                                    <p className="text-slate-500 font-medium">{emptyTitle}</p>
                                    <p className="text-slate-400 text-xs mt-1">{emptyDescription}</p>
                                </td>
                            </tr>
                        )}
                        {data.map((row) => (
                            <tr
                                key={row[rowKey] ?? row.id}
                                className="bg-white hover:bg-slate-50/80 transition-colors duration-150"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-5 py-4 whitespace-nowrap ${
                                            column.align === 'right' ? 'text-right' : ''
                                        } ${column.className || ''}`}
                                    >
                                        {column.render
                                            ? column.render(row)
                                            : row[column.key] ?? '—'}
                                    </td>
                                ))}
                                {renderActions && (
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {renderActions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {pagination && onPageChange && pagination.total > 0 && (
                <AdminTablePagination
                    pagination={pagination}
                    onPageChange={onPageChange}
                />
            )}
        </AdminContentCard>
    );
}

export function AdminTablePagination({ pagination, onPageChange }) {
    const { current_page: currentPage, last_page: totalPages, per_page: itemsPerPage, total: totalItems } = pagination;
    const maxVisiblePages = typeof window !== 'undefined' && window.innerWidth >= 768 ? 7 : 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    const startItem = pagination.from ?? ((currentPage - 1) * itemsPerPage + 1);
    const endItem = pagination.to ?? Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    const btnBase = 'inline-flex items-center justify-center min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors';
    const btnPage = (active) => active
        ? `${btnBase} bg-emerald-600 text-white border border-emerald-600`
        : `${btnBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-sm text-slate-600">
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`${btnBase} px-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        ‹
                    </button>
                    {pages.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={btnPage(page === currentPage)}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`${btnBase} px-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}

export function AdminStatusBadge({ status, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
    const isActive = status === 'active';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-medium ${
                isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isActive ? activeLabel : inactiveLabel}
        </span>
    );
}

export function AdminTableActionButton({ href, onClick, icon: Icon, title, variant = 'default', disabled = false, type = 'button' }) {
    const variants = {
        view: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
        edit: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
        warning: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
        default: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
    };

    const classes = `inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.default}`;

    if (href) {
        return (
            <a href={href} className={classes} title={title}>
                <Icon className="w-4 h-4" />
            </a>
        );
    }

    return (
        <button type={type} onClick={onClick} disabled={disabled} className={classes} title={title}>
            {disabled ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
        </button>
    );
}

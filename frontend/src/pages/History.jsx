import React, { useState, useEffect, useMemo } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  Download,
  ExternalLink,
  Layers,
  Clock,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'duration_desc', 'duration_asc'

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(100);
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.deleteHistoryRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete history record:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all processing history?')) return;
    try {
      await api.clearHistory();
      setRecords([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesSearch =
          rec.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.module?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.device?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesModule =
          selectedModule === 'ALL'
            ? true
            : selectedModule === 'COLORIZATION'
            ? rec.module?.toLowerCase().includes('color')
            : selectedModule === 'SUPER_RES'
            ? rec.module?.toLowerCase().includes('super')
            : selectedModule === 'SMART_RESTORE'
            ? rec.module?.toLowerCase().includes('smart')
            : true;

        return matchesSearch && matchesModule;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.timestamp || 0) - (a.timestamp || 0);
        if (sortBy === 'oldest') return (a.timestamp || 0) - (b.timestamp || 0);
        if (sortBy === 'duration_desc') return (b.duration_sec || 0) - (a.duration_sec || 0);
        if (sortBy === 'duration_asc') return (a.duration_sec || 0) - (b.duration_sec || 0);
        return 0;
      });
  }, [records, searchQuery, selectedModule, sortBy]);

  // Telemetry Aggregates
  const totalDuration = useMemo(() => {
    return records.reduce((sum, r) => sum + (parseFloat(r.duration_sec) || 0), 0).toFixed(1);
  }, [records]);

  const avgDuration = useMemo(() => {
    if (records.length === 0) return '0.0';
    return (totalDuration / records.length).toFixed(2);
  }, [records, totalDuration]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2B40] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F8FC] tracking-tight">
            Processing History
          </h1>
          <p className="text-sm text-[#98A9BD] mt-1">
            Browse, inspect, and download past image and video restorations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/history/export"
            download="vision_ai_history.csv"
            className="px-3.5 py-2 rounded-xl bg-[#101D2E] hover:bg-[#1A2B40] border border-[#1A2B40] text-xs font-mono text-[#80BCFF] hover:text-white flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#25C98A]" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-xl bg-[#0C1421] hover:bg-[#101D2E] border border-[#1A2B40] text-[#98A9BD] hover:text-[#F5F8FC] transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 rounded-xl bg-[#0C1421] hover:bg-[#F06464]/20 border border-[#1A2B40] hover:border-[#F06464]/50 text-xs font-mono text-[#F06464] flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
          <span className="text-[10px] font-mono text-[#64758A] block">TOTAL JOBS RECORDED</span>
          <span className="text-xl font-bold font-mono text-[#F5F8FC]">{records.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
          <span className="text-[10px] font-mono text-[#64758A] block">TOTAL COMPUTE TIME</span>
          <span className="text-xl font-bold font-mono text-[#80BCFF]">{totalDuration}s</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
          <span className="text-[10px] font-mono text-[#64758A] block">AVG INFERENCE DURATION</span>
          <span className="text-xl font-bold font-mono text-[#25C98A]">{avgDuration}s</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0C1421] border border-[#1A2B40]">
          <span className="text-[10px] font-mono text-[#64758A] block">PRIMARY ACCELERATOR</span>
          <span className="text-xl font-bold font-mono text-[#F5F8FC]">Apple MPS</span>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="p-4 rounded-2xl bg-[#0C1421] border border-[#1A2B40] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64758A]" />
          <input
            type="text"
            placeholder="Search by file, module, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1A2B40] bg-[#080D16] text-xs font-mono text-[#F5F8FC] placeholder-[#64758A] focus:outline-none focus:border-[#268BFF]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Modules' },
            { id: 'SMART_RESTORE', label: 'Smart Restore' },
            { id: 'COLORIZATION', label: 'Colorization' },
            { id: 'SUPER_RES', label: 'Super-Res' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedModule(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedModule === pill.id
                  ? 'bg-[#101D2E] text-[#268BFF] border border-[#1A2B40]'
                  : 'text-[#98A9BD] hover:text-[#F5F8FC] bg-[#080D16]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#64758A]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort history records"
            className="py-1.5 px-2.5 rounded-lg border border-[#1A2B40] bg-[#080D16] text-xs font-mono text-[#F5F8FC] focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration_desc">Longest Duration</option>
            <option value="duration_asc">Fastest Duration</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-[#0C1421] border border-[#1A2B40] shadow-xl space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#64758A]">
            Loading processing records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-[#64758A] space-y-2">
            <div>No matching processing history records found.</div>
            <div className="text-[11px] text-[#64758A]">
              Try adjusting your search query or run a new restoration job.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1A2B40] text-[#64758A]">
                  <th className="py-3 px-3">DATE / ID</th>
                  <th className="py-3 px-3">SOURCE FILE</th>
                  <th className="py-3 px-3">PIPELINE MODULE</th>
                  <th className="py-3 px-3">RESOLUTION</th>
                  <th className="py-3 px-3">ACCELERATOR</th>
                  <th className="py-3 px-3">DURATION</th>
                  <th className="py-3 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2B40]/60 text-[#98A9BD]">
                {filteredRecords.map((rec) => {
                  const dateStr = rec.timestamp
                    ? new Date(rec.timestamp * 1000).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr key={rec.id} className="hover:bg-[#101D2E]/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="text-[#F5F8FC] font-semibold">{dateStr}</div>
                        <div className="text-[10px] text-[#64758A] truncate max-w-[80px]">{rec.id}</div>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-[#F5F8FC] max-w-[180px] truncate">
                        {rec.file_name}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#101D2E] text-[#80BCFF] border border-[#1A2B40] inline-block truncate max-w-[200px]">
                          {rec.module}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {rec.input_resolution} → <span className="text-[#F5F8FC] font-semibold">{rec.output_resolution}</span>
                      </td>
                      <td className="py-3.5 px-3 truncate max-w-[130px]">{rec.device}</td>
                      <td className="py-3.5 px-3 text-[#F5F8FC] font-bold">{rec.duration_sec}s</td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={rec.output_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#101D2E] text-[#268BFF] hover:bg-[#1A2B40] transition-colors"
                            title="Preview Output"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={rec.download_url}
                            className="p-1.5 rounded-lg bg-[#101D2E] text-[#25C98A] hover:bg-[#1A2B40] transition-colors"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            disabled={deletingId === rec.id}
                            className="p-1.5 rounded-lg bg-[#101D2E] text-[#98A9BD] hover:text-[#F06464] hover:bg-[#1A2B40] transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

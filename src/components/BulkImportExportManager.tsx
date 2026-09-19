import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileText,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  History,
  Filter,
  Check,
  Eye,
  AlertCircle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';
import {
  BulkDatasetType,
  BulkTemplateColumn,
  BulkValidationReport,
  BulkValidationRowResult,
  BulkImportResult,
  User,
  Cycle,
  Department,
} from '../types';

interface BulkImportExportManagerProps {
  currentUser?: User | null;
  onDataImported?: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB upload guardrail
const MAX_BATCH_ROWS = 3000; // 3,000 records recommended per batch
const PREVIEW_PAGE_SIZE = 20; // 20 rows per page to prevent DOM memory ballooning

export const BulkImportExportManager: React.FC<BulkImportExportManagerProps> = ({
  currentUser,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT' | 'HISTORY'>('IMPORT');
  const [selectedDataset, setSelectedDataset] = useState<BulkDatasetType>('employees');

  // Import State
  const [templateColumns, setTemplateColumns] = useState<BulkTemplateColumn[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [validationReport, setValidationReport] = useState<BulkValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [allowUpdateExisting, setAllowUpdateExisting] = useState(true);
  const [skipInvalidRows, setSkipInvalidRows] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [dragActive, setDragActive] = useState(false);

  // Export State
  const [exportCycleId, setExportCycleId] = useState<string>('ALL');
  const [exportDeptId, setExportDeptId] = useState<string>('ALL');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Reference Masters for Filters
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Template Schema when dataset changes
  useEffect(() => {
    loadTemplateSchema(selectedDataset);
  }, [selectedDataset]);

  // Load masters for filters and history
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [cList, dList] = await Promise.all([
          api.getCycles(),
          api.getDepartments(),
        ]);
        setCycles(cList || []);
        setDepartments(dList || []);
      } catch (err) {
        console.error('Failed to load masters:', err);
      }
    };
    fetchMasters();
  }, []);

  const loadTemplateSchema = async (type: BulkDatasetType) => {
    try {
      const res = await api.getBulkTemplate(type);
      setTemplateColumns(res.columns || []);
      setSampleData(res.sampleData || []);
      // Reset current file preview if dataset changes
      setParsedRows([]);
      setValidationReport(null);
      setFileName('');
      setImportResult(null);
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const logs = await api.getBulkImportHistory();
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      loadHistory();
    }
  }, [activeTab]);

  // ==========================================
  // File Parsing & Handling
  // ==========================================
  const handleFileUpload = (file: File) => {
    if (!file) return;

    // 1. File Size Guardrail (Pre-Read Check)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB. Please upload a smaller file.`,
        'File Too Large'
      );
      return;
    }

    setFileName(file.name);
    setImportResult(null);
    setIsParsing(true);
    setPreviewPage(1);

    const isCsv = file.name.endsWith('.csv');

    // Yield control to the browser event loop so React can render the loading state before synchronous parsing
    setTimeout(() => {
      if (isCsv) {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const rows = normalizeParsedData(results.data);
              // 2. Batch Row Count Cap
              if (rows.length > MAX_BATCH_ROWS) {
                toast.warning(
                  `File contains ${rows.length} records. The maximum recommended batch size is ${MAX_BATCH_ROWS} rows. Please split your file into smaller batches for optimal performance.`,
                  'Batch Limit Exceeded'
                );
                setIsParsing(false);
                return;
              }
              setParsedRows(rows);
              validateData(selectedDataset, rows);
            } finally {
              setIsParsing(false);
            }
          },
          error: (err) => {
            setIsParsing(false);
            toast.error(`CSV Parse Error: ${err.message}`, 'Parsing Failed');
          },
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            const rows = normalizeParsedData(json);
            // 2. Batch Row Count Cap
            if (rows.length > MAX_BATCH_ROWS) {
              toast.warning(
                `File contains ${rows.length} records. The maximum recommended batch size is ${MAX_BATCH_ROWS} rows. Please split your file into smaller batches for optimal performance.`,
                'Batch Limit Exceeded'
              );
              setIsParsing(false);
              return;
            }
            setParsedRows(rows);
            validateData(selectedDataset, rows);
          } catch (err: any) {
            toast.error(`Excel Read Error: ${err.message}`, 'Parsing Failed');
          } finally {
            setIsParsing(false);
          }
        };
        reader.onerror = () => {
          setIsParsing(false);
          toast.error('Failed to read file from disk.', 'File Read Error');
        };
        reader.readAsArrayBuffer(file);
      }
    }, 60);
  };

  // Map header names (human friendly or key) to canonical schema keys
  const normalizeParsedData = (rawList: any[]) => {
    return rawList.map((row) => {
      const normalized: Record<string, any> = {};
      Object.entries(row).forEach(([rawKey, val]) => {
        const cleanKey = rawKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        // Match against template columns
        const colMatch = templateColumns.find(
          (c) =>
            c.key.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey ||
            c.label.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey
        );
        if (colMatch) {
          normalized[colMatch.key] = val;
        } else {
          normalized[rawKey] = val;
        }
      });
      return normalized;
    });
  };

  const validateData = async (type: BulkDatasetType, rows: any[]) => {
    if (rows.length === 0) return;
    setIsValidating(true);
    try {
      const report = await api.validateBulkRows(type, rows, allowUpdateExisting);
      setValidationReport(report);
      if (report.errorCount > 0) {
        toast.warning(`Validated with ${report.errorCount} errors and ${report.validCount} valid rows.`, 'Validation Results');
      } else {
        toast.success(`All ${report.totalRows} rows validated successfully!`, 'Validation Passed');
      }
    } catch (err: any) {
      toast.error(`Validation error: ${err.message}`, 'Validation Error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadSample = (format: 'xlsx' | 'csv') => {
    if (sampleData.length === 0) return;

    // Build human-friendly headers from template columns
    const exportData = sampleData.map((row) => {
      const mapped: Record<string, any> = {};
      templateColumns.forEach((c) => {
        mapped[c.label] = row[c.key] !== undefined ? row[c.key] : c.example;
      });
      return mapped;
    });

    const baseName = `PMS_Template_${selectedDataset.toUpperCase()}`;

    if (format === 'csv') {
      const csvStr = Papa.unparse(exportData);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${baseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    }
    toast.info(`Downloaded ${baseName} sample template.`, 'Sample Downloaded');
  };

  const handleExecuteImport = async () => {
    if (!validationReport || validationReport.validCount === 0) return;
    setIsImporting(true);
    try {
      const rowsToImport = validationReport.results
        .filter((r) => (skipInvalidRows ? r.isValid : true))
        .map((r) => r.data);

      const result = await api.executeBulkImport(selectedDataset, rowsToImport, {
        skipInvalid: skipInvalidRows,
        allowUpdateExisting,
        fileName: fileName || `${selectedDataset}_batch_import.xlsx`,
      });

      setImportResult(result);
      toast.success(`Imported ${result.successCount} ${selectedDataset} records successfully!`, 'Import Completed');
      if (onDataImported) onDataImported();
    } catch (err: any) {
      toast.error(`Import Failed: ${err.message}`, 'Import Error');
    } finally {
      setIsImporting(false);
    }
  };

  // ==========================================
  // Live Export Generation
  // ==========================================
  const handleExportData = async (type: BulkDatasetType) => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const res = await api.getBulkExportData(type, {
        cycleId: exportCycleId,
        departmentId: exportDeptId,
      });

      const records = res.data || [];
      if (records.length === 0) {
        toast.warning('No matching records found for the selected filters.', 'No Records');
        setIsExporting(false);
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `PMS_Export_${type.toUpperCase()}_${timestamp}`;

      if (exportFormat === 'json') {
        const jsonStr = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (exportFormat === 'csv') {
        const csvStr = Papa.unparse(records);
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const ws = XLSX.utils.json_to_sheet(records);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, type);
        XLSX.writeFile(wb, `${filename}.xlsx`);
      }

      const msg = `Successfully generated & downloaded ${records.length} records!`;
      setExportSuccessMsg(msg);
      toast.success(msg, 'Export Successful');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: any) {
      toast.error(`Export Failed: ${err.message}`, 'Export Error');
    } finally {
      setIsExporting(false);
    }
  };

  const DATASET_CARDS: Array<{
    id: BulkDatasetType;
    title: string;
    description: string;
    icon: any;
    color: string;
    badge: string;
  }> = [
    {
      id: 'employees',
      title: 'Employee Master Directory',
      description: 'Bulk create/update employees, appraisal cycle assignments, base CTC, and reporting managers.',
      icon: Users,
      color: 'indigo',
      badge: 'Core Foundation',
    },
    {
      id: 'kras',
      title: 'KRA & KPI Template Library',
      description: 'Upload weighted performance key result areas (100% total), targets, units, and role templates.',
      icon: Target,
      color: 'teal',
      badge: 'Scoring Weights',
    },
    {
      id: 'quarterly-scores',
      title: 'Quarterly Scoring Sheets',
      description: 'Batch upload offline Q1-Q4 manager evaluation ratings, remarks, and quarterly score rollups.',
      icon: BarChart3,
      color: 'amber',
      badge: 'Q1-Q4 Reviews',
    },
    {
      id: 'increment-matrix',
      title: 'Annual Increment & Rating Matrix',
      description: 'Calibrated performance ratings, proposed salary hike %, performance bonuses, and promotions.',
      icon: TrendingUp,
      color: 'emerald',
      badge: 'Appraisal & CTC',
    },
  ];

  const filteredResults =
    validationReport?.results.filter((r) => {
      if (statusFilter === 'ALL') return true;
      return r.status === statusFilter;
    }) || [];

  const totalPages = Math.ceil(filteredResults.length / PREVIEW_PAGE_SIZE) || 1;
  const paginatedResults = filteredResults.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                Bulk Engine
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Enterprise Data Exchange</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Bulk Excel / CSV Import & Export Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              High-throughput batch ingest engine with client-side parsing, schema verification, master referential checks, and one-click database synchronizations.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab('IMPORT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'IMPORT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/60 dark:border-slate-650'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Bulk Importer
            </button>
            <button
              onClick={() => setActiveTab('EXPORT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'EXPORT'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/60 dark:border-slate-650'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              Master Exporter
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs border border-slate-200/60 dark:border-slate-650'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Batch History
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BULK IMPORTER */}
      {/* ========================================================================= */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-6">
          {/* Dataset Selector Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Select Ingestion Dataset
              </h2>
              <span className="text-xs text-slate-400 font-medium">Step 1 of 3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {DATASET_CARDS.map((card) => {
                const IconComponent = card.icon;
                const isSelected = selectedDataset === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedDataset(card.id)}
                    className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-slate-850 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{card.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isSelected ? 'Active Dataset' : 'Select'}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 font-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload & Template Downloader Zone */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Drag & Drop Zone */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Upload Spreadsheet Data File
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Supports Microsoft Excel (<code className="text-indigo-600 dark:text-indigo-400 font-mono">.xlsx</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">.xls</code>) or standard comma-separated (<code className="text-indigo-600 dark:text-indigo-400 font-mono">.csv</code>).
                  </p>
                </div>
              </div>

              {/* Drag Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                    : fileName
                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                {isParsing ? (
                  <div className="py-2">
                    <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="font-bold text-slate-900 dark:text-white text-base">Reading & Parsing Spreadsheet...</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Decompressing records and mapping columns. Please wait a moment.
                    </p>
                  </div>
                ) : fileName ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> File Loaded
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{fileName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {parsedRows.length} rows detected • Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Drag & Drop your Excel or CSV file here, or <span className="text-indigo-600 dark:text-indigo-400 underline">Browse Files</span>
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                      Maximum file size: 10 MB • Recommended up to 3,000 rows per batch
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Options Checklist */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowUpdateExisting}
                    onChange={(e) => {
                      setAllowUpdateExisting(e.target.checked);
                      if (parsedRows.length > 0) validateData(selectedDataset, parsedRows);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Upsert Mode: Update existing records if matching key exists
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipInvalidRows}
                    onChange={(e) => setSkipInvalidRows(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Fault Tolerance: Skip invalid rows and import remaining valid entries
                  </span>
                </label>
              </div>
            </div>

            {/* Right: Template Schema & Downloader */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Template Specifications
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    {templateColumns.length} Columns
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Download pre-formatted sample templates with pre-configured header columns and dummy rows for instant population.
                </p>

                {/* Column chips preview */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {templateColumns.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 text-xs"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{col.label}</span>
                        {col.required && (
                          <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold shrink-0">*Req</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 uppercase">
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => handleDownloadSample('xlsx')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Download Excel Template (.xlsx)
                </button>
                <button
                  onClick={() => handleDownloadSample('csv')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Download CSV Template (.csv)
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* Step 3: Interactive Pre-Commit Validation & Data Table */}
          {/* ================================================================= */}
          {isValidating && (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Validating records against PMS constraints...</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Checking joining cycle dates, manager relationships, email unicity, and rating ranges.
              </p>
            </div>
          )}

          {validationReport && !isValidating && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Validation Summary Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50 dark:bg-slate-850/50">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Validation Report:
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md">
                      {validationReport.totalRows} Total Rows
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validationReport.validCount} Valid
                    </span>
                    {validationReport.warningCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {validationReport.warningCount} Warnings
                      </span>
                    )}
                    {validationReport.errorCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-md">
                        <XCircle className="w-3.5 h-3.5" />
                        {validationReport.errorCount} Errors
                      </span>
                    )}
                  </div>
                </div>

                {/* Filter and Commit Action */}
                <div className="flex items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 text-xs font-semibold">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        statusFilter === 'ALL' ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All ({validationReport.totalRows})
                    </button>
                    <button
                      onClick={() => setStatusFilter('VALID')}
                      className={`px-2.5 py-1 rounded-md cursor-pointer ${
                        statusFilter === 'VALID' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Valid ({validationReport.validCount})
                    </button>
                    {validationReport.errorCount > 0 && (
                      <button
                        onClick={() => setStatusFilter('ERROR')}
                        className={`px-2.5 py-1 rounded-md cursor-pointer ${
                          statusFilter === 'ERROR' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Errors ({validationReport.errorCount})
                      </button>
                    )}
                  </div>

                  {/* Primary Commit Button */}
                  <button
                    onClick={handleExecuteImport}
                    disabled={isImporting || validationReport.validCount === 0}
                    className="flex items-center gap-2 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Committing {validationReport.validCount} Records...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Commit & Sync {validationReport.validCount} Records
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-14">#</th>
                      <th className="py-2.5 px-3 w-28">Status</th>
                      <th className="py-2.5 px-3 w-24">Action</th>
                      {templateColumns.slice(0, 6).map((c) => (
                        <th key={c.key} className="py-2.5 px-3">
                          {c.label}
                        </th>
                      ))}
                      <th className="py-2.5 px-3">Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {paginatedResults.map((res) => {
                      const isError = res.status === 'ERROR';
                      const isWarning = res.status === 'WARNING';
                      return (
                        <tr
                          key={res.rowNumber}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                            isError ? 'bg-rose-50/20 dark:bg-rose-950/20' : isWarning ? 'bg-amber-50/20 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-slate-500 font-bold">{res.rowNumber}</td>
                          <td className="py-2.5 px-3">
                            {res.status === 'VALID' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            )}
                            {res.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3" /> Notice
                              </span>
                            )}
                            {res.status === 'ERROR' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                res.action === 'INSERT'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                  : res.action === 'UPDATE'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {res.action}
                            </span>
                          </td>
                          {templateColumns.slice(0, 6).map((c) => (
                            <td key={c.key} className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                              {String(res.data[c.key] ?? '-')}
                            </td>
                          ))}
                          <td className="py-2.5 px-3">
                            {res.errors.length > 0 && (
                              <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {res.errors.join(' • ')}
                              </div>
                            )}
                            {res.warnings.length > 0 && (
                              <div className="text-amber-600 dark:text-amber-400 font-medium text-[11px] flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                {res.warnings.join(' • ')}
                              </div>
                            )}
                            {res.isValid && res.warnings.length === 0 && (
                              <span className="text-slate-400 dark:text-slate-500 text-[11px]">All criteria verified</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredResults.length > PREVIEW_PAGE_SIZE && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850/50 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{(previewPage - 1) * PREVIEW_PAGE_SIZE + 1}</strong> to{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{Math.min(previewPage * PREVIEW_PAGE_SIZE, filteredResults.length)}</strong> of{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{filteredResults.length}</strong> records
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      Page {previewPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                      disabled={previewPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Result Feedback Banner */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">Bulk Ingestion Successfully Committed!</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{importResult.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span>✓ {importResult.insertedCount} Records Inserted</span>
                      <span>• {importResult.updatedCount} Records Updated</span>
                      <span>• Batch ID: <code className="font-mono">{importResult.batchId}</code></span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setImportResult(null)}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER DATA EXPORTER */}
      {/* ========================================================================= */}
      {activeTab === 'EXPORT' && (
        <div className="space-y-6">
          {/* Global Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Export Filters:
              </div>

              {/* Cycle Filter */}
              <select
                value={exportCycleId}
                onChange={(e) => setExportCycleId(e.target.value)}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Appraisal Cycles</option>
                {cycles.filter((c) => c.active !== false).map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={exportDeptId}
                onChange={(e) => setExportDeptId(e.target.value)}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Format Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-bold">
                <button
                  onClick={() => setExportFormat('xlsx')}
                  className={`px-3 py-1 rounded-md cursor-pointer ${
                    exportFormat === 'xlsx' ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`px-3 py-1 rounded-md cursor-pointer ${
                    exportFormat === 'csv' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  CSV (.csv)
                </button>
                <button
                  onClick={() => setExportFormat('json')}
                  className={`px-3 py-1 rounded-md cursor-pointer ${
                    exportFormat === 'json' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  JSON (.json)
                </button>
              </div>
            </div>

            {exportSuccessMsg && (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {exportSuccessMsg}
              </span>
            )}
          </div>

          {/* Export Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DATASET_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{card.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {card.description} Includes real-time joins with master relationships and audit metadata.
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      Target format: <strong className="text-slate-700 dark:text-slate-300 uppercase font-mono">{exportFormat}</strong>
                    </span>
                    <button
                      onClick={() => handleExportData(card.id)}
                      disabled={isExporting}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download Live Dataset
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BATCH IMPORT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Bulk Ingestion & Exchange Audit Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete traceability of batch imports, user sessions, file identifiers, and commit statistics.
              </p>
            </div>
            <button
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Executed By</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Execution Summary</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No bulk import batches recorded in audit trail yet.
                    </td>
                  </tr>
                ) : (
                  historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.batchId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.importedBy}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md text-slate-600 dark:text-slate-300">{log.details}</td>
                      <td className="py-3 px-4 text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

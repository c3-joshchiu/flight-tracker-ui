import { useCallback, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '@/api';
import type { ExportData, ImportPayload, ImportReport } from '@/Interfaces';
import { downloadTextFile } from '@/utils/download';
import { parseCsvImport } from '@/utils/csvParser';

type ExportFormat = 'csv' | 'xlsx' | 'json';
type ExportScope = 'all' | 'current';
type ConflictStrategy = 'skip' | 'overwrite';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedSearchId: string | null;
  onImportComplete: () => void;
}

export default function ExportImportDialog({ open, onClose, selectedSearchId, onImportComplete }: Props) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('all');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'xlsx') {
        const fetcher = scope === 'current' && selectedSearchId
          ? api.data.exportSearch(selectedSearchId, 'json')
          : api.data.exportAll('json');
        const data = (await fetcher) as ExportData;

        const wb = XLSX.utils.book_new();

        if (data.searches && data.searches.length > 0) {
          const searchRows = data.searches.map((s) => ({
            ID: s.id,
            From: s.fromAirport,
            To: s.toAirport,
            'Trip Type': s.tripType,
            'Outbound Date': s.outboundDate,
            'Return Date': s.returnDate || '',
            Passengers: s.passengersAdults,
            Currency: s.currency,
            Status: s.searchStatus,
          }));
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(searchRows), 'Searches');
        }

        if (data.snapshots && data.snapshots.length > 0) {
          const snapRows = data.snapshots.map((snap) => ({
            'Search ID': snap.flightSearchId,
            Class: snap.seatClass,
            'Price ($)': (snap.price / 100).toFixed(2),
            Airlines: snap.airlineNames?.join(', ') || '',
            'Flight Type': snap.flightType || '',
            'Duration (min)': snap.durationMinutes || '',
            'Fetched At': snap.fetchedAt,
          }));
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snapRows), 'Price History');
        }

        XLSX.writeFile(wb, `flight-tracker-export-${timestamp}.xlsx`);
      } else {
        const fetcher = scope === 'current' && selectedSearchId
          ? api.data.exportSearch(selectedSearchId, format)
          : api.data.exportAll(format);
        const result = await fetcher;

        if (format === 'json') {
          const jsonStr = JSON.stringify(result, null, 2);
          downloadTextFile(jsonStr, `flight-tracker-export-${timestamp}.json`, 'application/json');
        } else {
          downloadTextFile(result as string, `flight-tracker-export-${timestamp}.csv`, 'text/csv');
        }
      }
    } catch (err) {
      console.error('[ExportImportDialog] export failed', { format, scope, selectedSearchId }, err);
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }, [format, scope, selectedSearchId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImportFile(file);
    setImportReport(null);
    setImportError(null);
    e.target.value = '';
  }, []);

  const handleImport = useCallback(async () => {
    if (!importFile) return;
    setImporting(true);
    setImportError(null);
    setImportReport(null);
    try {
      let payload: ImportPayload;

      if (importFile.name.endsWith('.json')) {
        const text = await importFile.text();
        payload = JSON.parse(text);
      } else if (importFile.name.endsWith('.csv')) {
        const text = await importFile.text();
        payload = parseCsvImport(text);
      } else {
        throw new Error('Unsupported file type. Use .json or .csv');
      }

      payload.conflictStrategy = conflictStrategy;
      const report = await api.data.importData(payload);
      setImportReport(report);
      onImportComplete();
    } catch (err) {
      console.error('[ExportImportDialog] import failed', { file: importFile?.name, conflictStrategy }, err);
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }, [importFile, conflictStrategy, onImportComplete]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="c3-card relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Export / Import Data</h2>
          <button onClick={onClose} className="text-secondary transition-colors hover:text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Export Section ──────────────────────────────── */}
        <div className="mb-5 border border-weak bg-secondary p-4">
          <h3 className="mb-3 text-sm font-medium text-primary">Export</h3>

          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-secondary">Format</label>
            <div className="flex gap-3">
              {(['csv', 'xlsx', 'json'] as const).map((f) => (
                <label key={f} className="flex items-center gap-1.5 text-xs text-primary">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-primary"
                  />
                  {f.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-secondary">Scope</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-primary">
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-primary"
                />
                All searches
              </label>
              <label className="flex items-center gap-1.5 text-xs text-primary">
                <input
                  type="radio"
                  name="exportScope"
                  value="current"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  disabled={!selectedSearchId}
                  className="accent-primary"
                />
                <span className={!selectedSearchId ? 'text-secondary' : ''}>Current search</span>
              </label>
            </div>
          </div>

          <p className="mb-3 text-[11px] text-secondary">
            Non-seed data only (user-created searches and their price history)
          </p>

          {exportError && (
            <p className="mb-2 text-xs text-destructive">{exportError}</p>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-2 px-6 text-base bg-accent text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {exporting ? 'Downloading...' : 'Download Export'}
          </button>
        </div>

        {/* ── Separator ──────────────────────────────────── */}
        <div className="mb-5 border-t border-weak" />

        {/* ── Import Section ─────────────────────────────── */}
        <div className="border border-weak bg-secondary p-4">
          <h3 className="mb-3 text-sm font-medium text-primary">Import</h3>

          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-weak px-3 py-4 text-xs text-secondary transition-colors hover:border-accent hover:text-primary"
            >
              {importFile ? importFile.name : 'Drop file here or click to browse'}
            </button>
            <p className="mt-1 text-[11px] text-secondary">Accepts: .csv, .json</p>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-secondary">On conflict</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-primary">
                <input
                  type="radio"
                  name="conflictStrategy"
                  value="skip"
                  checked={conflictStrategy === 'skip'}
                  onChange={() => setConflictStrategy('skip')}
                  className="accent-primary"
                />
                Skip existing
              </label>
              <label className="flex items-center gap-1.5 text-xs text-primary">
                <input
                  type="radio"
                  name="conflictStrategy"
                  value="overwrite"
                  checked={conflictStrategy === 'overwrite'}
                  onChange={() => setConflictStrategy('overwrite')}
                  className="accent-primary"
                />
                Overwrite
              </label>
            </div>
          </div>

          {importError && (
            <p className="mb-2 text-xs text-destructive">{importError}</p>
          )}

          <button
            onClick={handleImport}
            disabled={importing || !importFile}
            className="w-full py-2 px-6 text-base bg-accent text-inverse hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Upload & Import'}
          </button>

          {importReport && (
            <div className="mt-3 border border-weak bg-secondary p-3 text-xs text-primary">
              <p className="mb-1 font-medium">Import Complete</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                <span className="text-secondary">Searches created:</span>
                <span>{importReport.searches.created}</span>
                <span className="text-secondary">Searches skipped:</span>
                <span>{importReport.searches.skipped}</span>
                <span className="text-secondary">Searches overwritten:</span>
                <span>{importReport.searches.overwritten}</span>
                <span className="text-secondary">Snapshots created:</span>
                <span>{importReport.snapshots.created}</span>
                <span className="text-secondary">Snapshots skipped:</span>
                <span>{importReport.snapshots.skipped}</span>
                <span className="text-secondary">Snapshots overwritten:</span>
                <span>{importReport.snapshots.overwritten}</span>
              </div>
              {(importReport.searches.errors.length > 0 || importReport.snapshots.errors.length > 0) && (
                <div className="mt-2 border-t border-weak pt-2">
                  <p className="mb-1 font-medium text-destructive">Errors</p>
                  {importReport.searches.errors.map((e, i) => (
                    <p key={`se-${i}`} className="text-destructive">Search {e.id}: {e.error}</p>
                  ))}
                  {importReport.snapshots.errors.map((e, i) => (
                    <p key={`sn-${i}`} className="text-destructive">Snapshot {e.id}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

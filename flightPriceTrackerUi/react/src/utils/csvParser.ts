import type { ExportedSearch, ExportedSnapshot, ImportPayload } from '@/Interfaces';

/**
 * Parse the two-section CSV export format back into an ImportPayload.
 * Sections are delimited by "# SEARCHES" and "# SNAPSHOTS" comment lines.
 */
export function parseCsvImport(csv: string): ImportPayload {
  const lines = csv.split(/\r?\n/);
  let currentSection: 'none' | 'searches' | 'snapshots' = 'none';
  let headers: string[] = [];
  const searches: ExportedSearch[] = [];
  const snapshots: ExportedSnapshot[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === '# SEARCHES') {
      currentSection = 'searches';
      headers = [];
      continue;
    }
    if (trimmed === '# SNAPSHOTS') {
      currentSection = 'snapshots';
      headers = [];
      continue;
    }
    if (trimmed.startsWith('#')) continue;

    const fields = parseCsvLine(trimmed);

    if (headers.length === 0) {
      headers = fields;
      continue;
    }

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = fields[i] || '';
    }

    if (currentSection === 'searches') {
      searches.push({
        id: row.id || '',
        fromAirport: row.fromAirport || '',
        toAirport: row.toAirport || '',
        tripType: row.tripType || 'one-way',
        outboundDate: row.outboundDate || '',
        returnDate: row.returnDate || null,
        maxStops: row.maxStops ? parseInt(row.maxStops, 10) : null,
        passengersAdults: row.passengersAdults ? parseInt(row.passengersAdults, 10) : 1,
        currency: row.currency || 'USD',
        searchStatus: row.searchStatus || 'active',
        snapshotCount: 0,
      });
    } else if (currentSection === 'snapshots') {
      snapshots.push({
        id: row.id || '',
        flightSearchId: row.flightSearchId || '',
        seatClass: row.seatClass || 'economy',
        price: row.price ? parseInt(row.price, 10) : 0,
        airlineCodes: row.airlineCodes ? row.airlineCodes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        airlineNames: row.airlineNames ? row.airlineNames.split(',').map((s) => s.trim()).filter(Boolean) : [],
        flightType: row.flightType || null,
        durationMinutes: row.durationMinutes ? parseInt(row.durationMinutes, 10) : null,
        fetchedAt: row.fetchedAt || '',
      });
    }
  }

  return { searches, snapshots };
}

/**
 * Parse a single CSV line respecting quoted fields (RFC 4180).
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

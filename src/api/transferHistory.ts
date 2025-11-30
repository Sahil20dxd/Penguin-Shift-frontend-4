// src/api/transferHistory.ts

import { apiJson } from '@/components/shift/apiClient';
import type {
  TransferHistoryResponse,
  TransferHistoryDetailResponse,
  TransferHistoryTrackResponse,
} from '@/types/transferHistory';

import { getApiBase } from '@/utils/apiConfig'

const API_BASE = getApiBase()

// Removed localStorage token access for security - rely on HTTP-only cookies only
// Tokens are stored in HTTP-only cookies by the backend
function getAuthToken(): string {
  // Return empty string - authentication is handled via HTTP-only cookies
  // Backend will validate the cookie automatically when credentials: 'include' is used
  return '';
}

/**
 * Get all transfer history for the authenticated user
 */
export async function getTransferHistory(): Promise<TransferHistoryResponse[]> {
  const data = await apiJson('/api/transfer-history', {
    method: 'GET',
  });
  return data as TransferHistoryResponse[];
}

/**
 * Get detailed transfer history including all tracks
 */
export async function getTransferHistoryDetails(
  id: number
): Promise<TransferHistoryDetailResponse> {
  const data = await apiJson(`/api/transfer-history/${id}`, {
    method: 'GET',
  });
  return data as TransferHistoryDetailResponse;
}

/**
 * Get only the tracks for a specific transfer
 */
export async function getTransferHistoryTracks(
  id: number
): Promise<TransferHistoryTrackResponse[]> {
  const data = await apiJson(`/api/transfer-history/${id}/tracks`, {
    method: 'GET',
  });
  return data as TransferHistoryTrackResponse[];
}

/**
 * Get the total count of transfers for the authenticated user
 */
export async function getTransferHistoryCount(): Promise<number> {
  const data = await apiJson('/api/transfer-history/count', {
    method: 'GET',
  });
  return data as number;
}

/**
 * Download CSV export of all matched tracks for a transfer
 * Endpoint: GET /api/transfer-history/{id}/export/csv
 * Authentication: Requires authenticated user (JWT token)
 * Request Headers: Authorization: Bearer <token>, Content-Type: application/json
 * Response: text/csv with filename "transfer-{id}-tracks.csv"
 */
export async function downloadTransferHistoryCSV(id: number): Promise<void> {
  const token = getAuthToken();

  const requestUrl = `${API_BASE}/api/transfer-history/${id}/export/csv`;
  // Logging removed for production

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Only add Authorization header if token exists (supports cookie-based auth too)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers,
    credentials: 'include', // Always include credentials for cookie-based auth
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 404) {
      throw new Error(`No tracks found for transfer history ID ${id}`);
    }
    throw new Error(`Failed to download CSV: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `transfer-${id}-tracks.csv`; // Default filename matching backend

  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  // CSV download completed

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download PDF export of all matched tracks for a transfer
 * Endpoint: GET /api/transfer-history/{id}/export/pdf
 * Authentication: Requires authenticated user (JWT token)
 * User must own the transfer history record (validated in service layer)
 * Request Headers: Authorization: Bearer <token>
 * Response: application/pdf with filename "transfer-{id}-tracks.pdf"
 */
export async function downloadTransferHistoryPDF(id: number): Promise<void> {
  const token = getAuthToken();

  const requestUrl = `${API_BASE}/api/transfer-history/${id}/export/pdf`;
  // Logging removed for production

  const headers: HeadersInit = {};

  // Only add Authorization header if token exists (supports cookie-based auth too)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers,
    credentials: 'include', // Always include credentials for cookie-based auth
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error('You do not have permission to download this transfer history.');
    }
    if (response.status === 404) {
      throw new Error(`No tracks found for transfer history ID ${id}`);
    }
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `transfer-${id}-tracks.pdf`; // Default filename matching backend

  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  // PDF download completed

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get tracks for a specific transfer by transfer history ID
 * Used to display tracks in public playlist details
 */
export async function getTransferHistoryTracksByTransferId(
  transferId: number
): Promise<TransferHistoryTrackResponse[]> {
  try {
    const data = await apiJson(`/api/transfer-history/${transferId}/tracks`, {
      method: 'GET',
    });
    return data as TransferHistoryTrackResponse[];
  } catch (error: any) {
    console.error('[API] Error fetching tracks for transfer ID', transferId, ':', error);
    throw error;
  }
}

/**
 * Toggle the visibility (public/private) of a transfer history record.
 * 
 * PATCH /api/transfer-history/{id}/visibility
 * Request body: { "isPublic": boolean }
 * Response: Updated TransferHistoryResponse
 */
export async function toggleTransferHistoryVisibility(
  id: number,
  isPublic: boolean
): Promise<TransferHistoryResponse> {
  try {
    const data = await apiJson(`/api/transfer-history/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
    return data as TransferHistoryResponse;
  } catch (error: any) {
    console.error('[API] Error toggling visibility for transfer history ID', id, ':', error);
    throw error;
  }
}


// src/pages/Shift/TransferResults.tsx
// --------------------------------------------------------------------
// Shows transfer progress and results; handles downloads. Typed safely.
// --------------------------------------------------------------------
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  Download,
  FileText,
  CheckCircle,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { useShift } from "@/components/shift/ShiftContext";
import {
  getTransferStatus,
  downloadFile,
  downloadUnmatched,
} from "@/components/shift/apiClient";

// Result type - matches backend response
type TransferResult = {
  id?: number;
  transferId?: number;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "RUNNING";
  percent?: number;
  phase?: string;
  matched?: number;
  unmatched?: number;
  total?: number;
  processed?: number;
  createdPlaylistId?: string;
  destinationPlaylistId?: string;
  // Legacy progress/summary structure (if backend uses it)
  progress?: {
    percent: number;
    processed: number;
    total: number;
    phase: string;
  };
  summary?: {
    matched: number;
    unmatched: number;
    destinationPlaylistId?: string;
  };
};

export default function TransferResults() {
  const navigate = useNavigate();
  const { transferId, resetState } = useShift();
  const { showToast } = useToast();

  const [transfer, setTransfer] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollHandle = useRef<number | null>(null);
  const shouldStopPollingRef = useRef<boolean>(false);

  if (transferId == null) {
    navigate(createPageUrl("SelectPlaylist"));
    return null;
  }
  const transferIdNum: number = transferId;

  // -------------------------------
  // Poll transfer status
  // -------------------------------
  useEffect(() => {
    let cancelled = false;
    shouldStopPollingRef.current = false; // Reset on mount

    const poll = async () => {
      if (cancelled || shouldStopPollingRef.current) {
        console.log('[TransferResults] ⏹️ Polling stopped (cancelled or terminal state reached)');
        if (pollHandle.current) {
          clearInterval(pollHandle.current);
          pollHandle.current = null;
        }
        return;
      }

      try {
        console.log('[TransferResults] Polling status for transfer ID:', transferIdNum);

        const result = (await getTransferStatus(
          transferIdNum
        )) as TransferResult;

        console.log('[TransferResults] Received status:', result);

        setTransfer(result);

        // Handle status - check both FAILED and IN_PROGRESS (common backend statuses)
        const status = result.status;

        if (status === "FAILED") {
          console.log('[TransferResults] ❌ Transfer FAILED - stopping polling');
          shouldStopPollingRef.current = true; // Set ref
          // Don't set error here - let the UI show the FAILED status message
          showToast(
            "Your playlist transfer failed. Please try again.",
            "error"
          );
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }
          return; // Exit immediately
        } else if (status === "COMPLETED") {
          console.log('[TransferResults] ✅ Transfer COMPLETED - stopping polling');
          shouldStopPollingRef.current = true; // Set ref
          showToast("Your playlist transfer finished successfully!", "success");
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }
          return; // Exit immediately
        } else if (status === "IN_PROGRESS" || status === "RUNNING" || status === "PENDING") {
          console.log('[TransferResults] Transfer in progress:', {
            phase: result.phase || result.progress?.phase,
            percent: result.percent || result.progress?.percent,
            processed: result.processed || result.progress?.processed,
            total: result.total || result.progress?.total
          });
        }
      } catch (err: any) {
        console.error("Error polling transfer status:", err);

        const msg = String(err?.message || "");

        // --- Detect expired Spotify token or auth error ---
        if (
          msg.includes("401") ||
          msg.toLowerCase().includes("spotify authorization") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          console.log('[TransferResults] ❌ Auth error - stopping polling');
          shouldStopPollingRef.current = true; // Set ref

          // Note: Tokens are now stored in HTTP-only cookies (not accessible to JS)
          // Backend will handle token cleanup on logout/expiry

          setError(
            "Your connection has expired. Please reconnect your account."
          );
          showToast(
            "Your connection expired. Please reconnect.",
            "error"
          );

          // stop polling
          if (pollHandle.current) {
            clearInterval(pollHandle.current);
            pollHandle.current = null;
          }

          // redirect user to reconnect page
          navigate(createPageUrl("Reconnect"));
          return;
        }

        // --- Generic network or unknown error fallback ---
        console.log('[TransferResults] ❌ Network error - stopping polling');
        shouldStopPollingRef.current = true; // Set ref

        setError(
          "We couldn't update your transfer status. Please check your connection or try again shortly."
        );
        if (pollHandle.current) {
          clearInterval(pollHandle.current);
          pollHandle.current = null;
        }
        return; // Exit immediately to stop polling
      }
    };

    // Initial poll - wait for it to complete before setting up interval
    poll().then(() => {
      // Only set up interval if polling should continue (transfer not failed/completed)
      if (!shouldStopPollingRef.current && !cancelled) {
        // ⬇️ then keep polling
        pollHandle.current = window.setInterval(() => {
          // Check ref before each poll to stop if transfer failed/completed
          if (shouldStopPollingRef.current || cancelled) {
            if (pollHandle.current) {
              clearInterval(pollHandle.current);
              pollHandle.current = null;
            }
            return;
          }
          poll();
        }, 2000);
      }
    }).catch((err) => {
      console.error('[TransferResults] Initial poll failed:', err);
      // Don't set up interval if initial poll fails
    });

    return () => {
      cancelled = true;
      shouldStopPollingRef.current = true;
      if (pollHandle.current) {
        clearInterval(pollHandle.current);
        pollHandle.current = null;
      }
    };
  }, [transferIdNum, showToast, navigate]);
  // -------------------------------
  // Handlers
  // -------------------------------
  const handleDownload = async (type: "csv" | "pdf") => {
    try {
      await downloadFile(transferIdNum, type);
    } catch (err) {
      console.error(`Error downloading ${type}:`, err);
      setError(
        `We couldn’t download the ${type.toUpperCase()} file right now. Please try again later.`
      );
    }
  };

  const handleDownloadUnmatched = async () => {
    try {
      await downloadUnmatched(transferIdNum);
    } catch (err) {
      console.error("Error downloading unmatched songs:", err);
      setError(
        "We couldn’t download the unmatched songs list right now. Please try again later."
      );
    }
  };

  const handleNewShift = () => {
    resetState();
    navigate(createPageUrl("SelectPlaylist"));
  };

  // -------------------------------
  // UI States
  // -------------------------------
  if (error && !transfer) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-6 flex items-center justify-center"
      >
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center border border-gray-200"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Transfer Error
            </h2>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleNewShift} variant="outline" size="lg">
                Start New Transfer
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!transfer) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-6 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
          </motion.div>
          <p className="text-gray-600 text-lg">Loading transfer details...</p>
        </div>
      </motion.div>
    );
  }

  const isInProgress =
    transfer.status === "PENDING" ||
    transfer.status === "RUNNING" ||
    transfer.status === "IN_PROGRESS";
  const isCompleted = transfer.status === "COMPLETED";

  // Helper functions to access data from either nested or flat structure
  const getPercent = () => transfer.percent ?? transfer.progress?.percent ?? 0;
  const getPhase = () => transfer.phase ?? transfer.progress?.phase ?? "Processing";
  const getProcessed = () => transfer.processed ?? transfer.progress?.processed ?? 0;
  const getTotal = () => transfer.total ?? transfer.progress?.total ?? 0;
  const getMatched = () => transfer.matched ?? transfer.summary?.matched ?? 0;
  const getUnmatched = () => transfer.unmatched ?? transfer.summary?.unmatched ?? 0;

  const banner =
    transfer.status === "FAILED" ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="alert"
        className="mb-6 p-4 md:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-sm font-bold">!</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-red-800 font-semibold mb-2">
              Your playlist shift failed. Please reconnect your account and try again.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Reconnect"))}
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Reconnect Account
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    ) : transfer.status === "COMPLETED" ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
        className="mb-6 p-4 md:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-sm font-bold">✓</span>
            </div>
          </div>
          <p className="text-green-800 font-semibold">
            ✅ Your playlist transfer finished successfully.
            {(getMatched() > 0 || getUnmatched() > 0) && (
              <span className="ml-2 font-normal">
                Matched {getMatched()} / {getMatched() + getUnmatched()} songs.
              </span>
            )}
          </p>
        </div>
      </motion.div>
    ) : null;

  // -------------------------------
  // Main render
  // -------------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isInProgress
              ? "Transfer in Progress"
              : isCompleted
              ? "Transfer Complete"
              : "Transfer Failed"}
          </h1>
          <p className="text-gray-600">
            {isInProgress
              ? "Your playlists are being transferred..."
              : "Transfer Summary & Results"}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mb-6 p-4 md:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <p className="text-red-800 font-semibold flex-1">{error}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-200"
        >
          {banner}
          {transfer.status === "FAILED" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              role="alert"
              className="mb-6 p-4 md:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg"
            >
              <p className="text-red-800 font-semibold mb-2">Transfer Failed</p>
              <p className="text-red-700 text-sm mb-4">
                Your playlist transfer failed. Please try again or reconnect your account.
              </p>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("SelectPlaylist"))}
                  >
                    Start New Transfer
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {isInProgress && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <div>
                    <p className="font-semibold text-lg">
                      {getPhase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getProcessed()} of {getTotal()} songs
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getPercent()}%` }}
                />
              </div>
              <p className="text-center text-gray-600 text-sm">
                {getPercent()}% complete
              </p>
            </>
          )}

          {isCompleted && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎵</div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-4xl">🎬</div>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              {(getMatched() > 0 || getUnmatched() > 0) && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-xl font-semibold mb-2">
                      Transfer Complete
                    </p>
                    <p className="text-gray-600">
                      {getMatched() + getUnmatched()} Songs
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {getMatched()}
                      </p>
                      <p className="text-sm text-gray-600">Matched</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">
                        {getUnmatched()}
                      </p>
                      <p className="text-sm text-gray-600">Unmatched</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {getMatched() + getUnmatched()}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload("csv")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload("pdf")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    {getUnmatched() > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleDownloadUnmatched}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Unmatched Songs
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        <div className="flex justify-center gap-3">
          <Button
            size="lg"
            onClick={handleNewShift}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
          >
            New Transfer
          </Button>
          <Link to={createPageUrl("Dashboard")}>
            <Button size="lg" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, CheckCircle, XCircle, FileText, User, Mail, Calendar, Stethoscope, ClipboardList, Download } from 'lucide-react';

interface VerificationDetailProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    phone?: string;
    area?: string;
    document?: {
      fileName: string;
      publicUrl: string;
      uploadedAt: string;
    } | null;
    hasDocument?: boolean;
  };
  onClose: () => void;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason?: string) => Promise<void>;
  accessToken: string;
}

export function VerificationDetail({ user, onClose, onApprove, onReject, accessToken }: VerificationDetailProps) {
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleApprove = async () => {
    if (!confirm('Approve this user?')) return;
    setIsProcessing(true);
    try {
      await onApprove(user.id);
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve user. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(user.id, rejectReason || undefined);
      setShowRejectDialog(false);
      onClose();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject user. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'assistant': return <ClipboardList className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = () => {
    switch (user.role) {
      case 'doctor': return 'bg-green-100 text-green-700';
      case 'assistant': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isImage = user.document?.publicUrl && (
    user.document.publicUrl.toLowerCase().endsWith('.jpg') ||
    user.document.publicUrl.toLowerCase().endsWith('.jpeg') ||
    user.document.publicUrl.toLowerCase().endsWith('.png') ||
    user.document.fileType?.startsWith('image/')
  );

  const isPDF = user.document?.publicUrl && (
    user.document.publicUrl.toLowerCase().endsWith('.pdf') ||
    user.document.fileType === 'application/pdf'
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showRejectDialog) onClose();
      if (e.key === '+' || e.key === '=') { e.preventDefault(); handleZoomIn(); }
      if (e.key === '-') { e.preventDefault(); handleZoomOut(); }
      if (e.key === '0') { e.preventDefault(); handleResetZoom(); }
    };
    if (!showRejectDialog) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [showRejectDialog]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Simple Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleColor()}`}>
                {getRoleIcon()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content - Simple Layout */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: User Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Role</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium ${getRoleColor()}`}>
                          {getRoleIcon()}
                          {user.role === 'doctor' ? 'Doctor' : user.role === 'assistant' ? 'Medical Assistant' : user.role}
                        </span>
                      </div>
                    </div>
                    {user.phone && (
                      <div>
                        <label className="text-xs text-gray-500">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
                      </div>
                    )}
                    {user.area && (
                      <div>
                        <label className="text-xs text-gray-500">Service Area</label>
                        <p className="mt-1 text-sm text-gray-900">{user.area}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500">Registered</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Document Status</label>
                      <div className="mt-1">
                        {(user.hasDocument || user.document) ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                            <FileText className="w-4 h-4" />
                            Document Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-yellow-600">
                            <FileText className="w-4 h-4" />
                            No Document
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Document Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Verification Document</h3>
                  {user.document && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-600 min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleResetZoom}
                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        title="Reset"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[400px] flex items-center justify-center">
                  {user.document ? (
                    <div className="w-full h-full flex items-center justify-center">
                      {isImage && !imageError ? (
                        <img
                          src={user.document.publicUrl}
                          alt={user.document.fileName}
                          className="max-w-full max-h-[500px] object-contain rounded shadow-sm"
                          style={{ transform: `scale(${zoom})` }}
                          onError={() => setImageError(true)}
                        />
                      ) : isPDF ? (
                        <div className="w-full h-full min-h-[500px]">
                          <iframe
                            src={user.document.publicUrl}
                            className="w-full h-full border-0 rounded"
                            title={user.document.fileName}
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-3">{user.document.fileName}</p>
                          <a
                            href={user.document.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No document uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Simple Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing || (!user.hasDocument && !user.document)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Simple Reject Dialog */}
        <AnimatePresence>
          {showRejectDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 flex items-center justify-center bg-black/60"
              onClick={() => !isProcessing && setShowRejectDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject User</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Reject <span className="font-medium">{user.name}</span>? You can provide an optional reason.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
                    rows={3}
                    disabled={isProcessing}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRejectDialog(false)}
                    disabled={isProcessing}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Reject'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}


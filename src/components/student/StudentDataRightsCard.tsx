import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, Mail, ExternalLink, Loader2, AlertTriangle, CheckCircle2, FileText, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';

export const StudentDataRightsCard: React.FC = () => {
  const { session, profile } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [parentEmailInput, setParentEmailInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState(false);

  const studentName = profile?.full_name || 'Student';
  const studentEmail = session?.user?.email || profile?.phone || 'student@scholario.pk';
  const studentId = profile?.id || session?.user?.id || 'N/A';

  // ── Handle Data Export ──────────────────────────────────────────────
  const handleExportData = async () => {
    setExporting(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/account/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: studentId }),
      });

      if (!res.ok) {
        throw new Error('Failed to export data from server.');
      }

      const data = await res.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scholario_academic_data_${profile?.roll_number || 'student'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Your academic data file has been generated and downloaded.');
    } catch (err: any) {
      console.warn('Data export fallback warning:', err);
      // Fallback: construct local client export
      const localData = {
        institution: 'SHS Virtual Academy',
        exported_at: new Date().toISOString(),
        student_profile: {
          name: studentName,
          email: studentEmail,
          phone: profile?.phone,
          board: profile?.board_id,
          class: profile?.class,
          enrolled_subjects: profile?.subjects || [],
        },
        compliance_notice: 'Official student record exported under Scholario Privacy Policy.',
        support_email: 'shs.academy.virtual@gmail.com',
      };
      const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scholario_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Downloaded academic profile summary.');
    } finally {
      setExporting(false);
    }
  };

  // ── Handle Account Deletion Request ─────────────────────────────────
  const handleSubmitDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/account/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: studentId,
          parent_email: parentEmailInput.trim() || undefined,
          reason: deleteReason.trim() || 'Voluntary student account deletion request',
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned error while registering deletion request.');
      }

      setDeleteCompleted(true);
      toast.success('Account deletion request submitted. Parent & administration notified.');
    } catch (err: any) {
      console.error('Account deletion error:', err);
      toast.error(err.message || 'Could not submit deletion request automatically. Please email administration.');
    } finally {
      setIsDeleting(false);
    }
  };

  const mailtoDataRequest = `mailto:shs.academy.virtual@gmail.com?subject=${encodeURIComponent(
    `Official Academic Data Request - ${studentName} (#${studentId.slice(0, 8)})`
  )}&body=${encodeURIComponent(
    `Dear SHS Virtual Academy Administration,\n\nI am requesting a full certified copy of my academic records and personal data stored on Scholario LMS.\n\nStudent Name: ${studentName}\nStudent Email: ${studentEmail}\nStudent ID: ${studentId}\n\nPlease send the verified data record to this email address.\n\nSincerely,\n${studentName}`
  )}`;

  const mailtoDeletionRequest = `mailto:shs.academy.virtual@gmail.com?subject=${encodeURIComponent(
    `Permanent Account & Data Deletion Request - ${studentName} (#${studentId.slice(0, 8)})`
  )}&body=${encodeURIComponent(
    `Dear SHS Virtual Academy Data Protection Officer,\n\nI hereby formally request the permanent deletion of my Scholario LMS account and associated student data in accordance with the Scholario Privacy Policy.\n\nStudent Name: ${studentName}\nRegistered Email: ${studentEmail}\nStudent ID: ${studentId}\nParent/Guardian Contact: ${parentEmailInput || 'Pending verification'}\nReason for Deletion: ${deleteReason || 'Course completed / No longer enrolled'}\n\nI understand that my uploaded exam attachments and chat media in Cloudflare R2 will be purged, and access to FBISE / Cambridge study materials will be revoked.\n\nSincerely,\n${studentName}`
  )}`;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#D4A017] flex items-center justify-center">
            <Lock size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111111]">Data Rights & Account Privacy</h3>
            <p className="text-[11px] text-[#737373]">
              Manage your academic data export, review privacy terms, or submit an account deletion request.
            </p>
          </div>
        </div>
        <Link
          to="/privacy"
          target="_blank"
          className="text-xs font-bold text-[#D4A017] hover:underline flex items-center gap-1"
        >
          <span>Privacy Policy</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Minor Protection Notice */}
      <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-start gap-2.5 text-xs text-[#525252]">
        <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Minors' Data Protection:</strong> Scholario strictly complies with educational data minimization principles. We do not sell student data, use advertising cookies, or retain exam papers longer than required for academic evaluation.
        </p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Request My Data */}
        <div className="p-4 rounded-xl border border-[#E5E5E5] hover:border-[#D4D4D4] bg-white flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Download size={16} className="text-[#111111]" />
              <h4 className="text-xs font-bold text-[#111111]">Export Academic Data</h4>
            </div>
            <p className="text-[11px] text-[#737373] leading-relaxed">
              Download a machine-readable JSON copy of your enrolled courses, test marks, and attendance records.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportData}
              className="flex-1 px-3 py-2 rounded-xl bg-[#111111] text-white hover:bg-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 interactive"
            >
              {exporting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Exporting…</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Download File</span>
                </>
              )}
            </button>

            <a
              href={mailtoDataRequest}
              className="px-3 py-2 rounded-xl border border-[#E5E5E5] hover:bg-[#FAFAFA] text-xs font-bold text-[#525252] flex items-center gap-1"
              title="Email Admin for Certified Record"
            >
              <Mail size={13} />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Delete Account */}
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/20 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trash2 size={16} className="text-red-600" />
              <h4 className="text-xs font-bold text-red-950">Delete My Account</h4>
            </div>
            <p className="text-[11px] text-red-900/80 leading-relaxed">
              Submit a formal request to purge your account, revoke course access, and delete uploaded files from Cloudflare R2.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteCompleted(false);
            }}
            className="w-full px-3 py-2 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs interactive"
          >
            <Trash2 size={13} />
            <span>Request Account Deletion</span>
          </button>
        </div>
      </div>

      {/* Legal Links Bar */}
      <div className="pt-2 border-t border-[#F5F5F5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
        <span className="text-[11px]">Academic Session 2026–2027 • SHS Virtual Academy</span>
        <div className="flex items-center gap-3 font-semibold">
          <Link to="/privacy" target="_blank" className="hover:text-[#111111]">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" target="_blank" className="hover:text-[#111111]">Terms of Service</Link>
          <span>•</span>
          <Link to="/refund" target="_blank" className="hover:text-[#111111]">Refund Policy</Link>
          <span>•</span>
          <Link to="/cookies" target="_blank" className="hover:text-[#111111]">Cookie Policy</Link>
        </div>
      </div>

      {/* ── Deletion Modal ────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5E5] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">
                  Student Account Deletion Request
                </h3>
                <p className="text-xs text-[#737373]">
                  Minors' Data Protection & Erasure Procedure
                </p>
              </div>
            </div>

            {deleteCompleted ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#111111]">Deletion Request Logged</h4>
                  <p className="text-xs text-[#525252] mt-1 max-w-sm mx-auto leading-relaxed">
                    Your request has been queued. R2 chat attachments and test drafts have been designated for removal. An email notification has been dispatched to <strong>shs.academy.virtual@gmail.com</strong> for administrative validation.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeletionRequest} className="space-y-3.5">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
                  <span className="font-bold block">Important Notice for Minor Students:</span>
                  <p className="text-[11px]">
                    Under the <em>Punjab Consumer Protection Act 2005</em> and educational regulations, minor student deletion requests must provide a verified parent or legal guardian contact for notification before permanent grade removal.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Parent / Guardian Email (For Minor Verification)
                  </label>
                  <input
                    type="email"
                    value={parentEmailInput}
                    onChange={(e) => setParentEmailInput(e.target.value)}
                    placeholder="parent@example.com"
                    className="input text-xs w-full py-2 bg-white"
                  />
                  <p className="text-[10px] text-[#737373] mt-1">
                    Required if you are under 18 years of age.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Switched boards, graduated, or withdrawing from FBISE term"
                    className="input text-xs w-full py-2 bg-white resize-none"
                  />
                </div>

                <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-[11px] text-[#737373] space-y-1">
                  <span className="font-bold text-[#111111] block">What gets deleted?</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>R2 Chat Attachments & voice note audio recordings</li>
                    <li>Uploaded test answer sheets and scholarship marksheets</li>
                    <li>Active live class timetable enrollments & attendance history</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#FAFAFA]"
                  >
                    Cancel
                  </button>

                  <a
                    href={mailtoDeletionRequest}
                    className="px-3.5 py-2.5 rounded-xl border border-red-300 text-red-700 bg-red-50 text-xs font-bold flex items-center gap-1.5"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Mail size={13} />
                    <span>Email Admin Directly</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Submitting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Confirm Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

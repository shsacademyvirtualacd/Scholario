import React, { useState, useEffect } from 'react';
import type { ClassOffering } from '../../../types';

interface NoteUploadFormProps {
  offerings: ClassOffering[];
  onUpload: (data: {
    offering_id: string;
    chapter_name: string;
    title: string;
    file_url: string;
    file_type: 'pdf' | 'image';
  }) => void;
  onCancel: () => void;
}

export const NoteUploadForm: React.FC<NoteUploadFormProps> = ({
  offerings,
  onUpload,
  onCancel,
}) => {
  const [offeringId, setOfferingId] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [fileType, setFileType] = useState<'pdf' | 'image'>('pdf');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (offerings.length > 0) {
      setOfferingId(offerings[0].id);
    }
  }, [offerings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!offeringId) {
      setError('Please select a subject offering.');
      return;
    }
    if (!chapterName.trim()) {
      setError('Please enter a chapter name.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a note title.');
      return;
    }
    if (!fileUrl.trim()) {
      setError('Please enter a file URL.');
      return;
    }

    onUpload({
      offering_id: offeringId,
      chapter_name: chapterName.trim(),
      title: title.trim(),
      file_url: fileUrl.trim(),
      file_type: fileType,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Offering Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Subject & Class Offering</label>
        <select
          value={offeringId}
          onChange={(e) => setOfferingId(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          <option value="" disabled>Select an offering...</option>
          {offerings.map((offering) => (
            <option key={offering.id} value={offering.id}>
              {offering.subject} (Grade {offering.grade} - {offering.board.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Chapter Name */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Chapter Name / Topic</label>
        <input
          type="text"
          placeholder="e.g. Chapter 4 — Algebraic Expressions"
          value={chapterName}
          onChange={(e) => setChapterName(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Note Title</label>
        <input
          type="text"
          placeholder="e.g. Algebraic Formulas Cheat Sheet"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Mock File URL */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">File Link (Mock Upload)</label>
        <input
          type="text"
          placeholder="Enter a PDF/Image URL"
          value={fileUrl}
          onChange={(e) => {
            setFileUrl(e.target.value);
            // Auto detect type if URL contains keywords
            const lower = e.target.value.toLowerCase();
            if (lower.match(/\.(jpg|jpeg|png|gif|webp)/)) {
              setFileType('image');
            } else {
              setFileType('pdf');
            }
          }}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl font-mono text-[11px]"
        />
        <span className="text-[10px] text-[#A3A3A3] font-medium block mt-0.5">
          *Real Supabase Storage file upload will be integrated in Batch 4.
        </span>
      </div>

      {/* File Type Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#525252] block font-semibold">Document Format</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFileType('pdf')}
            className={`py-2 text-xs font-bold border rounded-xl text-center transition-all ${
              fileType === 'pdf'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#525252]'
            }`}
          >
            PDF Document
          </button>
          <button
            type="button"
            onClick={() => setFileType('image')}
            className={`py-2 text-xs font-bold border rounded-xl text-center transition-all ${
              fileType === 'image'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#525252]'
            }`}
          >
            Image Asset
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F5F5] mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold px-5 py-2 rounded-xl"
        >
          Upload Document
        </button>
      </div>
    </form>
  );
};

export default NoteUploadForm;

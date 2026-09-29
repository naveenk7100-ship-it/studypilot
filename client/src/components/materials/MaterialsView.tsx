import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  HelpCircle,
  Layers,
  GraduationCap,
  Trash2,
  MessageSquare,
  Search,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { ProcessedDocument } from '../../types';
import { uploadDocument } from '../../services/api';
import { StorageService } from '../../services/storage';
import { Modal } from '../common/Modal';

interface MaterialsViewProps {
  documents: ProcessedDocument[];
  onDocumentAdded: (doc: ProcessedDocument) => void;
  onDocumentDeleted: (id: string) => void;
  onAskAboutDocument: (doc: ProcessedDocument) => void;
  onGenerateQuizFromDoc: (doc: ProcessedDocument) => void;
  onGenerateFlashcardsFromDoc: (doc: ProcessedDocument) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  documents,
  onDocumentAdded,
  onDocumentDeleted,
  onAskAboutDocument,
  onGenerateQuizFromDoc,
  onGenerateFlashcardsFromDoc
}) => {
  const [selectedDoc, setSelectedDoc] = useState<ProcessedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'concepts' | 'definitions' | 'formulas' | 'questions' | 'chapters'>('summary');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processSelectedFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const processed = await uploadDocument(file);
      onDocumentAdded(processed);
      setSelectedDoc(processed);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.concepts.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Study Materials Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload course slides, syllabus, textbook chapters (PDF, DOCX, TXT) for real grounded AI extraction.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Processing File...' : 'Upload Document'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isUploading
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse'
            : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-white dark:bg-slate-900/60'
        }`}
      >
        <div className="max-w-md mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isUploading ? 'Extracting Text & Generating Study Artifacts...' : 'Drop files here or click to browse'}
          </h3>
          <p className="text-xs text-slate-400">
            Supports PDF, Word (.docx), Plain Text (.txt), and Markdown (.md) up to 25 MB
          </p>
        </div>
      </div>

      {/* Document Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded materials or extracted concepts..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-hidden focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400 shrink-0">
          {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm">No documents found. Upload your first lecture notes or syllabus above!</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {doc.fileName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase text-[10px]">
                          {doc.fileType}
                        </span>
                        <span>•</span>
                        <span>{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Processed</span>
                  </span>
                </div>

                {/* Summary Snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {doc.summary || 'Document parsed and ready for contextual tutoring.'}
                </p>

                {/* Concept Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.concepts.slice(0, 4).map((concept, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {concept}
                    </span>
                  ))}
                  {doc.concepts.length > 4 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{doc.concepts.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Breakdown</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAskAboutDocument(doc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </button>

                  <button
                    onClick={() => onDocumentDeleted(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Document Modal */}
      {selectedDoc && (
        <Modal
          isOpen={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          title={`Document Insights: ${selectedDoc.fileName}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>{selectedDoc.pageCount} pages • {selectedDoc.fileType} • {Math.round(selectedDoc.fileSize / 1024)} KB</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onAskAboutDocument(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI About This Doc</span>
                </button>
                <button
                  onClick={() => {
                    onGenerateQuizFromDoc(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Quiz from Doc</span>
                </button>
                <button
                  onClick={() => {
                    onGenerateFlashcardsFromDoc(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flashcards from Doc</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside modal */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'concepts', label: `Concepts (${selectedDoc.concepts.length})` },
                { id: 'definitions', label: `Definitions (${selectedDoc.definitions.length})` },
                { id: 'formulas', label: `Formulas (${selectedDoc.formulas.length})` },
                { id: 'questions', label: `Study Questions (${selectedDoc.questions.length})` },
                { id: 'chapters', label: `Chapters (${selectedDoc.chapters.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-4 min-h-[220px]">
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Executive Document Summary</h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedDoc.summary}
                  </div>
                </div>
              )}

              {/* Concepts Tab */}
              {activeTab === 'concepts' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Extracted Key Concepts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedDoc.concepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{concept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Definitions Tab */}
              {activeTab === 'definitions' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Academic Definitions</h4>
                  <div className="space-y-2">
                    {selectedDoc.definitions.map((def, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs"
                      >
                        <div className="font-bold text-blue-600 dark:text-blue-400">{def.term}</div>
                        <div className="text-slate-600 dark:text-slate-300">{def.definition}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas Tab */}
              {activeTab === 'formulas' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Key Formulas & Rules</h4>
                  {selectedDoc.formulas.length === 0 ? (
                    <p className="text-xs text-slate-400">No explicit formulas detected in this text.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDoc.formulas.map((form, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto"
                        >
                          {form}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Study Questions Tab */}
              {activeTab === 'questions' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Exam Study Questions</h4>
                  <div className="space-y-2">
                    {selectedDoc.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{q.question}</div>
                        <div className="text-[11px] text-slate-400">{q.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chapters Tab */}
              {activeTab === 'chapters' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Chapter & Topic Breakdown</h4>
                  <div className="space-y-2">
                    {selectedDoc.chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{ch.title}</div>
                          <div className="text-slate-400 text-[11px]">{ch.summary}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Est. Page {ch.estimatedPage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

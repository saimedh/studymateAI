import React, { useState, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { StudyMaterial, SmartSummary } from '../../types';
import {
  FileText,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  HelpCircle,
  Layers,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
  ArrowRight,
  Download,
  Copy,
  Check
} from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const {
    materials,
    subjects,
    selectedSubjectId,
    addMaterial,
    deleteMaterial,
    updateMaterial,
    setActiveTab,
    setSelectedMaterialForAction,
    addFlashcards
  } = useStudy();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active Summary Modal
  const [activeSummaryModal, setActiveSummaryModal] = useState<{
    material: StudyMaterial;
    summary: SmartSummary;
  } | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<string | null>(null);
  const [summaryMode, setSummaryMode] = useState<'short' | 'detailed' | 'exam'>('detailed');
  const [copiedKey, setCopiedKey] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-neutral-900" />;
      case 'docx':
      case 'doc':
        return <FileCode className="w-5 h-5 text-neutral-900" />;
      case 'pptx':
      case 'ppt':
        return <FileSpreadsheet className="w-5 h-5 text-neutral-900" />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <ImageIcon className="w-5 h-5 text-neutral-900" />;
      default:
        return <FileText className="w-5 h-5 text-neutral-900" />;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
      let fileType: StudyMaterial['fileType'] = 'txt';
      if (ext === 'pdf') fileType = 'pdf';
      else if (['doc', 'docx'].includes(ext)) fileType = 'docx';
      else if (['ppt', 'pptx'].includes(ext)) fileType = 'pptx';
      else if (['png', 'jpg', 'jpeg'].includes(ext)) fileType = 'image';

      // Read file
      let rawText = '';
      let base64Data = '';

      if (['txt', 'md', 'csv'].includes(ext)) {
        rawText = await file.text();
      } else {
        // Read as base64 for multimodal Gemini processing
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || '');
          };
          reader.readAsDataURL(file);
        });
      }

      // Call server to parse material with Gemini
      const parseResp = await fetch('/api/ai/parse-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          fileType,
          rawText,
          base64Data,
          mimeType: file.type
        })
      });

      if (!parseResp.ok) {
        throw new Error('Failed to parse document with Gemini');
      }

      const parseData = await parseResp.json();

      addMaterial({
        subjectId: selectedSubjectId || 'subj_ai',
        filename: file.name,
        originalName: file.name,
        fileType,
        fileSize: file.size,
        status: 'ready',
        extractedText: parseData.extractedText || `Lecture notes extracted from ${file.name}`,
        topicsCovered: parseData.topicsCovered || ['General Concepts']
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Error processing file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateSummary = async (material: StudyMaterial, mode: 'short' | 'detailed' | 'exam' = 'detailed') => {
    setIsGeneratingSummary(material.id);
    try {
      const resp = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialText: material.extractedText,
          materialName: material.originalName,
          summaryType: mode
        })
      });

      if (!resp.ok) throw new Error('Failed to generate summary');
      const data = await resp.json();

      const updatedMat: StudyMaterial = {
        ...material,
        summary: data.summary
      };
      updateMaterial(updatedMat);
      setActiveSummaryModal({ material: updatedMat, summary: data.summary });
    } catch (e: any) {
      alert(e.message || 'Could not generate summary');
    } finally {
      setIsGeneratingSummary(null);
    }
  };

  const handleGenerateFlashcardsFromMaterial = async (material: StudyMaterial) => {
    try {
      const resp = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: material.topicsCovered[0] || 'Core Concepts',
          materialText: material.extractedText,
          count: 5
        })
      });
      if (!resp.ok) throw new Error('Flashcard generation failed');
      const data = await resp.json();
      if (data.cards && data.cards.length > 0) {
        addFlashcards(data.cards.map((c: any) => ({
          subjectId: material.subjectId,
          topic: c.topic || material.topicsCovered[0] || 'General',
          front: c.front,
          back: c.back,
          difficulty: c.difficulty || 'medium',
          status: 'new',
          reviewCount: 0
        })));
        alert(`Successfully generated and added ${data.cards.length} flashcards to your deck!`);
        setActiveTab('flashcards');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate flashcards');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950 tracking-tight">Study Materials</h1>
          <p className="text-sm text-neutral-500">
            Upload PDFs, slides, and notes for Gemini to analyze and tutor you from
          </p>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-neutral-950 bg-neutral-100 scale-[1.01]'
            : 'border-neutral-300 bg-white hover:border-neutral-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.png,.jpg,.jpeg"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto shadow-xs border border-neutral-200">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-neutral-900" />
            ) : (
              <UploadCloud className="w-6 h-6 text-neutral-800" />
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-neutral-950">
              {isUploading ? 'Gemini is reading and parsing document...' : 'Upload study material'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Supports PDF, DOCX, PPTX, TXT, PNG, and JPG. Gemini will extract formulas and concepts.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="upload-material-btn"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-black disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
            >
              {isUploading ? 'Processing...' : 'Select File from Computer'}
            </button>
          </div>

          {uploadError && (
            <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-900 text-xs flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-neutral-700" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-950">
            Uploaded Materials ({subjectMaterials.length})
          </h2>
          <span className="text-xs text-neutral-500">
            Current Subject: <strong className="text-neutral-900">{currentSubject?.name || 'All'}</strong>
          </span>
        </div>

        {subjectMaterials.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200">
            <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800">No study materials in this subject yet</p>
            <p className="text-xs text-neutral-400 mt-1">Upload your syllabus, lecture slides, or textbook notes above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectMaterials.map((mat) => {
              const isSummarizing = isGeneratingSummary === mat.id;

              return (
                <div
                  key={mat.id}
                  className="rounded-xl bg-white border border-neutral-200 p-5 shadow-2xs hover:border-neutral-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200">
                          {getFileIcon(mat.fileType)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-neutral-950 truncate max-w-[240px] sm:max-w-xs">
                            {mat.originalName}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                            <span>{new Date(mat.uploadDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{(mat.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMaterial(mat.id)}
                        className="p-1 text-neutral-400 hover:text-neutral-900 transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Topics Covered */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {mat.topicsCovered.map((t) => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Extracted snippet */}
                    <p className="text-xs text-neutral-600 mt-3 line-clamp-2 bg-neutral-50 p-2.5 rounded-lg font-mono text-[11px] border border-neutral-100">
                      {mat.extractedText.slice(0, 160)}...
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        if (mat.summary) {
                          setActiveSummaryModal({ material: mat, summary: mat.summary });
                        } else {
                          handleGenerateSummary(mat, 'detailed');
                        }
                      }}
                      disabled={isSummarizing}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-950 text-white hover:bg-black transition-colors flex items-center gap-1.5"
                    >
                      {isSummarizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>{mat.summary ? 'View Summary' : 'Summarize'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMaterialForAction(mat);
                        setActiveTab('quiz');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-200"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Generate Quiz</span>
                    </button>

                    <button
                      onClick={() => handleGenerateFlashcardsFromMaterial(mat)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-200"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Flashcards</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMaterialForAction(mat);
                        setActiveTab('tutor');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors flex items-center gap-1.5 border border-neutral-200"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask Questions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          SMART SUMMARY MODAL
         ------------------------------------------------------------- */}
      {activeSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-neutral-200 text-neutral-900">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-neutral-950">
                    Smart Summary: {activeSummaryModal.material.originalName}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mt-1">Structured academic synthesis generated by Gemini</p>
              </div>

              <button
                onClick={() => setActiveSummaryModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-6 py-2.5 border-b border-neutral-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500 mr-1">Format:</span>
                {(['short', 'detailed', 'exam'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setSummaryMode(m);
                      handleGenerateSummary(activeSummaryModal.material, m);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      summaryMode === m
                        ? 'bg-neutral-950 text-white font-bold shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {m === 'short' ? 'Short' : m === 'detailed' ? 'Detailed' : 'Exam Ready'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(activeSummaryModal.summary, null, 2));
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-950 flex items-center gap-1 font-medium"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-neutral-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-800">
              {/* TL;DR */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-wider mb-1">Executive Summary</h4>
                <p className="text-sm text-neutral-800 leading-relaxed">{activeSummaryModal.summary.tldr}</p>
              </div>

              {/* Key Concepts */}
              {activeSummaryModal.summary.keyConcepts?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-neutral-900" />
                    Key Concepts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSummaryModal.summary.keyConcepts.map((kc, i) => (
                      <div key={i} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                        <p className="font-bold text-neutral-950 text-xs">{kc.title}</p>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{kc.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Definitions */}
              {activeSummaryModal.summary.definitions?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3">Academic Definitions</h4>
                  <div className="space-y-2">
                    {activeSummaryModal.summary.definitions.map((def, i) => (
                      <div key={i} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                        <strong className="text-neutral-950 font-bold">{def.term}: </strong>
                        <span className="text-neutral-600">{def.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Formulas */}
              {activeSummaryModal.summary.importantFormulas?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3">Important Formulas</h4>
                  <div className="space-y-2">
                    {activeSummaryModal.summary.importantFormulas.map((form, i) => (
                      <div key={i} className="p-3 bg-neutral-950 text-white rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-neutral-300">{form.name}</span>
                        </div>
                        <p className="font-mono text-xs text-neutral-100 bg-neutral-900 p-2 rounded">{form.formula}</p>
                        <p className="text-[11px] text-neutral-400 mt-1">{form.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Important Examples */}
              {activeSummaryModal.summary.importantExamples?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3">Important Examples</h4>
                  <div className="space-y-2">
                    {activeSummaryModal.summary.importantExamples.map((ex, i) => (
                      <div key={i} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                        <span className="font-bold text-neutral-950">{ex.topic}: </span>
                        <span className="text-neutral-700">{ex.example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam-Important Points */}
              {activeSummaryModal.summary.examImportantPoints?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3">
                    Exam-Important Points
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-neutral-800 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    {activeSummaryModal.summary.examImportantPoints.map((pt, i) => (
                      <li key={i} className="leading-relaxed">{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Mistakes */}
              {activeSummaryModal.summary.commonMistakes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 uppercase tracking-wide mb-3">
                    Common Mistakes & Corrections
                  </h4>
                  <div className="space-y-2">
                    {activeSummaryModal.summary.commonMistakes.map((mis, i) => (
                      <div key={i} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                        <p className="text-neutral-900 font-semibold">Mistake: {mis.mistake}</p>
                        <p className="text-neutral-700 font-medium">Correction: {mis.correction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => {
                  const currentMat = activeSummaryModal.material;
                  setActiveSummaryModal(null);
                  setSelectedMaterialForAction(currentMat);
                  setActiveTab('tutor');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-950 hover:bg-black text-white flex items-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                <span>Discuss with AI Tutor</span>
              </button>
              <button
                onClick={() => setActiveSummaryModal(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

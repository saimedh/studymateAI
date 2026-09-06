import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { CheatSheetData } from '../../types';
import {
  FileText,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const CheatSheetView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    materials,
    setActiveTab
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(subjectMaterials[0]?.id || '');
  const [focusArea, setFocusArea] = useState<string>('comprehensive');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [cheatSheet, setCheatSheet] = useState<CheatSheetData | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const groundingMaterial = materials.find(m => m.id === selectedMaterialId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const resp = await fetch('/api/ai/generate-cheatsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'Academic Course',
          topic: currentSubject?.topics?.join(', ') || 'Core Principles',
          materialText: groundingMaterial?.extractedText || '',
          materialName: groundingMaterial?.originalName || ''
        })
      });

      if (!resp.ok) {
        throw new Error('Cheat sheet generation failed');
      }

      const data = await resp.json();
      setCheatSheet(data);
    } catch (err: any) {
      console.error(err);
      alert('Unable to generate cheat sheet. Please check that you have selected a subject or material.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!cheatSheet) return;
    const text = `# ${cheatSheet.title} - High-Yield Study Cheat Sheet
Subject: ${cheatSheet.subject}

## Core Axioms & Principles
${cheatSheet.corePrinciples?.map(p => `- **${p.axiom}**: ${p.description}`).join('\n') || ''}

## Essential Formulas & Definitions
${cheatSheet.formulas?.map(f => `### ${f.name}\n\`${f.formula}\`\n- Context: ${f.whereToUse}\n- Variables: ${f.variables}`).join('\n\n') || ''}

## High-Yield Exam Pitfalls & Traps
${cheatSheet.examTraps?.map(t => `- **Trap**: ${t.mistake}\n  - **Correction**: ${t.correction}`).join('\n') || ''}

## Mnemonics & Memory Aids
${cheatSheet.mnemonics?.map(m => `- **${m.concept}**: ${m.phrase} (${m.explanation})`).join('\n') || ''}
`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-neutral-950 text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">AI Cheat Sheet & High-Yield Summary</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Condensed 1-page ultra-high-yield review sheet with formulas, derivations, and common exam traps.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {cheatSheet && (
            <>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-colors"
                title="Copy Markdown"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{cheatSheet ? 'Regenerate' : 'Generate Cheat Sheet'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generator Configuration Bar */}
      <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Subject:</span>
            <span className="font-bold text-neutral-900 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
              {currentSubject?.name || 'Select Subject'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 font-medium">Grounding Document:</span>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium text-xs focus:ring-1 focus:ring-neutral-900"
            >
              <option value="">General Subject Knowledge</option>
              {subjectMaterials.map(m => (
                <option key={m.id} value={m.id}>
                  📄 {m.originalName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {groundingMaterial && (
          <div className="flex items-center gap-1 text-[11px] text-neutral-600">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-800" />
            <span>Grounded in lecture notes</span>
          </div>
        )}
      </div>

      {/* Cheat Sheet Content View */}
      {cheatSheet ? (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Sheet Header */}
          <div className="border-b border-neutral-200 pb-5 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                StudyMate High-Yield Summary
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight">{cheatSheet.title}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Course: <strong>{cheatSheet.subject}</strong> • High-Yield Condensed Reference
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800 font-semibold border border-neutral-200">
                Exam Ready
              </span>
            </div>
          </div>

          {/* Section 1: Core Axioms & Principles */}
          {cheatSheet.corePrinciples && cheatSheet.corePrinciples.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                <Lightbulb className="w-4 h-4 text-neutral-800" />
                <h3>Core Principles & Foundational Axioms</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cheatSheet.corePrinciples.map((cp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <h4 className="text-xs font-bold text-neutral-950">{cp.axiom}</h4>
                    <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{cp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Formulas & Key Equations */}
          {cheatSheet.formulas && cheatSheet.formulas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                <Sparkles className="w-4 h-4 text-neutral-800" />
                <h3>Essential Equations & Formula Definitions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cheatSheet.formulas.map((f, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-950 text-white border border-neutral-900 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-200">{f.name}</span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                        Formula
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-neutral-900 font-mono text-sm text-emerald-400 overflow-x-auto my-2">
                      {f.formula}
                    </div>
                    <div className="text-[11px] text-neutral-300 space-y-1 mt-2">
                      <p><span className="text-neutral-500">When to use:</span> {f.whereToUse}</p>
                      <p><span className="text-neutral-500">Variables:</span> {f.variables}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: High-Yield Exam Pitfalls & Traps */}
          {cheatSheet.examTraps && cheatSheet.examTraps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3>High-Yield Exam Traps & Frequent Misconceptions</h3>
              </div>
              <div className="space-y-2.5">
                {cheatSheet.examTraps.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-950">
                        ⚠️ Frequent Mistake: <span className="font-normal text-amber-900">{t.mistake}</span>
                      </p>
                      <p className="text-xs font-semibold text-neutral-900">
                        ✅ Correct Approach: <span className="font-normal text-neutral-700">{t.correction}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Mnemonics & Memory Anchors */}
          {cheatSheet.mnemonics && cheatSheet.mnemonics.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                <Layers className="w-4 h-4 text-neutral-800" />
                <h3>Mnemonics & Rapid Recall Anchors</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cheatSheet.mnemonics.map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-900">{m.concept}</span>
                    </div>
                    <p className="text-xs font-bold text-neutral-950 font-mono bg-white px-2 py-1 rounded border border-neutral-200 my-1 inline-block">
                      {m.phrase}
                    </p>
                    <p className="text-[11px] text-neutral-600 mt-1">{m.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600">
            <FileText className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-950">Generate a 1-Page Exam Cheat Sheet</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Click the <strong>Generate Cheat Sheet</strong> button above. StudyMate AI will analyze your lecture slides, extract all critical equations, highlight exam traps, and format everything for rapid revision.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

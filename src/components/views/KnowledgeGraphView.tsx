import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { KnowledgeNode } from '../../types';
import {
  Network,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  BookOpen,
  Bot,
  Info,
  Layers,
  Search,
  Check,
  Zap
} from 'lucide-react';

export const KnowledgeGraphView: React.FC = () => {
  const {
    subjects,
    selectedSubjectId,
    materials,
    setActiveTab,
    weakTopics
  } = useStudy();

  const currentSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  const subjectMaterials = materials.filter(m => !selectedSubjectId || m.subjectId === selectedSubjectId);

  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchKnowledgeGraph = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/ai/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: currentSubject?.name || 'Academic Subject',
          topics: currentSubject?.topics || [],
          materialText: subjectMaterials.map(m => m.extractedText).slice(0, 2).join('\n\n')
        })
      });

      if (!resp.ok) {
        throw new Error('Knowledge graph generation failed');
      }

      const data = await resp.json();
      if (Array.isArray(data.nodes)) {
        setNodes(data.nodes);
        setSelectedNode(data.nodes[0] || null);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback default nodes based on current subject topics if offline or rate-limited
      const fallbackNodes: KnowledgeNode[] = (currentSubject?.topics || ['Foundations', 'Core Concepts', 'Advanced Applications']).map((t, idx) => ({
        id: 'node_' + idx,
        topic: t,
        prerequisites: idx > 0 ? [(currentSubject?.topics || [])[idx - 1]] : [],
        masteryLevel: idx === 0 ? 'mastered' : idx === 1 ? 'learning' : 'unlocked',
        coreConcepts: ['Definition & Intuition', 'Key Relationships', 'Problem Solving Technique'],
        keyTakeaway: `Core mastery of ${t} is required for subsequent chapters.`,
        difficulty: idx === 0 ? 'beginner' : idx === 1 ? 'intermediate' : 'advanced'
      }));
      setNodes(fallbackNodes);
      setSelectedNode(fallbackNodes[0] || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeGraph();
  }, [selectedSubjectId]);

  const toggleMastery = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.masteryLevel === 'mastered' ? 'learning' : n.masteryLevel === 'learning' ? 'unlocked' : 'mastered';
        return { ...n, masteryLevel: nextStatus };
      }
      return n;
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? {
        ...prev,
        masteryLevel: prev.masteryLevel === 'mastered' ? 'learning' : prev.masteryLevel === 'learning' ? 'unlocked' : 'mastered'
      } : null);
    }
  };

  const filteredNodes = nodes.filter(n =>
    n.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.coreConcepts.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const masteredCount = nodes.filter(n => n.masteryLevel === 'mastered').length;
  const learningCount = nodes.filter(n => n.masteryLevel === 'learning').length;
  const progressPercent = nodes.length > 0 ? Math.round((masteredCount / nodes.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-neutral-950 text-white shadow-xs">
              <Network className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-neutral-950 tracking-tight">Interactive Knowledge Graph</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Visual topic prerequisite hierarchy and mastery map for <span className="font-semibold text-neutral-800">{currentSubject?.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchKnowledgeGraph}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Rebuilding Graph...' : 'Regenerate Graph'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Search Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">Topic Mastery</span>
            <div className="text-xl font-black text-neutral-950 mt-0.5">
              {progressPercent}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
            {masteredCount}/{nodes.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-500 font-medium">In Active Learning</span>
            <div className="text-xl font-black text-neutral-950 mt-0.5">
              {learningCount} Topics
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or concept..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Knowledge Canvas / Tree + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Visual Node Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Prerequisite & Dependency Tree</h3>
            <span className="text-[11px] text-neutral-400">Click any node to inspect details</span>
          </div>

          <div className="space-y-3">
            {filteredNodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              const isMastered = node.masteryLevel === 'mastered';
              const isLearning = node.masteryLevel === 'learning';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-neutral-950 bg-neutral-50/70 ring-1 ring-neutral-950 shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Node Status Indicator Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMastery(node.id);
                        }}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isMastered
                            ? 'bg-neutral-950 text-white'
                            : isLearning
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                        }`}
                        title="Click to toggle mastery level"
                      >
                        {isMastered ? <Check className="w-3.5 h-3.5" /> : isLearning ? <Clock className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-950">{node.topic}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                            node.difficulty === 'advanced'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : node.difficulty === 'intermediate'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            {node.difficulty || 'Core'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{node.keyTakeaway}</p>

                        {/* Prerequisites Badge line */}
                        {node.prerequisites && node.prerequisites.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-500">
                            <span className="font-semibold text-neutral-400">Prereqs:</span>
                            {node.prerequisites.map((p, pIdx) => (
                              <span key={pIdx} className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[10px] border border-neutral-200">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-neutral-950 translate-x-1' : 'text-neutral-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Node Inspector & AI Tutor Shortcut */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-5 sticky top-20">
              <div className="border-b border-neutral-100 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Topic Inspector</span>
                  <h3 className="text-base font-bold text-neutral-950">{selectedNode.topic}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMastery(selectedNode.id)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    selectedNode.masteryLevel === 'mastered'
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : selectedNode.masteryLevel === 'learning'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}
                >
                  {selectedNode.masteryLevel === 'mastered' ? 'Mastered' : selectedNode.masteryLevel === 'learning' ? 'In Progress' : 'Mark Mastered'}
                </button>
              </div>

              {/* Core Concepts */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-neutral-900 block">Core Concepts to Master:</span>
                <ul className="space-y-1.5">
                  {selectedNode.coreConcepts?.map((cc, idx) => (
                    <li key={idx} className="text-xs text-neutral-700 flex items-start gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-950 mt-1.5 shrink-0" />
                      <span>{cc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Takeaway */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                  <Info className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Intuition Summary:</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{selectedNode.keyTakeaway}</p>
              </div>

              {/* Direct Jump to AI Tutor */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tutor');
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Practice this topic with AI Tutor</span>
              </button>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-500">
              Select a node to inspect prerequisite breakdown and key takeaways.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

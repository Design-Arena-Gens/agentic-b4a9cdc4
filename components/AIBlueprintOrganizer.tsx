'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Upload, FileText, Database, Save } from 'lucide-react';

interface AIBlueprint {
  instructionalRuleset: string;
  knowledgeCompendium: string;
  metadata: {
    lastModified: string;
    chunks: KnowledgeChunk[];
  };
}

interface KnowledgeChunk {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: {
    wordCount: number;
    category: string;
    tags: string[];
  };
}

export default function AIBlueprintOrganizer() {
  const [instructionalRuleset, setInstructionalRuleset] = useState('');
  const [knowledgeCompendium, setKnowledgeCompendium] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'jsonl'>('json');
  const [savedBlueprints, setSavedBlueprints] = useState<AIBlueprint[]>([]);
  const [currentBlueprintIndex, setCurrentBlueprintIndex] = useState<number | null>(null);
  const irFileInputRef = useRef<HTMLInputElement>(null);
  const kcsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-blueprints');
    if (saved) {
      setSavedBlueprints(JSON.parse(saved));
    }
  }, []);

  const convertToMarkdown = (text: string): string => {
    let markdown = text;

    // Convert headers
    markdown = markdown.replace(/^# (.+)$/gm, '# $1');
    markdown = markdown.replace(/^## (.+)$/gm, '## $1');

    // If no headers detected, add structure
    if (!markdown.includes('#')) {
      const lines = markdown.split('\n');
      let structured = '# AI Model Instructional Ruleset\n\n';

      lines.forEach(line => {
        if (line.trim().length > 0) {
          if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
            structured += line + '\n';
          } else if (line.trim().endsWith(':')) {
            structured += '\n## ' + line.trim().slice(0, -1) + '\n\n';
          } else {
            structured += line + '\n';
          }
        } else {
          structured += '\n';
        }
      });

      markdown = structured;
    }

    return markdown;
  };

  const chunkKnowledge = (text: string): KnowledgeChunk[] => {
    const chunkSize = 500; // words per chunk
    const words = text.split(/\s+/);
    const chunks: KnowledgeChunk[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const content = chunkWords.join(' ');

      // Extract potential categories and tags
      const sentences = content.split(/[.!?]+/);
      const firstSentence = sentences[0] || '';
      const category = firstSentence.split(' ').slice(0, 3).join(' ') || 'General';

      // Extract potential tags (capitalized words, technical terms)
      const tags = [...new Set(
        chunkWords
          .filter(word => /^[A-Z][a-z]+/.test(word) || /^[A-Z]{2,}/.test(word))
          .slice(0, 5)
      )];

      chunks.push({
        id: `chunk-${i / chunkSize}`,
        content,
        chunkIndex: Math.floor(i / chunkSize),
        metadata: {
          wordCount: chunkWords.length,
          category,
          tags,
        },
      });
    }

    return chunks;
  };

  const saveBlueprint = () => {
    const markdownIR = convertToMarkdown(instructionalRuleset);
    const chunks = chunkKnowledge(knowledgeCompendium);

    const blueprint: AIBlueprint = {
      instructionalRuleset: markdownIR,
      knowledgeCompendium,
      metadata: {
        lastModified: new Date().toISOString(),
        chunks,
      },
    };

    let updatedBlueprints: AIBlueprint[];
    if (currentBlueprintIndex !== null) {
      updatedBlueprints = [...savedBlueprints];
      updatedBlueprints[currentBlueprintIndex] = blueprint;
    } else {
      updatedBlueprints = [...savedBlueprints, blueprint];
    }

    setSavedBlueprints(updatedBlueprints);
    localStorage.setItem('ai-blueprints', JSON.stringify(updatedBlueprints));
    setCurrentBlueprintIndex(updatedBlueprints.length - 1);

    alert('Blueprint saved successfully!');
  };

  const exportBlueprint = () => {
    if (!instructionalRuleset && !knowledgeCompendium) {
      alert('Please add content before exporting');
      return;
    }

    const markdownIR = convertToMarkdown(instructionalRuleset);
    const chunks = chunkKnowledge(knowledgeCompendium);

    const irBlob = new Blob([markdownIR], { type: 'text/markdown' });
    const irUrl = URL.createObjectURL(irBlob);
    const irLink = document.createElement('a');
    irLink.href = irUrl;
    irLink.download = `instructional-ruleset-${Date.now()}.md`;
    irLink.click();
    URL.revokeObjectURL(irUrl);

    if (exportFormat === 'json') {
      const kcsData = {
        knowledgeCompendium,
        chunks,
        metadata: {
          exportDate: new Date().toISOString(),
          totalChunks: chunks.length,
          totalWords: chunks.reduce((sum, chunk) => sum + chunk.metadata.wordCount, 0),
        },
      };
      const kcsBlob = new Blob([JSON.stringify(kcsData, null, 2)], { type: 'application/json' });
      const kcsUrl = URL.createObjectURL(kcsBlob);
      const kcsLink = document.createElement('a');
      kcsLink.href = kcsUrl;
      kcsLink.download = `knowledge-compendium-${Date.now()}.json`;
      kcsLink.click();
      URL.revokeObjectURL(kcsUrl);
    } else {
      const jsonlLines = chunks.map(chunk =>
        JSON.stringify({
          content: chunk.content,
          metadata: chunk.metadata,
        })
      ).join('\n');
      const kcsBlob = new Blob([jsonlLines], { type: 'application/jsonl' });
      const kcsUrl = URL.createObjectURL(kcsBlob);
      const kcsLink = document.createElement('a');
      kcsLink.href = kcsUrl;
      kcsLink.download = `knowledge-compendium-${Date.now()}.jsonl`;
      kcsLink.click();
      URL.revokeObjectURL(kcsUrl);
    }

    alert('Files exported successfully!');
  };

  const handleIRFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInstructionalRuleset(text);
    };
    reader.readAsText(file);
  };

  const handleKCSFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(text);
          setKnowledgeCompendium(data.knowledgeCompendium || text);
        } catch {
          setKnowledgeCompendium(text);
        }
      } else if (file.name.endsWith('.jsonl')) {
        const lines = text.split('\n').filter(line => line.trim());
        const content = lines.map(line => {
          try {
            const obj = JSON.parse(line);
            return obj.content || line;
          } catch {
            return line;
          }
        }).join('\n\n');
        setKnowledgeCompendium(content);
      } else {
        setKnowledgeCompendium(text);
      }
    };
    reader.readAsText(file);
  };

  const loadBlueprint = (index: number) => {
    const blueprint = savedBlueprints[index];
    setInstructionalRuleset(blueprint.instructionalRuleset);
    setKnowledgeCompendium(blueprint.knowledgeCompendium);
    setCurrentBlueprintIndex(index);
  };

  const newBlueprint = () => {
    setInstructionalRuleset('');
    setKnowledgeCompendium('');
    setCurrentBlueprintIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={saveBlueprint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
          >
            <Save size={20} />
            Save Blueprint
          </button>
          <button
            onClick={exportBlueprint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
          >
            <Download size={20} />
            Export Files
          </button>
          <button
            onClick={newBlueprint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            <FileText size={20} />
            New Blueprint
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-white font-medium">Export Format:</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'jsonl')}
              className="px-3 py-2 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="json">JSON</option>
              <option value="jsonl">JSONL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Saved Blueprints */}
      {savedBlueprints.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Saved Blueprints</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {savedBlueprints.map((blueprint, index) => (
              <button
                key={index}
                onClick={() => loadBlueprint(index)}
                className={`p-4 rounded-lg text-left transition-all ${
                  currentBlueprintIndex === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="font-semibold mb-1">Blueprint {index + 1}</div>
                <div className="text-sm opacity-75">
                  {new Date(blueprint.metadata.lastModified).toLocaleDateString()}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {blueprint.metadata.chunks.length} chunks
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructional Ruleset */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={24} />
              Instructional Ruleset (IR)
            </h2>
            <div className="flex gap-2">
              <input
                type="file"
                ref={irFileInputRef}
                onChange={handleIRFileUpload}
                accept=".txt,.md,.json"
                className="hidden"
              />
              <button
                onClick={() => irFileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
              >
                <Upload size={16} />
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={instructionalRuleset}
              onChange={(e) => setInstructionalRuleset(e.target.value)}
              placeholder="Enter your AI model's persona, behavior, and instructional rulesets here...

Example:
You are a helpful AI assistant.

Core Behaviors:
- Always be polite and professional
- Provide detailed explanations
- Ask clarifying questions when needed

Response Format:
- Use markdown formatting
- Structure responses clearly"
              className="w-full p-4 rounded-lg bg-slate-700 text-white border-2 border-slate-600 focus:border-purple-500 focus:outline-none min-h-[400px] resize-y font-mono text-sm"
            />

            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-300">
                <strong className="text-white">Auto-converts to:</strong> Markdown (.md)
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Raw text will be automatically structured with headers and formatting
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Compendium Synthesis */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database size={24} />
              Knowledge Compendium (KCS)
            </h2>
            <div className="flex gap-2">
              <input
                type="file"
                ref={kcsFileInputRef}
                onChange={handleKCSFileUpload}
                accept=".txt,.json,.jsonl"
                className="hidden"
              />
              <button
                onClick={() => kcsFileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1"
              >
                <Upload size={16} />
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              value={knowledgeCompendium}
              onChange={(e) => setKnowledgeCompendium(e.target.value)}
              placeholder="Enter your knowledge base content here...

This can include:
- Domain-specific information
- FAQs and common questions
- Technical documentation
- Reference materials
- Context and background information

The system will automatically:
- Chunk the content into manageable pieces
- Add metadata for mapping
- Extract categories and tags"
              className="w-full p-4 rounded-lg bg-slate-700 text-white border-2 border-slate-600 focus:border-blue-500 focus:outline-none min-h-[400px] resize-y font-mono text-sm"
            />

            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-sm text-slate-300">
                <strong className="text-white">Auto-processes to:</strong> Chunked {exportFormat.toUpperCase()} with metadata
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Content is automatically chunked (500 words), categorized, and tagged
              </div>
              {knowledgeCompendium && (
                <div className="text-xs text-green-400 mt-2">
                  Estimated chunks: {Math.ceil(knowledgeCompendium.split(/\s+/).length / 500)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {(instructionalRuleset || knowledgeCompendium) && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Preview</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {instructionalRuleset && (
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">IR (Markdown Preview)</h3>
                <div className="bg-slate-900 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono">
                    {convertToMarkdown(instructionalRuleset)}
                  </pre>
                </div>
              </div>
            )}

            {knowledgeCompendium && (
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  KCS Chunking Info
                </h3>
                <div className="bg-slate-900 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <div className="text-slate-300 text-sm space-y-2">
                    {chunkKnowledge(knowledgeCompendium).slice(0, 3).map((chunk, i) => (
                      <div key={i} className="border-b border-slate-700 pb-2">
                        <div className="text-blue-400 font-semibold">Chunk {i + 1}</div>
                        <div className="text-xs text-slate-400">
                          Words: {chunk.metadata.wordCount} |
                          Category: {chunk.metadata.category}
                        </div>
                        <div className="text-xs text-slate-400">
                          Tags: {chunk.metadata.tags.join(', ') || 'None'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {chunk.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                    {chunkKnowledge(knowledgeCompendium).length > 3 && (
                      <div className="text-slate-500 text-xs italic">
                        ... and {chunkKnowledge(knowledgeCompendium).length - 3} more chunks
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Trash2, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  urgency: number;
  importance: number;
  quadrant: 'urgent-important' | 'not-urgent-important' | 'urgent-not-important' | 'not-urgent-not-important';
}

interface ScoringResult {
  urgency: number;
  importance: number;
  quadrant: Task['quadrant'];
  explanation: string;
}

export default function EisenhowerMatrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [showScoring, setShowScoring] = useState(false);
  const [manualUrgency, setManualUrgency] = useState(5);
  const [manualImportance, setManualImportance] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem('eisenhower-tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const scoreTask = (text: string): ScoringResult => {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'today', 'now', 'emergency', 'critical'];
    const importantKeywords = ['important', 'strategic', 'goal', 'priority', 'essential', 'key', 'vital', 'crucial'];
    const notUrgentKeywords = ['later', 'eventually', 'someday', 'future', 'long-term', 'planning'];
    const notImportantKeywords = ['trivial', 'minor', 'optional', 'nice to have'];

    const lowerText = text.toLowerCase();

    let urgency = 5;
    let importance = 5;

    urgentKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) urgency += 2;
    });

    notUrgentKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) urgency -= 2;
    });

    importantKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) importance += 2;
    });

    notImportantKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) importance -= 2;
    });

    if (lowerText.includes('?')) urgency -= 1;
    if (lowerText.includes('!')) urgency += 1;

    urgency = Math.max(0, Math.min(10, urgency));
    importance = Math.max(0, Math.min(10, importance));

    let quadrant: Task['quadrant'];
    if (urgency >= 5 && importance >= 5) {
      quadrant = 'urgent-important';
    } else if (urgency < 5 && importance >= 5) {
      quadrant = 'not-urgent-important';
    } else if (urgency >= 5 && importance < 5) {
      quadrant = 'urgent-not-important';
    } else {
      quadrant = 'not-urgent-not-important';
    }

    const explanation = `Urgency: ${urgency}/10 | Importance: ${importance}/10`;

    return { urgency, importance, quadrant, explanation };
  };

  const handleTaskInput = (text: string) => {
    setNewTaskText(text);
    if (text.trim()) {
      const result = scoreTask(text);
      setScoringResult(result);
      setManualUrgency(result.urgency);
      setManualImportance(result.importance);
    } else {
      setScoringResult(null);
    }
  };

  const getQuadrantFromScores = (urgency: number, importance: number): Task['quadrant'] => {
    if (urgency >= 5 && importance >= 5) {
      return 'urgent-important';
    } else if (urgency < 5 && importance >= 5) {
      return 'not-urgent-important';
    } else if (urgency >= 5 && importance < 5) {
      return 'urgent-not-important';
    } else {
      return 'not-urgent-not-important';
    }
  };

  const addTask = () => {
    if (!newTaskText.trim() || !scoringResult) return;

    const finalUrgency = autoAssign ? scoringResult.urgency : manualUrgency;
    const finalImportance = autoAssign ? scoringResult.importance : manualImportance;
    const finalQuadrant = getQuadrantFromScores(finalUrgency, finalImportance);

    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      urgency: finalUrgency,
      importance: finalImportance,
      quadrant: finalQuadrant,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setScoringResult(null);
    setManualUrgency(5);
    setManualImportance(5);
  };

  const completeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getQuadrantTasks = (quadrant: Task['quadrant']) => {
    return tasks.filter(task => task.quadrant === quadrant);
  };

  const quadrantConfig = {
    'urgent-important': {
      title: 'DO FIRST',
      subtitle: 'Urgent & Important',
      color: 'bg-red-500',
      borderColor: 'border-red-600',
      textColor: 'text-red-100',
      headerBg: 'bg-red-600',
    },
    'not-urgent-important': {
      title: 'SCHEDULE',
      subtitle: 'Not Urgent & Important',
      color: 'bg-blue-500',
      borderColor: 'border-blue-600',
      textColor: 'text-blue-100',
      headerBg: 'bg-blue-600',
    },
    'urgent-not-important': {
      title: 'DELEGATE',
      subtitle: 'Urgent & Not Important',
      color: 'bg-yellow-500',
      borderColor: 'border-yellow-600',
      textColor: 'text-yellow-900',
      headerBg: 'bg-yellow-600',
    },
    'not-urgent-not-important': {
      title: 'ELIMINATE',
      subtitle: 'Not Urgent & Not Important',
      color: 'bg-green-500',
      borderColor: 'border-green-600',
      textColor: 'text-green-100',
      headerBg: 'bg-green-600',
    },
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Add New Task</h2>

        <div className="space-y-4">
          <textarea
            value={newTaskText}
            onChange={(e) => handleTaskInput(e.target.value)}
            placeholder="Enter your task here..."
            className="w-full p-4 rounded-lg bg-slate-700 text-white border-2 border-slate-600 focus:border-blue-500 focus:outline-none min-h-[100px] resize-y"
          />

          {scoringResult && (
            <div className="bg-slate-700 rounded-lg p-4 border-2 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Scoring System</h3>
                <button
                  onClick={() => setShowScoring(!showScoring)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  {showScoring ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Urgency:</span>
                    <span className="text-white font-bold">{autoAssign ? scoringResult.urgency : manualUrgency}/10</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${((autoAssign ? scoringResult.urgency : manualUrgency) / 10) * 100}%` }}
                    />
                  </div>
                  {!autoAssign && (
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={manualUrgency}
                      onChange={(e) => setManualUrgency(parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 font-medium">Importance:</span>
                    <span className="text-white font-bold">{autoAssign ? scoringResult.importance : manualImportance}/10</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${((autoAssign ? scoringResult.importance : manualImportance) / 10) * 100}%` }}
                    />
                  </div>
                  {!autoAssign && (
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={manualImportance}
                      onChange={(e) => setManualImportance(parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  )}
                </div>
              </div>

              {showScoring && (
                <div className="text-slate-300 text-sm space-y-2 bg-slate-600 p-3 rounded">
                  <p><strong>Auto-detected:</strong> {scoringResult.explanation}</p>
                  <p><strong>Assigned Quadrant:</strong> {quadrantConfig[autoAssign ? scoringResult.quadrant : getQuadrantFromScores(manualUrgency, manualImportance)].subtitle}</p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoAssign}
                    onChange={(e) => setAutoAssign(e.target.checked)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span className="text-white font-medium">Auto-Assign</span>
                </label>
                {!autoAssign && (
                  <span className="text-yellow-400 text-sm font-medium">Manual Override Active</span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={addTask}
            disabled={!newTaskText.trim() || !scoringResult}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
          >
            Add Task to Matrix
          </button>
        </div>
      </div>

      {/* Eisenhower Matrix */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Eisenhower Matrix</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] md:h-[700px]">
          {/* Urgent & Important */}
          <div className={`${quadrantConfig['urgent-important'].color} ${quadrantConfig['urgent-important'].borderColor} border-4 rounded-lg overflow-hidden flex flex-col`}>
            <div className={`${quadrantConfig['urgent-important'].headerBg} p-4`}>
              <h3 className="font-bold text-xl text-white">{quadrantConfig['urgent-important'].title}</h3>
              <p className="text-sm text-white opacity-90">{quadrantConfig['urgent-important'].subtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {getQuadrantTasks('urgent-important').map(task => (
                <div key={task.id} className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3 flex items-start justify-between gap-2">
                  <p className="text-white flex-1 break-words">{task.text}</p>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="flex-shrink-0 text-white hover:text-green-300 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Not Urgent & Important */}
          <div className={`${quadrantConfig['not-urgent-important'].color} ${quadrantConfig['not-urgent-important'].borderColor} border-4 rounded-lg overflow-hidden flex flex-col`}>
            <div className={`${quadrantConfig['not-urgent-important'].headerBg} p-4`}>
              <h3 className="font-bold text-xl text-white">{quadrantConfig['not-urgent-important'].title}</h3>
              <p className="text-sm text-white opacity-90">{quadrantConfig['not-urgent-important'].subtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {getQuadrantTasks('not-urgent-important').map(task => (
                <div key={task.id} className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3 flex items-start justify-between gap-2">
                  <p className="text-white flex-1 break-words">{task.text}</p>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="flex-shrink-0 text-white hover:text-green-300 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent & Not Important */}
          <div className={`${quadrantConfig['urgent-not-important'].color} ${quadrantConfig['urgent-not-important'].borderColor} border-4 rounded-lg overflow-hidden flex flex-col`}>
            <div className={`${quadrantConfig['urgent-not-important'].headerBg} p-4`}>
              <h3 className="font-bold text-xl text-white">{quadrantConfig['urgent-not-important'].title}</h3>
              <p className="text-sm text-white opacity-90">{quadrantConfig['urgent-not-important'].subtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {getQuadrantTasks('urgent-not-important').map(task => (
                <div key={task.id} className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3 flex items-start justify-between gap-2">
                  <p className={quadrantConfig['urgent-not-important'].textColor + " flex-1 break-words"}>{task.text}</p>
                  <button
                    onClick={() => completeTask(task.id)}
                    className={quadrantConfig['urgent-not-important'].textColor + " hover:text-green-700 transition-colors flex-shrink-0"}
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Not Urgent & Not Important */}
          <div className={`${quadrantConfig['not-urgent-not-important'].color} ${quadrantConfig['not-urgent-not-important'].borderColor} border-4 rounded-lg overflow-hidden flex flex-col`}>
            <div className={`${quadrantConfig['not-urgent-not-important'].headerBg} p-4`}>
              <h3 className="font-bold text-xl text-white">{quadrantConfig['not-urgent-not-important'].title}</h3>
              <p className="text-sm text-white opacity-90">{quadrantConfig['not-urgent-not-important'].subtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {getQuadrantTasks('not-urgent-not-important').map(task => (
                <div key={task.id} className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3 flex items-start justify-between gap-2">
                  <p className="text-white flex-1 break-words">{task.text}</p>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="flex-shrink-0 text-white hover:text-yellow-300 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

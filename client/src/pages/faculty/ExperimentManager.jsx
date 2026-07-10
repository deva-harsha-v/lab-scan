import React, { useState, useEffect } from 'react';
import { useRouter } from '../../App';
import Navbar from '../../components/Navbar';
import { experimentsApi } from '../../api/experiments.api';
import { useTheme } from '../../context/ThemeContext';

export default function ExperimentManager() {
  const { navigate } = useRouter();
  const { tokens } = useTheme();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    experimentsApi
      .getAll()
      .then((res) => setExperiments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will also remove all associated content and sessions.`)) return;
    setDeleting(id);
    try {
      await experimentsApi.delete(id);
      setExperiments((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete experiment');
    } finally {
      setDeleting(null);
    }
  };

  const contentTypeCounts = (contents) => {
    if (!contents) return {};
    return contents.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Back navigation pathway action row */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('faculty-dashboard')}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Experiments</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage your lab experiments and content
            </p>
          </div>
          <button onClick={() => navigate('experiment-form', { mode: 'new' })} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Experiment
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-2 border-lab-500 border-t-transparent rounded-full" />
          </div>
        ) : experiments.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">No experiments yet.</p>
            <button onClick={() => navigate('experiment-form', { mode: 'new' })} className="btn-primary">
              Create your first experiment
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experiments.map((exp) => {
              const counts = contentTypeCounts(exp.contents);
              return (
                <div key={exp.id} className="card hover:border-slate-600 transition-colors group">
                  {/* ArUco badge */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono bg-lab-500/20 text-lab-400 border border-lab-500/30 px-2 py-0.5 rounded">
                      ArUco #{exp.arucoId}
                    </span>
                    <span className="text-xs text-slate-500">
                      {exp._count?.sessions || 0} session{exp._count?.sessions !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <h2 className="font-semibold text-white mb-1 group-hover:text-lab-300 transition-colors line-clamp-1">
                    {exp.title}
                  </h2>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">{exp.description}</p>

                  {/* Content type chips */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Object.entries(counts).map(([type, count]) => (
                      <span
                        key={type}
                        className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded"
                      >
                        {type} ×{count}
                      </span>
                    ))}
                    {Object.keys(counts).length === 0 && (
                      <span className="text-xs text-slate-600">No content yet</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('experiment-form', { mode: 'edit', experimentId: exp.id })}
                      className="btn-secondary text-xs flex-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id, exp.title)}
                      disabled={deleting === exp.id}
                      className="btn-danger text-xs px-3 flex items-center justify-center"
                    >
                      {deleting === exp.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
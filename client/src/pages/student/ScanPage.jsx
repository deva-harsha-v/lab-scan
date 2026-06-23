import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import ArucoScanner from '../../components/ArucoScanner';
import { experimentsApi } from '../../api/experiments.api';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from '../../App';

export default function ScanPage() {
  const { tokens } = useTheme();
  const { navigate } = useRouter();
  const [status, setStatus] = useState('idle'); // idle | detecting | found | error
  const [experiment, setExperiment] = useState(null);
  const [error, setError] = useState('');

  const handleDetected = async (markerId) => {
    setStatus('detecting');
    setError('');
    try {
      const res = await experimentsApi.lookupByAruco(markerId);
      setExperiment(res.data);
      setStatus('found');
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No experiment found for marker ID: ${markerId}`);
      } else if (err.response?.status === 401) {
        setError('Please log in to access experiments.');
      } else {
        setError('Failed to look up experiment. Please try again.');
      }
      setStatus('error');
    }
  };

  const handleContinue = () => {
    if (experiment) {
      navigate('experiment-view', { experiment });
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setExperiment(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Scan Experiment Marker</h1>
          <p className="text-slate-400 text-sm">
            Point your camera at the ArUco marker on your experiment card
          </p>
        </div>

        {status !== 'found' ? (
          <div className="card">
            <ArucoScanner onDetected={handleDetected} />

            {status === 'detecting' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-lab-400">
                <div className="w-4 h-4 border-2 border-lab-400/30 border-t-lab-400 rounded-full animate-spin" />
                <span className="text-sm">Looking up experiment…</span>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="card animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-lab-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-lab-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-lab-400 font-medium uppercase tracking-wide mb-1">
                  Experiment Found
                </p>
                <h2 className="text-xl font-bold text-white mb-1 truncate">
                  {experiment.title}
                </h2>
                <p className="text-sm text-slate-400 line-clamp-2">{experiment.description}</p>
                <p className="text-xs text-slate-500 mt-2">
                  ArUco ID: <span className="font-mono text-slate-400">{experiment.arucoId}</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleContinue} className="btn-primary flex-1">
                Open Experiment →
              </button>
              <button onClick={handleReset} className="btn-secondary px-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950 px-3 text-slate-500">or</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-400 text-sm mb-3">Have a session code?</p>
          <button
            onClick={() => navigate('join-session')}
            className="btn-secondary"
          >
            Join with Code
          </button>
        </div>
      </main>
    </div>
  );
}

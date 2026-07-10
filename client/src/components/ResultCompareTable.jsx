import React from 'react';

/**
 * Compares sample (expected) results against student-entered values.
 * Numeric fields: green if within ±10%, red otherwise.
 * String fields: green on case-insensitive exact match.
 */
export default function ResultCompareTable({ sampleResult, studentNotes }) {
  if (!sampleResult) return null;

  let sampleData = {};
  let studentData = {};

  try {
    sampleData = typeof sampleResult === 'string' ? JSON.parse(sampleResult) : sampleResult;
  } catch {
    return <p className="text-red-400 text-sm">Invalid sample result format</p>;
  }

  try {
    studentData = studentNotes ? JSON.parse(studentNotes) : {};
  } catch {
    // Student notes might be plain text, not JSON
    studentData = {};
  }

  const rows = Object.entries(sampleData).map(([key, sampleValue]) => {
    const studentValue = studentData[key] ?? '';

    const sampleNum = parseFloat(sampleValue);
    const studentNum = parseFloat(studentValue);
    const isNumeric = !isNaN(sampleNum) && sampleValue !== '';

    let match = 'neutral';
    if (studentValue !== '') {
      if (isNumeric && !isNaN(studentNum)) {
        const diff = Math.abs((studentNum - sampleNum) / sampleNum) * 100;
        match = diff <= 10 ? 'pass' : 'fail';
      } else if (!isNumeric) {
        match =
          studentValue.trim().toLowerCase() === sampleValue.trim().toLowerCase()
            ? 'pass'
            : 'fail';
      }
    }

    return { key, sampleValue, studentValue, match };
  });

  const matchColors = {
    pass: 'bg-green-500/10 text-green-400 border-green-500/20',
    fail: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-slate-700/40 text-slate-300 border-slate-600',
  };

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch rounded-xl border border-slate-700">
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="bg-slate-800 text-slate-400 text-left">
            <th className="px-4 py-3 font-medium">Parameter</th>
            <th className="px-4 py-3 font-medium">Expected</th>
            <th className="px-4 py-3 font-medium">Your Result</th>
            <th className="px-4 py-3 font-medium w-20">Match</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              className={`border-t border-slate-700 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/50'}`}
            >
              <td className="px-4 py-3 text-slate-300 font-medium capitalize">
                {row.key.replace(/_/g, ' ')}
              </td>
              <td className="px-4 py-3 text-slate-200 font-mono">{row.sampleValue}</td>
              <td className="px-4 py-3 font-mono">
                <span
                  className={`inline-block px-2 py-0.5 rounded-md border text-xs ${matchColors[row.match]}`}
                >
                  {row.studentValue || '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                {row.match === 'pass' && (
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {row.match === 'fail' && (
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {row.match === 'neutral' && (
                  <span className="text-slate-600 text-lg">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

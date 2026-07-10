import React, { useRef, useState } from 'react';

export default function FileUpload({
  accept = 'image/*',
  label = 'Upload file',
  onFileSelect,
  preview = true,
  maxSizeMB = 20,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const validate = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = (file) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelected(file);
    onFileSelect?.(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const isImage = selected && selected.type.startsWith('image/');
  const previewUrl = isImage && preview ? URL.createObjectURL(selected) : null;

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200 ${
            dragOver
              ? 'border-lab-400 bg-lab-500/10'
              : selected
              ? 'border-green-500/40 bg-green-500/5'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg object-contain" />
            <p className="text-sm text-green-400">{selected.name}</p>
            <p className="text-xs text-slate-500">Click to replace</p>
          </div>
        ) : selected ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-green-400 font-medium">{selected.name}</p>
            <p className="text-xs text-slate-500">{(selected.size / 1024 / 1024).toFixed(2)}MB · Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-slate-300 font-medium">{label}</p>
            <p className="text-xs text-slate-500">Drag & drop or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

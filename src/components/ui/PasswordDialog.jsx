'use client';
import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function PasswordDialog({ isOpen, onClose, onSuccess, projectTitle }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const correctPassword = 'newjob2025'; // Simple password - you can change this

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      onSuccess();
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-xs flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-lg font-medium text-slate-900 text-center mb-4">Project Password</h2>

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-slate-600 focus:border-transparent"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded transition-colors"
            >
              <ArrowRight size={18} className="text-slate-600" />
            </button>
          </div>
          {error && (
            <p className="text-red-800 text-sm mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
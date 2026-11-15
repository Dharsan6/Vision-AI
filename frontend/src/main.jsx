import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VISION AI Client Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070B] text-[#F5F8FC] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="p-8 rounded-2xl bg-[#0C1421] border border-[#1A2B40] max-w-lg space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#F06464]/20 border border-[#F06464]/40 text-[#F06464] mx-auto flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-[#F5F8FC]">Application Error Encountered</h1>
            <p className="text-xs text-[#98A9BD] leading-relaxed">
              {this.state.error?.message || 'An unexpected client-side error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#268BFF] text-white text-xs font-semibold transition-colors"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

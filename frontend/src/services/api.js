import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export const api = {
  // System & Models Status
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  getSystemStatus: async () => {
    const res = await client.get('/system/status');
    return res.data;
  },

  getModelsStatus: async () => {
    const res = await client.get('/models/status');
    return res.data;
  },

  // Smart Restore
  analyzeMedia: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await client.post('/smart-restore/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  executeSmartRestore: async (
    file,
    mode = 'quick',
    enableColorization = true,
    scale = 4,
    preferredFormat = 'png'
  ) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('mode', mode);
    formData.append('enable_colorization', enableColorization.toString());
    formData.append('scale', scale.toString());
    formData.append('preferred_format', preferredFormat);

    const res = await client.post('/smart-restore/execute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Image Colorization
  colorizeImage: async (file, referenceFile = null, preferredFormat = 'png') => {
    const formData = new FormData();
    formData.append('image', file);
    if (referenceFile) {
      formData.append('reference', referenceFile);
    }
    formData.append('preferred_format', preferredFormat);

    const res = await client.post('/image/colorize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Image Super-Resolution
  enhanceImage: async (
    file,
    scale = 4,
    strength = 'strong',
    preferredFormat = 'png',
    maxDimension = 0,
    onProgress = null
  ) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale.toString());
    formData.append('strength', strength);
    formData.append('preferred_format', preferredFormat);
    if (maxDimension > 0) {
      formData.append('max_dimension', maxDimension.toString());
    }

    const res = await client.post('/image/enhance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.data?.job_id && (res.data.status === 'queued' || res.data.status === 'processing')) {
      if (onProgress) {
        onProgress(res.data);
      }
      return await api.pollJob(res.data.job_id, onProgress);
    }
    return res.data;
  },

  startImageEnhanceJob: async (
    file,
    scale = 4,
    strength = 'strong',
    preferredFormat = 'png',
    maxDimension = 0
  ) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('scale', scale.toString());
    formData.append('strength', strength);
    formData.append('preferred_format', preferredFormat);
    if (maxDimension > 0) {
      formData.append('max_dimension', maxDimension.toString());
    }

    const res = await client.post('/image/enhance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  cancelJob: async (jobId) => {
    const res = await client.post(`/jobs/${jobId}/cancel`);
    return res.data;
  },

  // Video Colorization
  colorizeVideo: async (file, resolution = 'original', stabilization = true, maxFrames = 0) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('resolution', resolution);
    formData.append('stabilization', stabilization.toString());
    formData.append('max_frames', maxFrames.toString());

    const res = await client.post('/video/colorize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Video Super-Resolution
  enhanceVideo: async (file, scale = 4, maxFrames = 0) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('scale', scale.toString());
    formData.append('max_frames', maxFrames.toString());

    const res = await client.post('/video/enhance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Background Job Polling
  getJobStatus: async (jobId) => {
    const res = await client.get(`/jobs/${jobId}`);
    return res.data;
  },

  getJobResult: async (jobId) => {
    const res = await client.get(`/jobs/${jobId}/result`);
    return res.data;
  },

  pollJob: async (jobId, onProgress = null, intervalMs = 1200) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const job = await api.getJobStatus(jobId);
          if (onProgress) {
            onProgress(job);
          }
          if (job.status === 'completed') {
            clearInterval(interval);
            resolve(job.result);
          } else if (job.status === 'failed') {
            clearInterval(interval);
            reject(new Error(job.error || 'Job failed during execution'));
          } else if (job.status === 'cancelled') {
            clearInterval(interval);
            reject(new Error('Job cancelled by user'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, intervalMs);
    });
  },

  // History
  getHistory: async (limit = 50) => {
    const res = await client.get(`/history?limit=${limit}`);
    return res.data;
  },

  getExportHistoryUrl: () => '/api/history/export',

  deleteHistoryRecord: async (recordId) => {
    const res = await client.delete(`/history/${recordId}`);
    return res.data;
  },

  clearHistory: async () => {
    const res = await client.delete('/history');
    return res.data;
  },
};

export default api;


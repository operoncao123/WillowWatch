window.LIUXU_APP_CONFIG = Object.assign(
  {
    // Leave apiBase empty for the default GitHub Pages static-data mode.
    // Set it only when you explicitly want the frontend to call a live backend API.
    // Example: "https://liuxu-api.example.com"
    apiBase: '',
    staticDataPath: 'data/overview.json',
  },
  window.LIUXU_APP_CONFIG || {}
);

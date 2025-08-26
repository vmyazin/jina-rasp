import './components/broker-app.js';

// Initialize the Lit app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = document.createElement('broker-app');
  document.body.appendChild(app);
});
import React from 'react';
import ReactDOM from 'react-dom/client';
import EventWidget from './EventWidget';
import './styles.css';

// Extract slug from URL path: /embed/[slug]
const path = window.location.pathname;
const slug = path.replace(/^\/embed\//, '').replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EventWidget slug={slug} />
  </React.StrictMode>,
);

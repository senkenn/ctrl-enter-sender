import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { getMessage, getUILanguage } from '@/utils/i18n';

const lang = getUILanguage().split('-')[0] || 'en';
document.documentElement.lang = lang;
document.title = getMessage('optionsTitle');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

// src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Router from './router/route';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Router />
        </BrowserRouter>
    );
};

export default App;

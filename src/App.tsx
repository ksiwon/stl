// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { SemesterProvider } from './contexts/SemesterContext';
import GlobalStyle from './styles/GlobalStyle';
import MainPage from './pages/MainPage';
import CoursesPage from './pages/CoursesPage';
import AiSuggestPage from './pages/AiSuggestPage';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SemesterProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/timetable" replace />} />
            <Route path="/timetable" element={<MainPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/ai-suggest" element={<AiSuggestPage />} />
            <Route path="*" element={<Navigate to="/timetable" replace />} />
          </Routes>
        </Router>
      </SemesterProvider>
    </ThemeProvider>
  );
};

export default App;
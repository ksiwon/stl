// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { SemesterProvider } from './contexts/SemesterContext';
import { TimetableProvider } from './contexts/TimetableContext';
import { ChatProvider } from './contexts/ChatContext';
import GlobalStyle from './styles/GlobalStyle';
import MainPage from './pages/MainPage';
import CoursesPage from './pages/CoursesPage';
import AiSuggestPage from './pages/AiSuggestPage';
import AiMakerPage from './pages/AiMakerPage';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SemesterProvider>
        <TimetableProvider>
          <ChatProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Navigate to="/timetable" replace />} />
                <Route path="/timetable" element={<MainPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/suggest" element={<AiSuggestPage />} />
                <Route path="/aiMaker" element={<AiMakerPage />} />
                <Route path="*" element={<Navigate to="/timetable" replace />} />
              </Routes>
            </Router>
          </ChatProvider>
        </TimetableProvider>
      </SemesterProvider>
    </ThemeProvider>
  );
};

export default App;
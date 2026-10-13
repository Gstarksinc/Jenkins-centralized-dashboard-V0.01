import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationLayout } from './layouts/ApplicationLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ServersPage } from './pages/ServersPage';
import { NodesPage } from './pages/NodesPage';
import { JobsPage } from './pages/JobsPage';
import { BuildsPage } from './pages/BuildsPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ApplicationLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="nodes" element={<NodesPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="builds" element={<BuildsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Assign from './pages/Assign';
import LeadDetail from './pages/LeadDetail';
import Customers from './pages/Customers';
import Followups from './pages/Followups';
import Workbench from './pages/Workbench';
import Performance from './pages/Performance';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/assign" element={<Assign />} />
        <Route path="/leads/:id" element={<LeadDetail kind="lead" />} />
        <Route path="/customers/:id" element={<LeadDetail kind="customer" />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/followups" element={<Followups />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

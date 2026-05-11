
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import CalculadoraPrazos from './pages/CalculadoraPrazos';
import ProcessosJudiciais from './pages/ProcessosJudiciais';
import ProcessosAdministrativos from './pages/ProcessosAdministrativos';
import ProcessoDetalhe from './pages/ProcessoDetalhe';
import Tarefas from './pages/Tarefas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProcessosJudiciais />} />
          <Route path="administrativos" element={<ProcessosAdministrativos />} />
          <Route path="processo/:id" element={<ProcessoDetalhe />} />
          <Route path="tarefas" element={<Tarefas />} />
          <Route path="calculadora" element={<CalculadoraPrazos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

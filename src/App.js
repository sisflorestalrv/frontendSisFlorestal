import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home/Home';
import CadastroImoveis from './pages/ImovelDetails/CadastroImoveis';
import ViewImoveis from './pages/ImovelDetails/ViewImoveis';
import DespesasGerais from './pages/ExpensePages/DespesasGerais';
import ImovelDetails from './pages/ImovelDetails/ImovelDetails';
import Login from './pages/Login/Login';
import './App.css';

const App = () => {
  // Estado de autenticação
  const [authenticated, setAuthenticated] = useState(false);

  // Verifica se o usuário está autenticado ao iniciar o app
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';
    setAuthenticated(isAuthenticated);
  }, []);

  // Atualiza o estado de autenticação
  const handleLoginSuccess = () => {
    setAuthenticated(true);
    localStorage.setItem('authenticated', 'true');
  };

  const ProtectedRoute = ({ element }) => {
    return authenticated ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <div className="flex-grow-1">
          <Routes>
            {/* Página de Login */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            
            {/* Páginas protegidas */}
            <Route path="/" element={<ProtectedRoute element={<Home />} />} />
            <Route path="/cadastro-imoveis" element={<ProtectedRoute element={<CadastroImoveis />} />} />
            <Route path="/view-imoveis" element={<ProtectedRoute element={<ViewImoveis />} />} />
            <Route path="/despesas-gerais" element={<ProtectedRoute element={<DespesasGerais />} />} />
            <Route path="/imovel/:id" element={<ProtectedRoute element={<ImovelDetails />} />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;

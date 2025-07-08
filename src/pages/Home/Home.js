import React from 'react';
import { Link } from 'react-router-dom';
import { FaBuilding, FaHome, FaFileInvoiceDollar } from 'react-icons/fa';
import './Home.css'; // Usaremos o novo CSS moderno

const Home = () => {
  return (
    <div className="home-page">
      {/* Seção de boas-vindas modernizada */}
      <div className="welcome-section">
        <h1 className="welcome-title">O que você deseja fazer hoje?</h1>
        <p className="welcome-subtitle">Selecione uma das opções abaixo para começar.</p>
      </div>

      {/* Grid de cards de ação */}
      <div className="action-grid">
        <Link to="/cadastro-imoveis" className="action-card-link">
          <div className="action-card">
            <div className="card-icon-wrapper">
              <FaBuilding className="card-icon" />
            </div>
            <h2 className="card-title">Cadastro de Imóveis</h2>
            <p className="card-description">Adicione novos terrenos e propriedades à sua base de dados.</p>
          </div>
        </Link>

        <Link to="/view-imoveis" className="action-card-link">
          <div className="action-card">
            <div className="card-icon-wrapper">
              <FaHome className="card-icon" />
            </div>
            <h2 className="card-title">Visualizar Imóveis</h2>
            <p className="card-description">Consulte, edite e gerencie todas as suas propriedades cadastradas.</p>
          </div>
        </Link>

        <Link to="/despesas-gerais" className="action-card-link">
          <div className="action-card">
            <div className="card-icon-wrapper">
              <FaFileInvoiceDollar className="card-icon" />
            </div>
            <h2 className="card-title">Despesas Gerais</h2>
            <p className="card-description">Registre e controle os custos e despesas associados aos seus imóveis.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;
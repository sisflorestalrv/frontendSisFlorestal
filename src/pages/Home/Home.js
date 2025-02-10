import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../img/logo.png';
import { FaHome, FaBuilding, FaFileInvoiceDollar } from 'react-icons/fa'; // Importando ícones
import './Home.css'; // Importe o CSS exclusivo para esta página

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-logo-container">
        <img src={logo} alt="Logo" className="home-logo" />
        <p className="home-slogan">Sua plataforma de gestão de imóveis e florestas</p>
        <p className="home-subtitle">Gerencie os terrenos com facilidade</p> {/* Novo texto */}
      </div>
      <div className="home-btn-container">
        <div className="btn-group" role="group">
          <Link to="/cadastro-imoveis" className="btn btn-home">
            <FaBuilding className="home-icon" /> Cadastro de Imóveis
          </Link>
          <Link to="/view-imoveis" className="btn btn-home">
            <FaHome className="home-icon" /> Visualizar Imóveis
          </Link>
          <Link to="/despesas-gerais" className="btn btn-home">
            <FaFileInvoiceDollar className="home-icon" /> Despesas Gerais
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

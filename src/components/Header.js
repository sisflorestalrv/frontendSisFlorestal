import React from 'react';
import logo from '../img/logo.png'; // Importando a imagem diretamente

const Header = () => {
  return (
    <nav className="navbar navbar-light navbar-custom">
    
        <img src={logo} width="200" height="100" alt="Logo" />
      
    </nav>
  );
};

export default Header;

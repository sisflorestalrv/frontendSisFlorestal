import React, { useState, useEffect } from 'react';
import logo from '../img/logo.png';
import './Header.css'; // 👈 Importe o novo arquivo CSS

const Header = () => {
  // State para controlar se a página foi rolada ou não
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Função que verifica a posição do scroll
    const handleScroll = () => {
      // Define como true se o scroll for maior que 10px, senão false
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Adiciona o listener de evento de scroll quando o componente montar
    window.addEventListener('scroll', handleScroll);

    // Remove o listener quando o componente desmontar para evitar memory leaks
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // O array vazio [] garante que o efeito rode apenas uma vez (na montagem)

  return (
    // A classe 'scrolled' é adicionada dinamicamente
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <img src={logo} className="header-logo" alt="Logo" />
      {/* Você pode adicionar links de navegação aqui no futuro */}
    </header>
  );
};

export default Header;
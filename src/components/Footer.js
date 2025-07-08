import React from 'react';
import './Footer.css'; // 👈 Importe o novo arquivo CSS

const Footer = () => {
  // Pega o ano atual dinamicamente
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Informações de Copyright */}
        <span className="footer-copyright">
          &copy; {currentYear} Sistema de Imóveis. Todos os direitos reservados.
        </span>

        {/* Links e informações adicionais */}
        <div className="footer-meta">
          <span>Desenvolvido por Lucas Borinelli Mees</span>
        
        </div>
      </div>
    </footer>
  );
};

export default Footer;
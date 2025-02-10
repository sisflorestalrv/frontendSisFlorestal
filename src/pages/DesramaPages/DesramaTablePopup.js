import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DesramaTablePopup.css';

const DesramaTablePopup = ({ isOpen, onClose, imovelId }) => {
  const [desramas, setDesramas] = useState([]);

  useEffect(() => {
    if (isOpen) {
      axios.get(`http://localhost:5000/api/imoveis/${imovelId}/desramas`)
        .then(response => {
          // Filtra registros com todos os campos não nulos
          const registrosCompletos = response.data.filter(desrama =>
            desrama.altura !== null &&
            desrama.data !== null &&
            desrama.numero !== null
          );
          setDesramas(registrosCompletos);
        })
        .catch(error => {
          console.error("Erro ao buscar desramas:", error);
        });
    }
  }, [isOpen, imovelId]);

  const handleDelete = (desramaId) => {
    axios.delete(`http://localhost:5000/api/imoveis/${imovelId}/desramas/${desramaId}`)
      .then(() => {
        setDesramas(desramas.filter(desrama => desrama.id !== desramaId));
        alert('Desrama excluída com sucesso!');
      })
      .catch(error => {
        console.error("Erro ao excluir desrama:", error);
        alert('Erro ao excluir a desrama');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="desrama-table-overlay">
      <div className="desrama-table-container">
        <div className="desrama-table-header">
          <h2 className="desrama-table-title">Desramas do Imóvel {imovelId}</h2>
          <button className="desrama-table-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="desrama-table-body">
          {desramas.length > 0 ? (
            <table className="desrama-table">
              <thead>
                <tr>
                  <th>Altura</th>
                  <th>Data</th>
                  <th>Número</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {desramas.map((desrama) => (
                  <tr key={desrama.id}>
                    <td>{desrama.altura}</td>
                    <td>{new Date(desrama.data).toLocaleDateString('pt-BR')}</td>
                    <td>{desrama.numero}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(desrama.id)}
                        title="Excluir"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="desrama-table-empty">Não há desramas cadastradas para este imóvel.</p>
          )}
        </div>
        <div className="desrama-table-footer">
          <button className="desrama-table-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesramaTablePopup;

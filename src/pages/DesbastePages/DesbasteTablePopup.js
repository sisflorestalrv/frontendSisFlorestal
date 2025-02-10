import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './DesbasteTablePopup.css';

const DesbasteTablePopup = ({ isOpen, onClose, imovelId }) => {
  const [desbasteData, setDesbasteData] = useState([]);

  // Formatação para valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Busca os desbastes do imóvel ao abrir o popup
  useEffect(() => {
    const fetchDesbastes = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/imoveis/${imovelId}/desbastes`);
        setDesbasteData(response.data);
      } catch (error) {
        console.error("Erro ao buscar desbastes:", error);
      }
    };

    if (isOpen) {
      fetchDesbastes();
    }
  }, [isOpen, imovelId]);

  const handleDeleteDesbaste = async (desbasteId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/imoveis/${imovelId}/desbastes/${desbasteId}`);
      alert(response.data.message); // Exibe a mensagem de sucesso
      setDesbasteData(desbasteData.filter((desbaste) => desbaste.id !== desbasteId)); // Remove o desbaste da tabela
    } catch (error) {
      console.error("Erro ao excluir desbaste:", error);
      alert("Erro ao excluir desbaste.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="desbaste-overlay">
      <div className="desbaste-modal-container">
        <div className="desbaste-modal-content">
          <div className="desbaste-modal-body">
            <h5 className="desbaste-modal-title">Desbastes do Imóvel {imovelId}</h5>
            {desbasteData.length > 0 ? (
              <table className="desbaste-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Data</th>
                    <th>Árvores Cortadas</th>
                    <th>Lenha</th>
                    <th>Toretes</th>
                    <th>Toras 20-25 cm</th>
                    <th>Toras 25-33 cm</th>
                    <th>Toras Acima de 33 cm</th>
                    <th>Preço Lenha</th>
                    <th>Preço Toretes</th>
                    <th>Preço Toras 20-25 cm</th>
                    <th>Preço Toras 25-33 cm</th>
                    <th>Preço Toras Acima de 33 cm</th>
                    <th>Valor Extração</th>
                    <th>Total Lenha</th>
                    <th>Total Toretes</th>
                    <th>Total Toras 20-25 cm</th>
                    <th>Total Toras 25-33 cm</th>
                    <th>Total Toras Acima de 33 cm</th>
                    <th>Total Geral</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {desbasteData.map((desbaste) => {
                    const totalLenha = desbaste.lenha * desbaste.preco_lenha;
                    const totalToretes = desbaste.toretes * desbaste.preco_toretes;
                    const totalToras2025cm = desbaste.toras_20_25cm * desbaste.preco_toras_20_25cm;
                    const totalToras2533cm = desbaste.toras_25_33cm * desbaste.preco_toras_25_33cm;
                    const totalTorasAcima33cm = desbaste.toras_acima_33cm * desbaste.preco_toras_acima_33cm;
                    const totalGeral = totalLenha + totalToretes + totalToras2025cm + totalToras2533cm + totalTorasAcima33cm;

                    return (
                      <tr key={desbaste.id}>
                        <td>{desbaste.numero}</td>
                        <td>{new Date(desbaste.data).toLocaleDateString('pt-BR')}</td>
                        <td>{desbaste.arvores_cortadas}</td>
                        <td>{desbaste.lenha}</td>
                        <td>{desbaste.toretes}</td>
                        <td>{desbaste.toras_20_25cm}</td>
                        <td>{desbaste.toras_25_33cm}</td>
                        <td>{desbaste.toras_acima_33cm}</td>
                        <td>{formatCurrency(desbaste.preco_lenha)}</td>
                        <td>{formatCurrency(desbaste.preco_toretes)}</td>
                        <td>{formatCurrency(desbaste.preco_toras_20_25cm)}</td>
                        <td>{formatCurrency(desbaste.preco_toras_25_33cm)}</td>
                        <td>{formatCurrency(desbaste.preco_toras_acima_33cm)}</td>
                        <td>{formatCurrency(desbaste.valor_extracao)}</td>
                        <td>{formatCurrency(totalLenha)}</td>
                        <td>{formatCurrency(totalToretes)}</td>
                        <td>{formatCurrency(totalToras2025cm)}</td>
                        <td>{formatCurrency(totalToras2533cm)}</td>
                        <td>{formatCurrency(totalTorasAcima33cm)}</td>
                        <td>{formatCurrency(totalGeral)}</td>
                        <td>
                          <button className="btn btn-danger" onClick={() => handleDeleteDesbaste(desbaste.id)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="desbaste-no-data">Nenhum desbaste registrado para este imóvel.</p>
            )}
          </div>
          <div className="desbaste-modal-footer">
            <button type="button" className="desbaste-close-btn" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesbasteTablePopup;

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png';
import './DesbasteTablePopup.css';
import { API_BASE_URL } from "../../config";
import { FaFilePdf, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';

const DesbasteTablePopup = ({ isOpen, onClose, imovelId }) => {
    const [desbasteData, setDesbasteData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const formatCurrency = (value) => {
        const number = parseFloat(value);
        if (isNaN(number)) return "R$ 0,00";
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
    };
    
    const formatCurrencyForPdf = (value) => {
        const number = parseFloat(value);
        if (isNaN(number)) return "0,00";
        return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const fetchDesbastes = useCallback(async () => {
    if (!imovelId) return;
    setLoading(true);
    setError(null);
    try {
      // Com axios, os cabeçalhos são passados como segundo argumento
      const response = await axios.get(
        `${API_BASE_URL}/api/imoveis/${imovelId}/desbastes`,
        {
          headers: {
            // A linha da correção:
            'Authorization': 'Basic my-simple-token'
          }
        }
      );
      
      // O axios já trata o .json() e coloca os dados em 'response.data'
      // Também verifica se a resposta é um array para segurança
      setDesbasteData(Array.isArray(response.data) ? response.data : []);

    } catch (error) {
      console.error("Erro ao buscar desbastes:", error);
      
      // Axios coloca a resposta de erro em 'error.response'
      if (error.response && error.response.status === 404) {
        // Se for 404 (não encontrado), simplesmente limpa os dados
        setDesbasteData([]);
      } else {
        setError("Não foi possível carregar os dados de desbaste.");
      }
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

    useEffect(() => {
        if (isOpen) {
            fetchDesbastes();
        } else {
            setDesbasteData([]);
            setLoading(true);
            setError(null);
            setShowDeleteConfirmation(false);
            setItemToDeleteId(null);
            setSelectedItems([]);
        }
    }, [isOpen, fetchDesbastes]);
    
    const handleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = desbasteData.map(item => item.id);
            setSelectedItems(allIds);
        } else {
            setSelectedItems([]);
        }
    };

    const confirmDelete = (id) => {
        setItemToDeleteId(id);
        setShowDeleteConfirmation(true);
    };

    const cancelDelete = () => {
        setItemToDeleteId(null);
        setShowDeleteConfirmation(false);
    };

    const executeDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      // Para axios, passamos a configuração (incluindo headers) como segundo argumento.
      await axios.delete(
        `${API_BASE_URL}/api/imoveis/${imovelId}/desbastes/${itemToDeleteId}`,
        {
          headers: {
            // A linha da correção:
            'Authorization': 'Basic my-simple-token'
          }
        }
      );

      // Atualiza o estado local para refletir a exclusão
      setDesbasteData(prevData => prevData.filter(desbaste => desbaste.id !== itemToDeleteId));
      setSelectedItems(prev => prev.filter(id => id !== itemToDeleteId));

    } catch (err) {
      console.error("Erro ao excluir desbaste:", err);
      // Tenta extrair uma mensagem mais clara do erro, se disponível
      const errorMessage = err.response?.data?.error || "Erro ao excluir o registro de desbaste.";
      setError(errorMessage);
    } finally {
      cancelDelete();
    }
  };
    
    const generateReport = () => {
        const selectedData = desbasteData.filter(item => selectedItems.includes(item.id));

        if (selectedData.length === 0) {
            alert("Por favor, selecione pelo menos um registro para gerar o relatório.");
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.addImage(logo, 'PNG', (pageWidth / 2) - 25, 10, 50, 20);
        doc.setFontSize(16);
        doc.text("Relatório de Desbastes", pageWidth / 2, 40, { align: 'center' });

        const head = [[
            "Nº", "Data", "Árvores", "Lenha", "Toretes", "20-25cm", "25-33cm", "+33cm", 
            "P. Lenha", "P. Toretes", "P. 20-25", "P. 25-33", "P. +33", "V. Extração", 
            "Total Lenha", "Total Toretes", "Total 20-25", "Total 25-33", "Total +33", "Total Geral"
        ]];

        const body = selectedData.map(desbaste => {
            const totalLenha = desbaste.lenha * desbaste.preco_lenha;
            const totalToretes = desbaste.toretes * desbaste.preco_toretes;
            const totalToras2025cm = desbaste.toras_20_25cm * desbaste.preco_toras_20_25cm;
            const totalToras2533cm = desbaste.toras_25_33cm * desbaste.preco_toras_25_33cm;
            const totalTorasAcima33cm = desbaste.toras_acima_33cm * desbaste.preco_toras_acima_33cm;
            const totalGeral = totalLenha + totalToretes + totalToras2025cm + totalToras2533cm + totalTorasAcima33cm;
            
            return [
                desbaste.numero,
                formatDate(desbaste.data),
                desbaste.arvores_cortadas,
                desbaste.lenha,
                desbaste.toretes,
                desbaste.toras_20_25cm,
                desbaste.toras_25_33cm,
                desbaste.toras_acima_33cm,
                formatCurrencyForPdf(desbaste.preco_lenha),
                formatCurrencyForPdf(desbaste.preco_toretes),
                formatCurrencyForPdf(desbaste.preco_toras_20_25cm),
                formatCurrencyForPdf(desbaste.preco_toras_25_33cm),
                formatCurrencyForPdf(desbaste.preco_toras_acima_33cm),
                formatCurrencyForPdf(desbaste.valor_extracao),
                formatCurrencyForPdf(totalLenha),
                formatCurrencyForPdf(totalToretes),
                formatCurrencyForPdf(totalToras2025cm),
                formatCurrencyForPdf(totalToras2533cm),
                formatCurrencyForPdf(totalTorasAcima33cm),
                formatCurrencyForPdf(totalGeral),
            ];
        });

        doc.autoTable({
            head,
            body,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
            styles: { fontSize: 6.5, cellPadding: 1.5, halign: 'right' },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'left' }
            }
        });

        doc.save(`relatorio_desbastes_imovel_${imovelId}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <>
            {showDeleteConfirmation && (
                <div className="delete-confirmation-overlay" onClick={cancelDelete}>
                    <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
                        <FaExclamationTriangle className="warning-icon" />
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir este registro de desbaste? A ação não pode ser desfeita.</p>
                        <div className="modal-footer-stacked">
                            <button className="btn-danger-stacked" onClick={executeDelete}>
                                <FaTrashAlt /> Confirmar Exclusão
                            </button>
                            <button className="btn-link-stacked" onClick={cancelDelete}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="desbaste-modal-overlay" onClick={onClose}>
                <div className="desbaste-modal-content" onClick={(e) => e.stopPropagation()}>
                    <header className="desbaste-modal-header">
                        <h2 className="desbaste-modal-title">Relatório de Desbastes</h2>
                        <button className="desbaste-modal-close-btn" onClick={onClose}>&times;</button>
                    </header>

                    <main className="desbaste-modal-body">
                        {loading ? ( <p className="desbaste-loading-message">Carregando...</p> ) : 
                        error ? ( <p className="desbaste-error-message">{error}</p> ) : 
                        desbasteData.length > 0 ? (
                            <div className="desbaste-table-responsive">
                                <table className="desbaste-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input 
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={selectedItems.length === desbasteData.length && desbasteData.length > 0}
                                                    ref={el => el && (el.indeterminate = selectedItems.length > 0 && selectedItems.length < desbasteData.length)}
                                                    title="Selecionar Todos"
                                                />
                                            </th>
                                            <th>Número</th>
                                            <th>Data</th>
                                            <th>Árvores Cortadas</th>
                                            <th>Lenha</th>
                                            <th>Toretes</th>
                                            <th>Toras 20-25cm</th>
                                            <th>Toras 25-33cm</th>
                                            <th>Toras +33cm</th>
                                            <th>Preço Lenha</th>
                                            <th>Preço Toretes</th>
                                            <th>Preço 20-25cm</th>
                                            <th>Preço 25-33cm</th>
                                            <th>Preço +33cm</th>
                                            <th>Valor Extração</th>
                                            <th>Total Lenha</th>
                                            <th>Total Toretes</th>
                                            <th>Total 20-25cm</th>
                                            <th>Total 25-33cm</th>
                                            <th>Total +33cm</th>
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
                                                <tr key={desbaste.id} className={selectedItems.includes(desbaste.id) ? 'selected-row' : ''}>
                                                    <td>
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedItems.includes(desbaste.id)}
                                                            onChange={() => handleSelectItem(desbaste.id)}
                                                        />
                                                    </td>
                                                    <td>{desbaste.numero}</td>
                                                    <td>{formatDate(desbaste.data)}</td>
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
                                                    <td className="total-cell">{formatCurrency(totalLenha)}</td>
                                                    <td className="total-cell">{formatCurrency(totalToretes)}</td>
                                                    <td className="total-cell">{formatCurrency(totalToras2025cm)}</td>
                                                    <td className="total-cell">{formatCurrency(totalToras2533cm)}</td>
                                                    <td className="total-cell">{formatCurrency(totalTorasAcima33cm)}</td>
                                                    <td className="total-geral-cell">{formatCurrency(totalGeral)}</td>
                                                    <td>
                                                        <button className="action-btn-desbaste btn-delete-desbaste" onClick={() => confirmDelete(desbaste.id)}>
                                                            <FaTrashAlt />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : ( <p className="desbaste-no-data">Nenhum desbaste registrado para este imóvel.</p> )}
                    </main>

                    <footer className="desbaste-modal-footer">
                        <button type="button" className="modal-btn-desbaste btn-cancel-desbaste" onClick={onClose}>
                            Fechar
                        </button>
                        <button 
                            type="button" 
                            className="modal-btn-desbaste btn-success-desbaste" 
                            onClick={generateReport} 
                            disabled={selectedItems.length === 0}
                        >
                           <FaFilePdf /> Gerar Relatório
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default DesbasteTablePopup;
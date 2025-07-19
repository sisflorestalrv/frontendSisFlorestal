import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png';
import './DesramaTablePopup.css';
import { API_BASE_URL } from "../../config";
import { FaFilePdf, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';

const DesramaTablePopup = ({ isOpen, onClose, imovelId }) => {
    const [desramaData, setDesramaData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const fetchDesramas = useCallback(async () => {
    if (!imovelId) return;
    setLoading(true);
    setError(null);
    try {
      // Adicionamos o objeto de configuração com os headers no axios.get
      const response = await axios.get(
        `${API_BASE_URL}/api/imoveis/${imovelId}/desramas`,
        {
          headers: {
            // A linha da correção:
            'Authorization': 'Basic my-simple-token'
          }
        }
      );

      // Garante que a resposta seja um array antes de filtrar
      const data = Array.isArray(response.data) ? response.data : [];

      const registrosCompletos = data.filter(desrama =>
        desrama.altura !== null &&
        desrama.data !== null &&
        desrama.numero !== null
      );
      
      setDesramaData(registrosCompletos);

    } catch (error) {
      console.error("Erro ao buscar desramas:", error);

      // Trata o caso de 404 (sem desramas) para não mostrar erro
      if (error.response && error.response.status === 404) {
        setDesramaData([]);
      } else {
        setError("Não foi possível carregar os dados de desrama.");
      }
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

  useEffect(() => {
    if (isOpen) {
        fetchDesramas();
    } else {
        // Reseta o estado quando o popup fecha
        setDesramaData([]);
        setLoading(true);
        setError(null);
        setShowDeleteConfirmation(false);
        setItemToDeleteId(null);
        setSelectedItems([]);
    }
  }, [isOpen, fetchDesramas]); // <-- CORREÇÃO APLICADA AQUI

    const handleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = desramaData.map(item => item.id);
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
      // Adiciona o objeto de configuração com os headers ao axios.delete
      await axios.delete(
        `${API_BASE_URL}/api/imoveis/${imovelId}/desramas/${itemToDeleteId}`,
        {
          headers: {
            // A linha da correção:
            'Authorization': 'Basic my-simple-token'
          }
        }
      );
      
      // Atualiza o estado local para remover o item da lista
      setDesramaData(prevData => prevData.filter(desrama => desrama.id !== itemToDeleteId));
      setSelectedItems(prev => prev.filter(id => id !== itemToDeleteId));

    } catch (err) {
      console.error("Erro ao excluir desrama:", err);
      const errorMessage = err.response?.data?.error || "Erro ao excluir o registro de desrama.";
      setError(errorMessage);
    } finally {
      cancelDelete(); // Fecha o modal de confirmação
    }
  };

    const generateReport = () => {
        const selectedData = desramaData.filter(item => selectedItems.includes(item.id));

        if (selectedData.length === 0) {
            alert("Por favor, selecione pelo menos um registro para gerar o relatório.");
            return;
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.addImage(logo, 'PNG', (pageWidth / 2) - 25, 15, 50, 20);
        doc.setFontSize(18);
        doc.text("Relatório de Desramas", pageWidth / 2, 50, { align: 'center' });

        const head = [["Número", "Altura", "Data"]];
        const body = selectedData.map(desrama => [
            desrama.numero,
            desrama.altura,
            formatDate(desrama.data)
        ]);

        doc.autoTable({
            head,
            body,
            startY: 60,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 3 },
        });

        doc.save(`relatorio_desramas_imovel_${imovelId}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <>
            {showDeleteConfirmation && (
                <div className="delete-confirmation-overlay" onClick={cancelDelete}>
                    <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
                        <FaExclamationTriangle className="warning-icon" />
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir este registro de desrama? A ação não pode ser desfeita.</p>
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
            
            <div className="desrama-modal-overlay" onClick={onClose}>
                <div className="desrama-modal-content" onClick={(e) => e.stopPropagation()}>
                    <header className="desrama-modal-header">
                        <h2 className="desrama-modal-title">Relatório de Desramas</h2>
                        <button className="desrama-modal-close-btn" onClick={onClose}>&times;</button>
                    </header>

                    <main className="desrama-modal-body">
                        {loading ? ( <p className="desrama-loading-message">Carregando...</p> ) : 
                        error ? ( <p className="desrama-error-message">{error}</p> ) : 
                        desramaData.length > 0 ? (
                            <div className="desrama-table-responsive">
                                <table className="desrama-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input 
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={selectedItems.length === desramaData.length && desramaData.length > 0}
                                                    ref={el => el && (el.indeterminate = selectedItems.length > 0 && selectedItems.length < desramaData.length)}
                                                    title="Selecionar Todos"
                                                />
                                            </th>
                                            <th>Número</th>
                                            <th>Altura</th>
                                            <th>Data</th>
                                            <th>Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {desramaData.map((desrama) => (
                                            <tr key={desrama.id} className={selectedItems.includes(desrama.id) ? 'selected-row' : ''}>
                                                <td>
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedItems.includes(desrama.id)}
                                                        onChange={() => handleSelectItem(desrama.id)}
                                                    />
                                                </td>
                                                <td>{desrama.numero}</td>
                                                <td>{desrama.altura}</td>
                                                <td>{formatDate(desrama.data)}</td>
                                                <td>
                                                    <button className="action-btn-desrama btn-delete-desrama" onClick={() => confirmDelete(desrama.id)}>
                                                        <FaTrashAlt />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : ( <p className="desrama-no-data">Nenhuma desrama registrada para este imóvel.</p> )}
                    </main>

                    <footer className="desrama-modal-footer">
                        <button type="button" className="modal-btn-desrama btn-cancel-desrama" onClick={onClose}>
                            Fechar
                        </button>
                        <button 
                            type="button" 
                            className="modal-btn-desrama btn-success-desrama" 
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

export default DesramaTablePopup;
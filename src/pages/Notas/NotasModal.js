import React, { useState, useEffect, useCallback } from "react";
import "./NotasModal.css";
import { FaEdit, FaTrashAlt, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from "../../config";

const initialFormState = { titulo: "", descricao: "" };

const NotasModal = ({ isOpen, onClose, imovelId }) => {
    const [notas, setNotas] = useState([]);
    const [formData, setFormData] = useState(initialFormState);
    const [editingNotaId, setEditingNotaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [notaToDeleteId, setNotaToDeleteId] = useState(null);

    const fetchNotas = useCallback(async () => {
    if (!imovelId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/notas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // A linha da correção:
          'Authorization': 'Basic my-simple-token'
        }
      });

      // Se a resposta for 404, trata como uma lista vazia, não um erro.
      if (response.status === 404) {
        setNotas([]);
        return; 
      }

      if (!response.ok) {
        throw new Error("Falha ao carregar as notas.");
      }
      
      const data = await response.json();
      setNotas(Array.isArray(data) ? data : []);

    } catch (err) {
      setError(err.message);
      setNotas([]); // Garante que notas seja um array em caso de erro.
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

    useEffect(() => {
        if (isOpen) {
            fetchNotas();
        } else {
            setNotas([]);
            setFormData(initialFormState);
            setEditingNotaId(null);
            setError(null);
            setLoading(true);
            setShowDeleteConfirmation(false);
            setNotaToDeleteId(null);
        }
    }, [isOpen, fetchNotas]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditClick = (nota) => {
        setEditingNotaId(nota.id);
        setFormData({ titulo: nota.titulo, descricao: nota.descricao });
        document.querySelector('.notes-form-input[name="titulo"]').focus();
    };

    const handleCancelEdit = () => {
        setEditingNotaId(null);
        setFormData(initialFormState);
    };

    const handleSaveNota = async () => {
    const url = editingNotaId
        ? `${API_BASE_URL}/api/imoveis/${imovelId}/notas/${editingNotaId}`
        : `${API_BASE_URL}/api/imoveis/${imovelId}/notas`;
    const method = editingNotaId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                // A linha da correção:
                "Authorization": "Basic my-simple-token"
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro ao salvar a nota.`);
        }

        handleCancelEdit();
        await fetchNotas();

    } catch (err) {
        setError(err.message);
    }
};
    const confirmDelete = (notaId) => {
        setNotaToDeleteId(notaId);
        setShowDeleteConfirmation(true);
    };
    
    const cancelDelete = () => {
        setShowDeleteConfirmation(false);
        setNotaToDeleteId(null);
    };
    
    const executeDelete = async () => {
    if (!notaToDeleteId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/notas/${notaToDeleteId}`, {
            method: "DELETE",
            headers: {
                // A linha da correção:
                "Authorization": "Basic my-simple-token"
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao excluir a nota.");
        }

        // Se a nota excluída era a que estava em edição, cancela a edição.
        if (editingNotaId === notaToDeleteId) {
            handleCancelEdit();
        }
        
        await fetchNotas(); // Recarrega a lista de notas

    } catch (err) {
        setError(err.message);
    } finally {
        cancelDelete(); // Fecha o modal de confirmação
    }
};

    if (!isOpen) return null;

    return (
        <>
            {showDeleteConfirmation && (
                // MUDANÇA AQUI: Adicionamos a classe 'delete-confirmation-overlay'
                <div className="delete-confirmation-overlay" onClick={cancelDelete}>
                    <div className="delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
                        <FaExclamationTriangle className="warning-icon" />
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.</p>
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

            <div className="notes-modal-overlay" onClick={onClose}>
                <div className="notes-modal-content" onClick={(e) => e.stopPropagation()}>
                    <header className="notes-modal-header">
                        <h2 className="notes-modal-title">Notas do Imóvel</h2>
                        <button className="notes-modal-close-btn" onClick={onClose}>&times;</button>
                    </header>
                    <main className="notes-modal-body">
                         {/* O restante do código do modal de notas permanece o mesmo */}
                        <div className="notes-form-section">
                            <h3 className="notes-section-title">{editingNotaId ? "Editando Nota" : "Adicionar Nova Nota"}</h3>
                            <div className="notes-input-group">
                                <input
                                    type="text"
                                    name="titulo"
                                    placeholder="Título da nota"
                                    value={formData.titulo}
                                    onChange={handleInputChange}
                                    className="notes-form-input"
                                />
                                <textarea
                                    name="descricao"
                                    placeholder="Descreva a nota aqui..."
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    className="notes-form-textarea"
                                    rows="4"
                                ></textarea>
                            </div>
                            <div className="notes-form-actions">
                                {editingNotaId && (
                                    <button onClick={handleCancelEdit} className="modal-btn-notes modal-btn-cancel-notes">
                                        <FaTimes /> Cancelar Edição
                                    </button>
                                )}
                                <button onClick={handleSaveNota} className="modal-btn-notes modal-btn-success-notes">
                                    {editingNotaId ? <><FaEdit /> Atualizar Nota</> : <><FaPlus /> Adicionar Nota</>}
                                </button>
                            </div>
                            {error && <p className="notes-error-message">{error}</p>}
                        </div>

                        <div className="notes-divider"></div>

                        <div className="notes-table-section">
                            <h3 className="notes-section-title">Notas Registradas</h3>
                            {loading ? ( <p>Carregando notas...</p> ) : 
                            notas.length === 0 ? ( <p className="notes-empty-message">Nenhuma nota registrada para este imóvel.</p> ) : 
                            (
                                <div className="notes-table-responsive">
                                    <table className="notes-table">
                                        <thead>
                                            <tr>
                                                <th>Título</th>
                                                <th>Descrição</th>
                                                <th className="actions-column">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {notas.map((nota) => (
                                                <tr key={nota.id}>
                                                    <td>{nota.titulo}</td>
                                                    <td className="description-cell"><p>{nota.descricao}</p></td>
                                                    <td className="actions-column">
                                                        <button onClick={() => handleEditClick(nota)} className="action-btn btn-edit" title="Editar">
                                                            <FaEdit />
                                                        </button>
                                                        <button onClick={() => confirmDelete(nota.id)} className="action-btn btn-delete" title="Excluir">
                                                            <FaTrashAlt />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                    
                    <footer className="notes-modal-footer">
                        <button className="modal-btn-notes modal-btn-cancel-notes" onClick={onClose}>
                            Fechar
                        </button>
                    </footer>
                </div>
            </div>
        </>
    );
};

export default NotasModal;
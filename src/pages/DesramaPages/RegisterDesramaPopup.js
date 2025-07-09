import React, { useState, useEffect, useCallback } from 'react';
import './RegisterDesramaPopup.css';
import { API_BASE_URL } from "../../config";
import { FaCalendarPlus, FaEdit, FaTimes, FaArrowLeft } from 'react-icons/fa';

const initialPrevisaoState = { previsao: '' };
const initialFulfillmentState = { altura: '', numero: '', data: '' };

const RegisterDesramaPopup = ({ isOpen, onClose, imovelId }) => {
    const [previsoes, setPrevisoes] = useState([]);
    const [previsaoData, setPrevisaoData] = useState(initialPrevisaoState);
    const [fulfillmentData, setFulfillmentData] = useState(initialFulfillmentState);

    const [selectedPrevisao, setSelectedPrevisao] = useState(null); // Controls which view is active
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : "N/A";
    };

    const fetchPrevisoes = useCallback(async () => {
        if (!imovelId) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/desramas/previsoes`);
            if (!response.ok) throw new Error("Erro ao carregar previsões pendentes.");
            const data = await response.json();
            setPrevisoes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [imovelId]);

    useEffect(() => {
        if (isOpen) {
            fetchPrevisoes();
        } else {
            // Reset all states on close
            setTimeout(() => {
                setPrevisoes([]);
                setPrevisaoData(initialPrevisaoState);
                setFulfillmentData(initialFulfillmentState);
                setSelectedPrevisao(null);
                setError('');
                setSuccess('');
            }, 300);
        }
    }, [isOpen, fetchPrevisoes]);

    const handlePrevisaoChange = (e) => setPrevisaoData({ ...previsaoData, [e.target.name]: e.target.value });
    const handleFulfillmentChange = (e) => setFulfillmentData({ ...fulfillmentData, [e.target.name]: e.target.value });

    const handlePrevisaoSubmit = async (e) => {
        e.preventDefault();
        if (!previsaoData.previsao) {
            setError("O campo 'previsão' é obrigatório!");
            return;
        }
        setIsSubmitting(true);
        setError(''); setSuccess('');
        try {
            await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/desramas/previsao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(previsaoData),
            });
            setSuccess("Previsão registrada com sucesso!");
            setPrevisaoData(initialPrevisaoState);
            fetchPrevisoes();
        } catch (err) {
            setError("Erro ao registrar a previsão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFulfillmentSubmit = async (e) => {
        e.preventDefault();
        const { altura, numero, data } = fulfillmentData;
        if (!altura || !numero || !data) {
            setError("Todos os campos (altura, número e data) são obrigatórios!");
            return;
        }
        
        setIsSubmitting(true);
        setError(''); setSuccess('');
        try {
            const formattedData = { ...fulfillmentData, altura: altura.replace(",", ".") };
            await fetch(`${API_BASE_URL}/api/desramas/${selectedPrevisao.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });
            setSuccess("Desrama registrada com sucesso na previsão!");
            setSelectedPrevisao(null); // Volta para a tela principal
            fetchPrevisoes();
        } catch (err) {
            setError("Falha ao registrar a desrama.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const renderMainView = () => (
        <>
            <form onSubmit={handlePrevisaoSubmit}>
                <section className="register-desrama-section">
                    <h3 className="register-desrama-section-title">Adicionar Nova Previsão de Desrama</h3>
                    <div className="previsao-form-group">
                        <input
                            type="date"
                            name="previsao"
                            value={previsaoData.previsao}
                            onChange={handlePrevisaoChange}
                            className="form-input"
                        />
                        <button type="submit" className="modal-btn btn-secondary" disabled={isSubmitting}>
                            <FaCalendarPlus /> {isSubmitting ? 'Registrando...' : 'Registrar Previsão'}
                        </button>
                    </div>
                </section>
            </form>
            <div className="register-desrama-divider"></div>
            <section className="register-desrama-section">
                <h3 className="register-desrama-section-title">Previsões Pendentes</h3>
                <div className="previsoes-list-container">
                    {isLoading ? <p>Carregando...</p> :
                     previsoes.length === 0 ? <p className="empty-message">Nenhuma previsão pendente.</p> :
                     (
                        <ul className="previsoes-list">
                            {previsoes.map((prev) => (
                                <li key={prev.id} className="previsao-item">
                                    <span>{formatDate(prev.previsao)}</span>
                                    <button onClick={() => setSelectedPrevisao(prev)} className="modal-btn btn-success">
                                        <FaEdit /> Registrar Desrama
                                    </button>
                                </li>
                            ))}
                        </ul>
                     )
                    }
                </div>
            </section>
        </>
    );

    const renderFulfillmentView = () => (
        <form onSubmit={handleFulfillmentSubmit}>
            <section className="register-desrama-section">
                <h3 className="register-desrama-section-title">
                    Registrando Desrama para {formatDate(selectedPrevisao.previsao)}
                </h3>
                <div className="form-grid">
                    <div className="input-group">
                        <label htmlFor="altura" className="form-label">Altura (m)</label>
                        <input id="altura" name="altura" type="text" value={fulfillmentData.altura} onChange={handleFulfillmentChange} className="form-input" placeholder="Ex: 5,50"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="numero" className="form-label">Número</label>
                        <input id="numero" name="numero" type="number" value={fulfillmentData.numero} onChange={handleFulfillmentChange} className="form-input" />
                    </div>
                    <div className="input-group full-width">
                        <label htmlFor="data" className="form-label">Data da Execução</label>
                        <input id="data" name="data" type="date" value={fulfillmentData.data} onChange={handleFulfillmentChange} className="form-input" />
                    </div>
                </div>
            </section>
        </form>
    );

    return (
        <div className="register-desrama-overlay" onClick={onClose}>
            <div className="register-desrama-content" onClick={(e) => e.stopPropagation()}>
                <header className="register-desrama-header">
                    <h2 className="register-desrama-title">Registrar Desrama</h2>
                    <button className="register-desrama-close-btn" onClick={onClose}>&times;</button>
                </header>

                <main className="register-desrama-body">
                    {error && <div className="feedback-message error-message">{error}</div>}
                    {success && <div className="feedback-message success-message">{success}</div>}
                    {selectedPrevisao ? renderFulfillmentView() : renderMainView()}
                </main>
                
                <footer className="register-desrama-footer">
                    {selectedPrevisao ? (
                        <>
                            <button type="button" className="modal-btn btn-cancel" onClick={() => setSelectedPrevisao(null)}>
                                <FaArrowLeft /> Voltar
                            </button>
                            <button type="button" className="modal-btn btn-success" onClick={handleFulfillmentSubmit} disabled={isSubmitting}>
                                <FaEdit /> {isSubmitting ? 'Salvando...' : 'Salvar Desrama'}
                            </button>
                        </>
                    ) : (
                        <button type="button" className="modal-btn btn-cancel" onClick={onClose}>
                            <FaTimes /> Fechar
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default RegisterDesramaPopup;
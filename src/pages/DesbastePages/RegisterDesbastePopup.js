import React, { useState, useEffect, useCallback } from 'react';
import './RegisterDesbastePopup.css';
import { API_BASE_URL } from "../../config";
import { FaCalendarPlus, FaEdit, FaTimes, FaArrowLeft } from 'react-icons/fa';

const initialFulfillmentState = {
    numero: "", data: "", arvores_cortadas: "", lenha: "", toretes: "",
    toras_20_25cm: "", toras_25_33cm: "", toras_acima_33cm: "", preco_lenha: "",
    preco_toretes: "", preco_toras_20_25cm: "", preco_toras_25_33cm: "",
    preco_toras_acima_33cm: "", valor_extracao: "",
};

const RegisterDesbastePopup = ({ isOpen, onClose, imovelId }) => {
    const [previsoes, setPrevisoes] = useState([]);
    const [previsaoDate, setPrevisaoDate] = useState('');
    const [fulfillmentData, setFulfillmentData] = useState(initialFulfillmentState);
    const [selectedPrevisao, setSelectedPrevisao] = useState(null);
    
    const [isLoading, setIsLoading] = useState(true);
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
            const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/desbastes/previsoes`);
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
            setTimeout(() => {
                setPrevisoes([]);
                setPrevisaoDate('');
                setFulfillmentData(initialFulfillmentState);
                setSelectedPrevisao(null);
                setError('');
                setSuccess('');
            }, 300);
        }
    }, [isOpen, fetchPrevisoes]);

    // Popula o formulário de preenchimento quando uma previsão é selecionada
    useEffect(() => {
        if (selectedPrevisao) {
            const dataToSet = {};
            for (const key in initialFulfillmentState) {
                dataToSet[key] = selectedPrevisao[key] || ''; // Garante que todos os campos sejam preenchidos
            }
            setFulfillmentData(dataToSet);
        }
    }, [selectedPrevisao]);

    const handleFulfillmentChange = (e) => setFulfillmentData({ ...fulfillmentData, [e.target.name]: e.target.value });

    const handlePrevisaoSubmit = async (e) => {
        e.preventDefault();
        if (!previsaoDate) {
            setError("O campo 'previsão' é obrigatório!");
            return;
        }
        setIsSubmitting(true);
        setError(''); setSuccess('');
        try {
            await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/desbastes/previsao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ previsao: previsaoDate }),
            });
            setSuccess("Previsão de desbaste registrada com sucesso!");
            setPrevisaoDate('');
            fetchPrevisoes();
        } catch (err) {
            setError("Erro ao registrar a previsão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFulfillmentSubmit = async (e) => {
        e.preventDefault();
        if (!fulfillmentData.numero || !fulfillmentData.data || !fulfillmentData.arvores_cortadas) {
            setError("Os campos Número, Data e Árvores Cortadas são obrigatórios!");
            return;
        }
        
        setIsSubmitting(true);
        setError(''); setSuccess('');
        try {
            await fetch(`${API_BASE_URL}/api/desbastes/${selectedPrevisao.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fulfillmentData),
            });
            setSuccess("Desbaste registrado com sucesso na previsão!");
            setSelectedPrevisao(null);
            fetchPrevisoes();
        } catch (err) {
            setError("Falha ao registrar o desbaste.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const renderMainView = () => (
        <>
            <form onSubmit={handlePrevisaoSubmit}>
                <section className="register-desbaste-section">
                    <h3 className="register-desbaste-section-title">Adicionar Nova Previsão de Desbaste</h3>
                    <div className="previsao-form-group">
                        <input
                            type="date"
                            name="previsao"
                            value={previsaoDate}
                            onChange={(e) => setPrevisaoDate(e.target.value)}
                            className="form-input"
                        />
                        <button type="submit" className="modal-btn btn-secondary" disabled={isSubmitting}>
                            <FaCalendarPlus /> {isSubmitting ? 'Registrando...' : 'Registrar Previsão'}
                        </button>
                    </div>
                </section>
            </form>
            <div className="register-desbaste-divider"></div>
            <section className="register-desbaste-section">
                <h3 className="register-desbaste-section-title">Previsões Pendentes</h3>
                <div className="previsoes-list-container">
                    {isLoading ? <p>Carregando...</p> :
                     previsoes.length === 0 ? <p className="empty-message">Nenhuma previsão pendente.</p> :
                     (
                        <ul className="previsoes-list">
                            {previsoes.map((prev) => (
                                <li key={prev.id} className="previsao-item">
                                    <span>{formatDate(prev.previsao)}</span>
                                    <button onClick={() => setSelectedPrevisao(prev)} className="modal-btn btn-success">
                                        <FaEdit /> Registrar Desbaste
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
            <section className="register-desbaste-section">
                <h3 className="register-desbaste-section-title">
                    Registrando Desbaste para {formatDate(selectedPrevisao.previsao)}
                </h3>
                <div className="form-grid">
                    {Object.keys(initialFulfillmentState).map(key => {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return (
                            <div key={key} className="input-group">
                                <label htmlFor={key} className="form-label">{label}</label>
                                <input id={key} name={key} type={key === 'data' ? 'date' : 'number'} value={fulfillmentData[key]} onChange={handleFulfillmentChange} className="form-input" step="0.01"/>
                            </div>
                        )
                    })}
                </div>
            </section>
        </form>
    );

    return (
        <div className="register-desbaste-overlay" onClick={onClose}>
            <div className="register-desbaste-content" onClick={(e) => e.stopPropagation()}>
                <header className="register-desbaste-header">
                    <h2 className="register-desbaste-title">Registrar Desbaste</h2>
                    <button className="register-desbaste-close-btn" onClick={onClose}>&times;</button>
                </header>

                <main className="register-desbaste-body">
                    {error && <div className="feedback-message error-message">{error}</div>}
                    {success && <div className="feedback-message success-message">{success}</div>}
                    {selectedPrevisao ? renderFulfillmentView() : renderMainView()}
                </main>
                
                <footer className="register-desbaste-footer">
                    {selectedPrevisao ? (
                        <>
                            <button type="button" className="modal-btn btn-cancel" onClick={() => setSelectedPrevisao(null)}>
                                <FaArrowLeft /> Voltar
                            </button>
                            <button type="button" className="modal-btn btn-success" onClick={handleFulfillmentSubmit} disabled={isSubmitting}>
                                <FaEdit /> {isSubmitting ? 'Salvando...' : 'Salvar Desbaste'}
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

export default RegisterDesbastePopup;
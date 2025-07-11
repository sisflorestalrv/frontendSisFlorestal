import React, { useState, useEffect, useCallback } from 'react';
import './RegisterDespesaPopup.css';
import { API_BASE_URL } from "../../config";
import { FaSave, FaTimes } from 'react-icons/fa';

const initialState = {
    data: '',
    descricao: '',
    numero_nota_fiscal: '',
    fornecedor: '',
    produto: '',
    unidade: '',
    quantidade: '',
    valor_unitario: '',
    total: '',
    tipo_de_despesa: '',
    validade: '',
};

const tiposDespesa = [
    "Compra de florestas", "Compra de mudas", "Compra de sementes","Serviço de Conserto de Cerca" ,
    "Serviço de abertura e manutenção de estradas", "Serviços de corte", "Serviços de plantio",
    "Serviços de coroamento", "Serviços de roçada", "Serviços de desrama", "Serviço de preparo de solo",
    "Aplicação de adubo", "Aplicação de herbicidas", "Aplicação de inseticidas", "Serviço de georreferenciamento",
    "Serviço de Construção de Cerca", "Serviço de Desbaste", "Serviço de Contagem de Árvores", "Serviço de Inventário",
    "Serviço de Corte de Brotos", "Serviço de Limpeza de Área"
];

const RegisterDespesaPopup = ({ isOpen, onClose, imovelId }) => {
    const [formData, setFormData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Efeito para auto-calcular o total
    useEffect(() => {
        const quantidade = parseFloat(formData.quantidade) || 0;
        const valorUnitario = parseFloat(formData.valor_unitario) || 0;
        const total = quantidade * valorUnitario;

        if (total.toFixed(2) !== parseFloat(formData.total).toFixed(2)) {
            setFormData(prev => ({ ...prev, total: total.toFixed(2) }));
        }
    }, [formData.quantidade, formData.valor_unitario, formData.total]);

    // Efeito para limpar o estado quando o modal fecha
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFormData(initialState);
                setError('');
                setSuccess('');
                setIsLoading(false);
            }, 300); // Aguarda a animação de fechar
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpa as mensagens ao começar a digitar
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validação
        for (const key in formData) {
            // numero_nota_fiscal é opcional
            if (key !== 'numero_nota_fiscal' && formData[key] === '') {
                setError(`O campo "${key.replace(/_/g, ' ')}" é obrigatório.`);
                return;
            }
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/despesas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, imovel_id: imovelId }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Erro ao registrar despesa');
            }
            
            setSuccess('Despesa registrada com sucesso!');
            setFormData(initialState); // Limpa o formulário

        } catch (err) {
            setError(err.message || 'Falha ao registrar despesa. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="register-despesa-overlay" onClick={onClose}>
            <div className="register-despesa-content" onClick={(e) => e.stopPropagation()}>
                <header className="register-despesa-header">
                    <h2 className="register-despesa-title">Registrar Nova Despesa</h2>
                    <button className="register-despesa-close-btn" onClick={onClose}>&times;</button>
                </header>

                <form onSubmit={handleSubmit} noValidate>
                    <main className="register-despesa-body">
                        {error && <div className="feedback-message error-message">{error}</div>}
                        {success && <div className="feedback-message success-message">{success}</div>}

                        <div className="form-grid">
                            {Object.keys(initialState).map(key => {
                                const isReadOnly = key === 'total';
                                const type = key === 'data' || key === 'validade' ? 'date' :
                                             key === 'quantidade' || key === 'valor_unitario' ? 'number' : 'text';
                                const isFullWidth = key === 'descricao' || key === 'tipo_de_despesa';
                                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                if (key === 'tipo_de_despesa') {
                                    return (
                                        <div key={key} className="input-group full-width">
                                            <label htmlFor={key} className="form-label">{label}</label>
                                            <select id={key} name={key} value={formData[key]} onChange={handleChange} className="form-input">
                                                <option value="">Selecione um tipo...</option>
                                                {tiposDespesa.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                            </select>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className={`input-group ${isFullWidth ? 'full-width' : ''}`}>
                                        <label htmlFor={key} className="form-label">{label}</label>
                                        {isFullWidth ? (
                                            <textarea id={key} name={key} value={formData[key]} onChange={handleChange} className="form-input" rows="3" />
                                        ) : (
                                            <input
                                                id={key}
                                                name={key}
                                                type={type}
                                                value={formData[key]}
                                                onChange={handleChange}
                                                className="form-input"
                                                readOnly={isReadOnly}
                                                style={isReadOnly ? { backgroundColor: '#e9ecef', fontWeight: 'bold' } : {}}
                                                step={type === 'number' ? '0.01' : undefined}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    <footer className="register-despesa-footer">
                        <button type="button" className="modal-btn btn-cancel" onClick={onClose}>
                            <FaTimes /> Cancelar
                        </button>
                        <button type="submit" className="modal-btn btn-success" disabled={isLoading}>
                            <FaSave /> {isLoading ? 'Salvando...' : 'Salvar Despesa'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default RegisterDespesaPopup;
import React, { useState, useEffect } from 'react';
import './EditExpenseModal.css';

// Função para formatar a moeda
const formatCurrency = (value) => {
    const number = parseFloat(value);
    return isNaN(number)
      ? "R$ 0,00"
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(number);
};

const tiposDespesa = [
    "Compra de florestas", "Compra de mudas", "Compra de sementes", "Serviço de Conserto de Cerca" ,
    "Serviço de abertura e manutenção de estradas", "Serviços de corte", "Serviços de plantio",
    "Serviços de coroamento", "Serviços de roçada", "Serviços de desrama", "Serviço de preparo de solo",
    "Aplicação de adubo", "Aplicação de herbicidas", "Aplicação de inseticidas", "Serviço de georreferenciamento",
    "Serviço de Construção de Cerca", "Serviço de Desbaste", "Serviço de Contagem de Árvores", "Serviço de Inventário",
    "Serviço de Corte de Brotos", "Serviço de Limpeza de Área", "Serviço de Replante"
];

const EditExpenseModal = ({ isOpen, onClose, expense, onSave }) => {
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (expense) {
      const formattedDate = expense.validade
        ? new Date(expense.validade).toISOString().split("T")[0]
        : "";
      setFormData({ ...expense, validade: formattedDate });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };

    if (name === "quantidade" || name === "valor_unitario") {
      const quantidade = parseFloat(newFormData.quantidade) || 0;
      const valorUnitario = parseFloat(newFormData.valor_unitario) || 0;
      newFormData.total = (quantidade * valorUnitario).toFixed(2);
    }
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="edit-modal-header">
          <h2>Editar Despesa</h2>
          <button onClick={onClose} className="edit-modal-close-btn">
            &times;
          </button>
        </header>
        <form onSubmit={handleSubmit} className="edit-modal-form">
          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="tipo_de_despesa">Tipo de Despesa</label>
              <select
                id="tipo_de_despesa"
                name="tipo_de_despesa"
                value={formData.tipo_de_despesa}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Selecione um tipo...</option>
                {tiposDespesa.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="fornecedor">Fornecedor</label>
              <input type="text" id="fornecedor" name="fornecedor" value={formData.fornecedor} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="produto">Produto</label>
              <input type="text" id="produto" name="produto" value={formData.produto} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="unidade">Unidade</label>
              <input type="text" id="unidade" name="unidade" value={formData.unidade} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade</label>
              <input type="number" step="0.01" id="quantidade" name="quantidade" value={formData.quantidade} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="valor_unitario">Valor Unitário</label>
              <input type="number" step="0.01" id="valor_unitario" name="valor_unitario" value={formData.valor_unitario} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="validade">Vencimento</label>
              <input type="date" id="validade" name="validade" value={formData.validade} onChange={handleChange} required />
            </div>
             <div className="form-group">
              <label>Total Calculado</label>
              <input type="text" value={formatCurrency(formData.total)} readOnly disabled />
            </div>
          </div>
          <footer className="edit-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Salvar Alterações
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
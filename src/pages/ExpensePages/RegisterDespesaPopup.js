import React, { useState } from 'react';
import './RegisterDespesaPopup.css';
import PopupAlert from '../PopupAlert';  // Importando o PopupAlert

const RegisterDespesaPopup = ({ isOpen, onClose, imovelId }) => {
  const [despesa, setDespesa] = useState({
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
  });

  const [popup, setPopup] = useState({ message: '', type: '' });  // Para controlar o popup de alerta

  const tiposDespesa = [
    "Compra de florestas",
    "Compra de mudas",
    "Compra de sementes",
    "Compra de pesagens",
    "Serviço de abertura e manutenção de estradas",
    "Serviços de corte",
    "Serviços de plantio",
    "Serviços de coroamento",
    "Serviços de roçada",
    "Serviços de desrama",
    "Serviço de preparo de solo",
    "Aplicação de adubo",
    "Aplicação de herbicidas",
    "Aplicação de inseticidas",
    "Serviço de georreferenciamento"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Se for quantidade ou valor unitário, realiza o cálculo do total
    if (name === "quantidade" || name === "valor_unitario") {
      const quantidade = name === "quantidade" ? value : despesa.quantidade;
      const valorUnitario = name === "valor_unitario" ? value : despesa.valor_unitario;

      // Calcular o total
      const total = quantidade * valorUnitario;

      setDespesa((prevDespesa) => ({
        ...prevDespesa,
        [name]: value,
        total: total.toFixed(2), // Arredondando para 2 casas decimais
      }));
    } else {
      setDespesa((prevDespesa) => ({
        ...prevDespesa,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    // Validar se todos os campos obrigatórios estão preenchidos
    for (const key in despesa) {
      if (despesa[key] === '') {
        setPopup({ message: `O campo ${key} é obrigatório!`, type: 'error' });
        return false;
      }
    }

    // Validar valores numéricos
    if (despesa.quantidade <= 0 || despesa.valor_unitario <= 0) {
      setPopup({ message: "Quantidade e Valor Unitário devem ser maiores que zero!", type: 'error' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação do formulário
    if (!validateForm()) {
      return;
    }

    const newDespesa = {
      ...despesa,
      imovel_id: imovelId, // Vincula a despesa ao imóvel
    };

    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/despesas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDespesa),
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar despesa');
      }

      setPopup({ message: 'Despesa registrada com sucesso!', type: 'success' });
      
      // Limpar todos os campos
      setDespesa({
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
      });

      // Não fechar o modal, apenas deixar o popup de sucesso visível
    } catch (error) {
      console.error('Erro ao registrar despesa:', error);
      setPopup({ message: 'Falha ao registrar despesa', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Registrar Despesa</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              name="data"
              value={despesa.data}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group descricao-field">
            <label>Descrição</label>
            <textarea
              name="descricao"
              value={despesa.descricao}
              onChange={handleChange}
              required
              placeholder="Digite a descrição aqui..."
            ></textarea>
          </div>
          <div className="form-group">
            <label>Número da Nota Fiscal</label>
            <input
              type="text"
              name="numero_nota_fiscal"
              value={despesa.numero_nota_fiscal}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Fornecedor</label>
            <input
              type="text"
              name="fornecedor"
              value={despesa.fornecedor}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Produto</label>
            <input
              type="text"
              name="produto"
              value={despesa.produto}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Unidade</label>
            <input
              type="text"
              name="unidade"
              value={despesa.unidade}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade</label>
            <input
              type="number"
              name="quantidade"
              value={despesa.quantidade}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Valor Unitário</label>
            <input
              type="number"
              name="valor_unitario"
              value={despesa.valor_unitario}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group tipo-despesa-field">
            <label>Tipo de Despesa</label>
            <select
              name="tipo_de_despesa"
              value={despesa.tipo_de_despesa}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              {tiposDespesa.map((tipo, index) => (
                <option key={index} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Vencimento</label>
            <input
              type="date"
              name="validade"
              value={despesa.validade}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-save">Salvar</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          </div>
        </form>

        {/* Exibindo o PopupAlert se houver mensagem */}
        {popup.message && <PopupAlert message={popup.message} type={popup.type} onClose={() => setPopup({ message: '', type: '' })} />}
      </div>
    </div>
  );
};

export default RegisterDespesaPopup;

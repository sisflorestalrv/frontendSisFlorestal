import React, { useState } from 'react';
import PopupAlert from '../PopupAlert'; // Assumindo que você tenha este componente
import './CadastroImoveis.css'; // O CSS completo abaixo
import { FaLandmark, FaTree, FaClipboardList, FaFileContract } from 'react-icons/fa';
import { API_BASE_URL } from "../../config";

const CadastroImoveis = () => {
  const initialState = {
    descricao: '',
    codigo_cc: '',
    area_imovel: '',
    area_plantio: '',
    especie: '',
    origem: '',
    num_arvores_plantadas: '',
    num_arvores_cortadas: '',
    matricula: '',
    data_plantio: '',
    data_contrato: '',
    vencimento_contrato: '',
    numero_ccir: '',
    numero_itr: '',
    proprietario: '',
    arrendatario: '',
    municipio: '',
    localidade: '',
    numero_car: '',
  };

  const [formData, setFormData] = useState(initialState);
  const [isArrendado, setIsArrendado] = useState(false);
  const [popup, setPopup] = useState({ message: '', type: '' });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const checkCodigoCCExists = async (codigo_cc) => {
    if (!codigo_cc) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/verificarCodigoCC?codigo_cc=${codigo_cc}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Erro ao verificar o código CC:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setPopup({ message: '', type: '' });

  // 1. Validação de campos obrigatórios
  const requiredFields = ['descricao', 'codigo_cc', 'numero_car', 'area_imovel', 'area_plantio', 'especie', 'origem', 'num_arvores_plantadas', 'num_arvores_cortadas', 'matricula', 'data_plantio', 'numero_ccir', 'numero_itr', 'proprietario', 'municipio', 'localidade'];
  if (isArrendado) {
    requiredFields.push('vencimento_contrato', 'arrendatario', 'data_contrato');
  }
  for (const field of requiredFields) {
    if (!formData[field] || String(formData[field]).trim() === '') {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setPopup({ message: `O campo "${fieldName}" é obrigatório.`, type: 'error' });
      return;
    }
  }

  // 2. Validação do Código CC
  const exists = await checkCodigoCCExists(formData.codigo_cc);
  if (exists) {
    setPopup({ message: "O código CC informado já está cadastrado!", type: 'error' });
    return;
  }
  
  // 3. Preparação e envio dos dados
  const num_arvores_plantadas = parseFloat(formData.num_arvores_plantadas);
  const num_arvores_cortadas = parseFloat(formData.num_arvores_cortadas);
  const area_plantio = parseFloat(formData.area_plantio);
  const num_arvores_remanescentes = num_arvores_plantadas - num_arvores_cortadas;
  const num_arvores_por_hectare = area_plantio > 0 ? num_arvores_remanescentes / area_plantio : 0;

  const formDataToSend = {
    ...formData,
    num_arvores_remanescentes,
    num_arvores_por_hectare,
    altura_desrama: 0,
    arrendatario: isArrendado ? formData.arrendatario : null,
    vencimento_contrato: isArrendado ? formData.vencimento_contrato : null,
    data_contrato: isArrendado ? formData.data_contrato : null,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/imoveis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A linha da correção:
        'Authorization': 'Basic my-simple-token'
      },
      body: JSON.stringify(formDataToSend),
    });

    if (response.ok) {
      setPopup({ message: "Imóvel cadastrado com sucesso!", type: 'success' });
      setFormData(initialState);
      setIsArrendado(false);
    } else {
      const errorData = await response.json();
      setPopup({ message: errorData.error || "Erro ao cadastrar o imóvel.", type: 'error' });
    }
  } catch (error) {
    setPopup({ message: "Erro de conexão. Não foi possível se comunicar com o servidor.", type: 'error' });
  }
};
  
  const toggleTipoImovel = (tipo) => {
    setIsArrendado(tipo === 'arrendado');
  };

  return (
    <div className="page-container">
      <div className="form-header">
        <h1 className="form-title">Cadastro de Novo Imóvel</h1>
        <p className="form-subtitle">Preencha os dados abaixo para registrar uma nova propriedade.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {/* Seção Tipo de Posse */}
        <div className="form-section">
          <h2 className="form-section-title"><FaFileContract /> Tipo de Posse</h2>
          <div className="segmented-control">
            <button type="button" className={!isArrendado ? 'active' : ''} onClick={() => toggleTipoImovel('proprio')}>Próprio</button>
            <button type="button" className={isArrendado ? 'active' : ''} onClick={() => toggleTipoImovel('arrendado')}>Arrendado</button>
          </div>
        </div>
        
        {/* Seção Identificação do Imóvel */}
        <div className="form-section">
          <h2 className="form-section-title"><FaLandmark /> Identificação do Imóvel</h2>
          <div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="descricao" className="form-label">Descrição</label>
              <input type="text" className="form-input" id="descricao" value={formData.descricao} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="codigo_cc" className="form-label">Código CC</label>
              <input type="text" className="form-input" id="codigo_cc" value={formData.codigo_cc} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label htmlFor="matricula" className="form-label">Matrícula</label>
              <input type="text" className="form-input" id="matricula" value={formData.matricula} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Seção Áreas e Plantio */}
        <div className="form-section">
          <h2 className="form-section-title"><FaTree /> Áreas e Plantio</h2>
          <div className="form-grid">
            <div className="input-group"><label htmlFor="area_imovel" className="form-label">Área do Imóvel (ha)</label><input type="number" step="0.01" className="form-input" id="area_imovel" value={formData.area_imovel} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="area_plantio" className="form-label">Área de Plantio (ha)</label><input type="number" step="0.01" className="form-input" id="area_plantio" value={formData.area_plantio} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="especie" className="form-label">Espécie</label><input type="text" className="form-input" id="especie" value={formData.especie} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="origem" className="form-label">Origem</label><input type="text" className="form-input" id="origem" value={formData.origem} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="num_arvores_plantadas" className="form-label">Nº de Árvores Plantadas</label><input type="number" className="form-input" id="num_arvores_plantadas" value={formData.num_arvores_plantadas} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="num_arvores_cortadas" className="form-label">Nº de Árvores Cortadas</label><input type="number" className="form-input" id="num_arvores_cortadas" value={formData.num_arvores_cortadas} onChange={handleChange} /></div>
            <div className="input-group"><label htmlFor="data_plantio" className="form-label">Data de Plantio</label><input type="date" className="form-input" id="data_plantio" value={formData.data_plantio} onChange={handleChange} /></div>
          </div>
        </div>
        
        {/* Seção Condicional para Arrendado */}
        {isArrendado && (
          <div className="form-section">
            <h2 className="form-section-title"><FaFileContract /> Dados do Contrato</h2>
            <div className="form-grid">
              <div className="input-group"><label htmlFor="arrendatario" className="form-label">Arrendatário</label><input type="text" className="form-input" id="arrendatario" value={formData.arrendatario} onChange={handleChange} /></div>
              <div className="input-group"><label htmlFor="data_contrato" className="form-label">Data do Contrato</label><input type="date" className="form-input" id="data_contrato" value={formData.data_contrato} onChange={handleChange} /></div>
              <div className="input-group"><label htmlFor="vencimento_contrato" className="form-label">Vencimento do Contrato</label><input type="date" className="form-input" id="vencimento_contrato" value={formData.vencimento_contrato} onChange={handleChange} /></div>
            </div>
          </div>
        )}

        {/* Seção Dados Legais */}
        <div className="form-section">
            <h2 className="form-section-title"><FaClipboardList /> Dados Legais e Fiscais</h2>
            <div className="form-grid">
                <div className="input-group"><label htmlFor="numero_car" className="form-label">Número CAR</label><input type="text" className="form-input" id="numero_car" value={formData.numero_car} onChange={handleChange} /></div>
                <div className="input-group"><label htmlFor="numero_ccir" className="form-label">Número do CCIR</label><input type="text" className="form-input" id="numero_ccir" value={formData.numero_ccir} onChange={handleChange} /></div>
                <div className="input-group"><label htmlFor="numero_itr" className="form-label">Número do ITR</label><input type="text" className="form-input" id="numero_itr" value={formData.numero_itr} onChange={handleChange} /></div>
                <div className="input-group"><label htmlFor="proprietario" className="form-label">Proprietário</label><input type="text" className="form-input" id="proprietario" value={formData.proprietario} onChange={handleChange} /></div>
                <div className="input-group"><label htmlFor="municipio" className="form-label">Município</label><input type="text" className="form-input" id="municipio" value={formData.municipio} onChange={handleChange} /></div>
                <div className="input-group"><label htmlFor="localidade" className="form-label">Localidade</label><input type="text" className="form-input" id="localidade" value={formData.localidade} onChange={handleChange} /></div>
            </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="submit-button">Cadastrar Imóvel</button>
        </div>
      </form>

      {popup.message && <PopupAlert message={popup.message} type={popup.type} onClose={() => setPopup({ message: '', type: '' })} />}
    </div>
  );
};

export default CadastroImoveis;
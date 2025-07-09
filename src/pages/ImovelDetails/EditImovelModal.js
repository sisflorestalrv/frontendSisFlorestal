import React, { useState, useEffect } from "react";
import PopupAlert from "../PopupAlert";
import "./EditImovelModal.css";
import { API_BASE_URL } from "../../config";

const EditImovelModal = ({ isOpen, onClose, imovel, onSave }) => {
  const [formData, setFormData] = useState(null);
  const [isArrendado, setIsArrendado] = useState(false);
  const [codigoCCExists, setCodigoCCExists] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (imovel) {
      const formattedImovel = {
        ...imovel,
        data_plantio: formatDateForInput(imovel.data_plantio),
        data_contrato: formatDateForInput(imovel.data_contrato),
        vencimento_contrato: formatDateForInput(imovel.vencimento_contrato),
      };
      setFormData(formattedImovel);
      setIsArrendado(!!imovel.arrendatario || !!imovel.data_contrato);
    }
  }, [imovel]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "codigo_cc") {
      checkCodigoCCExists(value);
    }
  };

  const checkCodigoCCExists = async (codigo_cc) => {
    if (!codigo_cc || codigo_cc === imovel.codigo_cc) {
      setCodigoCCExists(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/verificarCodigoCC?codigo_cc=${codigo_cc}`);
      const data = await response.json();
      setCodigoCCExists(data.exists);
    } catch (error) {
      console.error("Erro ao verificar o código CC:", error);
    }
  };

  const toggleTipoImovel = (tipo) => {
    const isArrendadoNovo = tipo === "arrendado";
    setIsArrendado(isArrendadoNovo);
    if (!isArrendadoNovo) {
      setFormData((prev) => ({
        ...prev,
        arrendatario: "",
        data_contrato: "",
        vencimento_contrato: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (codigoCCExists) {
        setPopup({ message: "O Código CC informado já está em uso.", type: "error" });
        return;
    }
    
    const formattedData = {
      ...formData,
      data_contrato: isArrendado && formData.data_contrato ? formData.data_contrato : null,
      vencimento_contrato: isArrendado && formData.vencimento_contrato ? formData.vencimento_contrato : null,
      arrendatario: isArrendado && formData.arrendatario ? formData.arrendatario : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        setPopup({ message: "Imóvel atualizado com sucesso!", type: "success" });
        onSave();
        setTimeout(() => onClose(), 1500);
      } else {
        const errorData = await response.json();
        setPopup({ message: errorData.error || "Erro ao atualizar o imóvel.", type: "error" });
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      setPopup({ message: "Erro de conexão ao tentar atualizar o imóvel.", type: "error" });
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="edit-modal-overlay">
      <div className="edit-modal-content">

        <div className="edit-modal-header">
          <h2 className="edit-modal-title">Editar Imóvel</h2>
        </div>

        {/* Corpo do modal agora é o container de rolagem */}
        <div className="edit-modal-body">
          {/* O formulário fica aqui dentro */}
          <form id="edit-imovel-form" onSubmit={handleSubmit}>
            <div className="segmented-control">
              <button type="button" className={!isArrendado ? "active" : ""} onClick={() => toggleTipoImovel("proprio")}>Próprio</button>
              <button type="button" className={isArrendado ? "active" : ""} onClick={() => toggleTipoImovel("arrendado")}>Arrendado</button>
            </div>

            <div className="form-grid">
              {[
                { id: "descricao", label: "Descrição", required: true, className: "full-width" },
                { id: "codigo_cc", label: "Código CC", required: true, error: codigoCCExists && "Código CC já existe." },
                { id: "proprietario", label: "Proprietário", required: true },
                { id: "matricula", label: "Matrícula" },
                { id: "numero_car", label: "Número CAR" },
                { id: "numero_ccir", label: "Número CCIR" },
                { id: "numero_itr", label: "Número ITR" },
                { id: "municipio", label: "Município", required: true },
                { id: "localidade", label: "Localidade", required: true },
                { id: "area_imovel", label: "Área do Imóvel (ha)", type: "number", step: "0.01", required: true },
                { id: "area_plantio", label: "Área de Plantio (ha)", type: "number", step: "0.01", required: true },
                { id: "especie", label: "Espécie" },
                { id: "origem", label: "Origem" },
                { id: "num_arvores_plantadas", label: "Nº de Árvores Plantadas", type: "number" },
                { id: "num_arvores_cortadas", label: "Nº de Árvores Cortadas", type: "number" },
                { id: "data_plantio", label: "Data de Plantio", type: "date" },
              ].map(field => (
                <div className={`input-group ${field.className || ''}`} key={field.id}>
                  <label htmlFor={field.id} className="form-label">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    id={field.id}
                    className="form-input"
                    value={formData[field.id] || ""}
                    onChange={handleChange}
                    required={field.required}
                    step={field.step}
                  />
                  {field.error && <div className="error-message">{field.error}</div>}
                </div>
              ))}

              {isArrendado && (
                <>
                  <div className="input-group">
                    <label htmlFor="arrendatario" className="form-label">Arrendatário</label>
                    <input type="text" id="arrendatario" className="form-input" value={formData.arrendatario || ""} onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <label htmlFor="data_contrato" className="form-label">Data do Contrato</label>
                    <input type="date" id="data_contrato" className="form-input" value={formData.data_contrato || ""} onChange={handleChange} />
                  </div>
                  <div className="input-group full-width">
                    <label htmlFor="vencimento_contrato" className="form-label">Vencimento do Contrato</label>
                    <input type="date" id="vencimento_contrato" className="form-input" value={formData.vencimento_contrato || ""} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Rodapé com os botões de ação */}
        <div className="edit-modal-footer">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose}>Cancelar</button>
          
          {/* Este botão aciona o form com id="edit-imovel-form" */}
          <button 
            type="submit" 
            form="edit-imovel-form" 
            className="modal-btn modal-btn-success"
          >
            Salvar Alterações
          </button>
        </div>

        {popup.message && (
          <PopupAlert message={popup.message} type={popup.type} onClose={() => setPopup({ message: "", type: "" })} />
        )}
      </div>
    </div>
  );
};

export default EditImovelModal;
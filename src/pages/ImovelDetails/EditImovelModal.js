import React, { useState, useEffect } from "react";
import PopupAlert from "../PopupAlert";
import "./EditImovelModal.css";

const EditImovelModal = ({ isOpen, onClose, imovel, onSave }) => {
  const [formData, setFormData] = useState(imovel);
  const [isArrendado, setIsArrendado] = useState(!!imovel.arrendatario);
  const [codigoCCExists, setCodigoCCExists] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });

  useEffect(() => {
    if (imovel) {
      setFormData(imovel);
      setIsArrendado(!!imovel.arrendatario);
    }
  }, [imovel]);

  const handleChange = async (e) => {
    const { id, value } = e.target;
    setFormData((prevFormData) => ({ ...prevFormData, [id]: value }));

    if (id === "codigo_cc") {
      const exists = await checkCodigoCCExists(value);
      setCodigoCCExists(exists);
    }
  };

  const checkCodigoCCExists = async (codigo_cc) => {
    try {
      const response = await fetch(`http://localhost:5000/api/verificarCodigoCC?codigo_cc=${codigo_cc}`);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Erro ao verificar o código CC:", error);
      return false;
    }
  };

  const toggleTipoImovel = (tipo) => {
    setIsArrendado(tipo === "arrendado");
    setFormData((prevFormData) => ({
      ...prevFormData,
      arrendatario: tipo === "arrendado" ? "" : null,
      data_contrato: tipo === "arrendado" ? "" : null,
      vencimento_contrato: tipo === "arrendado" ? "" : null,
    }));
  };

  const isValidNumber = (num) => {
    const regex = /^\d+(\.\d{1,2})?$/;
    return regex.test(num);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (
      formData.area_imovel <= 0 ||
      formData.area_plantio <= 0 ||
      formData.num_arvores_plantadas < 0 ||
      formData.num_arvores_cortadas < 0 ||
      formData.numero_car < 0
    ) {
      setPopup({ message: "Os valores não podem ser negativos ou zero!", type: "error" });
      return;
    }

    if (
      !isValidNumber(formData.area_imovel) ||
      !isValidNumber(formData.area_plantio) ||
      !isValidNumber(formData.num_arvores_plantadas) ||
      !isValidNumber(formData.num_arvores_cortadas)
    ) {
      setPopup({ message: "Os números devem estar no formato correto (ex: 100000.00).", type: "error" });
      return;
    }

    // Formatar dados para enviar ao backend
    const formattedData = {
      ...formData,
      arrendatario: isArrendado ? formData.arrendatario : null,
      vencimento_contrato: isArrendado ? formData.vencimento_contrato : null,
      data_contrato: isArrendado ? formData.data_contrato : null,
      data_plantio: formData.data_plantio || imovel.data_plantio,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        setPopup({ message: "Imóvel atualizado com sucesso!", type: "success" });
        onSave(); // Atualizar a lista de imóveis ou recarregar os dados
        setTimeout(() => onClose(), 1500); // Fechar o modal após 1,5 segundos
      } else {
        setPopup({ message: "Erro ao atualizar o imóvel.", type: "error" });
      }
    } catch (error) {
      console.error("Erro ao atualizar o imóvel:", error);
      setPopup({ message: "Erro ao atualizar o imóvel.", type: "error" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="custom-modal">
        {/* Botão de fechar no canto superior direito */}
        <button className="close-button" onClick={onClose}>
          &times;
        </button>

        <h2 className="modal-title">Editar Imóvel</h2>
        <form onSubmit={handleSubmit}>
          <div className="text-center mb-4">
            <button
              type="button"
              className={`btn btn-secondary mx-2 ${!isArrendado ? "active" : ""}`}
              onClick={() => toggleTipoImovel("proprio")}
            >
              Próprio
            </button>
            <button
              type="button"
              className={`btn btn-secondary mx-2 ${isArrendado ? "active" : ""}`}
              onClick={() => toggleTipoImovel("arrendado")}
            >
              Arrendado
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <input
              type="text"
              className="form-control"
              id="descricao"
              value={formData.descricao || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="codigo_cc">Código CC</label>
            <input
              type="text"
              className="form-control"
              id="codigo_cc"
              value={formData.codigo_cc || ""}
              onChange={handleChange}
              required
            />
            {codigoCCExists && <div className="text-danger">Código CC já existe</div>}
          </div>

          <div className="form-group">
            <label htmlFor="numero_car">Número CAR</label>
            <input
              type="text"
              className="form-control"
              id="numero_car"
              value={formData.numero_car || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area_imovel">Área do Imóvel</label>
            <input
              type="number"
              className="form-control"
              id="area_imovel"
              value={formData.area_imovel || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="area_plantio">Área de Plantio</label>
            <input
              type="number"
              className="form-control"
              id="area_plantio"
              value={formData.area_plantio || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="especie">Espécie</label>
            <input
              type="text"
              className="form-control"
              id="especie"
              value={formData.especie || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="origem">Origem</label>
            <input
              type="text"
              className="form-control"
              id="origem"
              value={formData.origem || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="num_arvores_plantadas">Número de Árvores Plantadas</label>
            <input
              type="number"
              className="form-control"
              id="num_arvores_plantadas"
              value={formData.num_arvores_plantadas || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="num_arvores_cortadas">Número de Árvores Cortadas</label>
            <input
              type="number"
              className="form-control"
              id="num_arvores_cortadas"
              value={formData.num_arvores_cortadas || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="matricula">Matrícula</label>
            <input
              type="text"
              className="form-control"
              id="matricula"
              value={formData.matricula || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="data_plantio">Data de Plantio</label>
            <input
              type="date"
              className="form-control"
              id="data_plantio"
              value={formData.data_plantio || ""}
              onChange={handleChange}
            />
          </div>

          {isArrendado && (
            <>
              <div className="form-group">
                <label htmlFor="vencimento_contrato">Vencimento do Contrato</label>
                <input
                  type="date"
                  className="form-control"
                  id="vencimento_contrato"
                  value={formData.vencimento_contrato || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="arrendatario">Arrendatário</label>
                <input
                  type="text"
                  className="form-control"
                  id="arrendatario"
                  value={formData.arrendatario || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="data_contrato">Data do Contrato</label>
                <input
                  type="date"
                  className="form-control"
                  id="data_contrato"
                  value={formData.data_contrato || ""}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="numero_ccir">Número do CCIR</label>
            <input
              type="text"
              className="form-control"
              id="numero_ccir"
              value={formData.numero_ccir || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="numero_itr">Número do ITR</label>
            <input
              type="text"
              className="form-control"
              id="numero_itr"
              value={formData.numero_itr || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="proprietario">Proprietário</label>
            <input
              type="text"
              className="form-control"
              id="proprietario"
              value={formData.proprietario || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="municipio">Município</label>
            <input
              type="text"
              className="form-control"
              id="municipio"
              value={formData.municipio || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="localidade">Localidade</label>
            <input
              type="text"
              className="form-control"
              id="localidade"
              value={formData.localidade || ""}
              onChange={handleChange}
              required
            />
          </div>

          
          <div className="modal-actions">
            <button type="submit" className="btn btn-success">
              Salvar
            </button>
            <button type="button" className="btn btn-danger" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>

        {/* PopupAlert */}
        {popup.message && (
          <PopupAlert
            message={popup.message}
            type={popup.type}
            onClose={() => setPopup({ message: "", type: "" })}
          />
        )}
      </div>
    </div>
  );
};

export default EditImovelModal;
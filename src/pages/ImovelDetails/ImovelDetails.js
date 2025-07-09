import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import logo from "../../img/logo.png";
import ExpenseTablePopup from "../ExpensePages/ExpenseTablePopup";
import RegisterDesramaPopup from "../DesramaPages/RegisterDesramaPopup";
import DesramaTablePopup from "../DesramaPages/DesramaTablePopup";
import RegisterDesbastePopup from "../DesbastePages/RegisterDesbastePopup";
import DesbasteTablePopup from "../DesbastePages/DesbasteTablePopup";
import RegisterDespesaPopup from "../ExpensePages/RegisterDespesaPopup";
import NotasModal from "../Notas/NotasModal";
import EditImovelModal from "./EditImovelModal";
import InventoryModal from "../Inventario/InventoryModal";
import { API_BASE_URL } from "../../config";

// Importe o novo arquivo CSS aqui
import "./ImovelDetails.css";

const ImovelDetails = () => {
  const { id } = useParams();
  const [isDespesaPopupOpen, setIsDespesaPopupOpen] = useState(false);
  const [isDesbasteTableOpen, setIsDesbasteTableOpen] = useState(false);
  const [isDesramaTableOpen, setIsDesramaTableOpen] = useState(false);
  const [isDesramaPopupOpen, setIsDesramaPopupOpen] = useState(false);
  const [isDesbastePopupOpen, setIsDesbastePopupOpen] = useState(false);
  const [imovel, setImovel] = useState(null);
  const [isNotasModalOpen, setIsNotasModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [isViewExpensePopupOpen, setIsViewExpensePopupOpen] = useState(false);
  const [contractExpirationAlert, setContractExpirationAlert] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const checkContractExpiration = (vencimentoContrato) => {
    const today = new Date();
    const vencimentoDate = new Date(vencimentoContrato);
    const diffTime = vencimentoDate - today;

    if (diffTime < 0) {
      return "Contrato já venceu!";
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return `Contrato prestes a vencer em ${diffDays} dias.`;
    }

    return null;
  };

  const fetchImovelDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${id}`);
      if (!response.ok) throw new Error("Imóvel não encontrado");
      const data = await response.json();
      setImovel(data);

      if (data.vencimento_contrato) {
        const expirationMessage = checkContractExpiration(data.vencimento_contrato);
        setContractExpirationAlert(expirationMessage);
      } else {
        setContractExpirationAlert("");
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do imóvel:", error);
      setImovel(undefined);
    }
  };

  useEffect(() => {
    fetchImovelDetails();
    // A dependência 'id' garante que a função será chamada novamente se o ID do imóvel mudar.
  }, [id]);
  
  const handleOpenDespesaPopup = () => setIsDespesaPopupOpen(true);
  const handleCloseDespesaPopup = () => setIsDespesaPopupOpen(false);

  const handleOpenViewExpensePopup = () => setIsViewExpensePopupOpen(true);
  const handleCloseViewExpensePopup = () => setIsViewExpensePopupOpen(false);

  const handleOpenDesbastePopup = () => setIsDesbastePopupOpen(true);
  const handleCloseDesbastePopup = () => setIsDesbastePopupOpen(false);

  const handleOpenDesbasteTable = () => setIsDesbasteTableOpen(true);
  const handleCloseDesbasteTable = () => setIsDesbasteTableOpen(false);

  const handleDesramaTableOpen = () => setIsDesramaTableOpen(true);
  const handleDesramaTableClose = () => setIsDesramaTableOpen(false);

  const handleOpenNotasModal = () => setIsNotasModalOpen(true);
  const handleCloseNotasModal = () => setIsNotasModalOpen(false);

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handleOpenInventoryModal = () => setIsInventoryModalOpen(true);
  const handleCloseInventoryModal = () => setIsInventoryModalOpen(false);
  
  // Função de placeholder, substitua pela sua lógica de salvar
  const handleSaveImovel = () => {
    console.log("Salvar alterações no imóvel");
    fetchImovelDetails(); // Atualiza os dados após salvar
    handleCloseEditModal();
  };

  const handleSelectAll = () => {
    const allFieldsSelected = Object.keys(imovel).every(
      (key) => selectedFields[key] || key === "id" || key === "descricao"
    );

    const newSelectedFields = {};
    Object.keys(imovel).forEach((key) => {
      if (key !== "id" && key !== "descricao") {
        newSelectedFields[key] = !allFieldsSelected;
      }
    });

    setSelectedFields(newSelectedFields);
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const imovelNome = imovel?.descricao || "Imóvel Desconhecido";
    let yPosition = margin;

    // Adiciona o logo
    if(logo) {
      const logoWidth = 50;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logo, "PNG", logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    }

    // Título do relatório
    doc.setFontSize(18);
    doc.text(`Relatório do Imóvel: ${imovelNome}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    const reportData = Object.keys(selectedFields)
      .filter((key) => selectedFields[key] && formatValue(imovel[key], key) !== null)
      .map((key) => ({
        label: fieldLabels[key] || key.replace(/_/g, " ").toUpperCase(),
        value: formatValue(imovel[key], key),
      }));

    doc.setFontSize(12);
    const columnWidth = (pageWidth - margin * 2) / 2;

    // Cabeçalho da tabela
    doc.setFillColor(40, 167, 69); // Verde
    doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("Campo", margin + 5, yPosition + 7);
    doc.text("Valor", margin + columnWidth + 5, yPosition + 7);
    yPosition += 10;

    // Linhas da tabela
    reportData.forEach((field, index) => {
      doc.setFillColor(index % 2 === 0 ? 248 : 255, 250, 252); // Alterna cor das linhas
      doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");
      doc.setTextColor(30, 41, 59);
      doc.text(field.label, margin + 5, yPosition + 7);
      doc.text(String(field.value), margin + columnWidth + 5, yPosition + 7);
      yPosition += 10;

      if (yPosition > 280) { // Adiciona nova página se necessário
        doc.addPage();
        yPosition = margin;
      }
    });

    // Rodapé
    doc.setFontSize(8);
    doc.setFont("times", "italic");
    doc.text("Relatório gerado por Sis Florestal", margin, 290);

    doc.save(`relatorio_${imovelNome.replace(/\s+/g, '_')}.pdf`);
    setIsReportModalOpen(false);
  };
  
  const handleFieldChange = (e) => {
    setSelectedFields({ ...selectedFields, [e.target.name]: e.target.checked });
  };
  
  const formatValue = (value, key) => {
    const dateFields = ["data_plantio", "data_contrato", "vencimento_contrato"];
    if (dateFields.includes(key) && value) {
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        return dateValue.toLocaleDateString("pt-BR", { timeZone: 'UTC' });
      }
    }
    
    if (value === null || value === undefined || value === "N/A" || value === "") {
        return null;
    }

    const decimalFields = ["area_imovel", "area_plantio"];
    if (decimalFields.includes(key)) {
      const numericValue = Number(value);
      if (isFinite(numericValue)) {
        return numericValue.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }
    
    return String(value);
  };

  const fieldLabels = {
    descricao: "Descrição do Imóvel",
    area_imovel: "Área do Imóvel (ha)",
    area_plantio: "Área de Plantio (ha)",
    especie: "Espécie",
    origem: "Origem",
    num_arvores_plantadas: "Nº de Árvores Plantadas",
    num_arvores_cortadas: "Nº de Árvores Cortadas",
    num_arvores_remanescentes: "Nº de Árvores Remanescentes",
    num_arvores_por_hectare: "Nº de Árvores por Hectare",
    matricula: "Matrícula",
    data_plantio: "Data de Plantio",
    numero_ccir: "Número CCIR",
    numero_itr: "Número ITR",
    proprietario: "Proprietário",
    arrendatario: "Arrendatário",
    data_contrato: "Data do Contrato",
    vencimento_contrato: "Vencimento do Contrato",
    municipio: "Município",
    localidade: "Localidade",
    altura_desrama: "Altura da Desrama",
    numero_car: "Número do CAR",
    codigo_cc: "Código CC",
  };
  
  if (imovel === null) return <p>Carregando...</p>;
  if (imovel === undefined) return <p>Imóvel não encontrado.</p>;
  
  return (
    <div className="page-container">
      <h1 className="property-title">{imovel.descricao}</h1>

      {contractExpirationAlert && (
        <div className="property-alert">
          <strong>Atenção!</strong> {contractExpirationAlert}
        </div>
      )}

      <div className="property-details">
        {Object.keys(imovel).map((key) => {
          if (key === "id" || key === "descricao") return null;
          
          const formattedValue = formatValue(imovel[key], key);
          const label = fieldLabels[key] || key;

          if (formattedValue === null) return null;

          return (
            <div className="property-detail" key={key}>
              <span className="property-label">{label}:</span>
              <span className="property-value">{formattedValue}</span>
            </div>
          );
        })}
      </div>

      <div className="custom-button-group">
        <button onClick={() => setIsReportModalOpen(true)} className="custom-button">Gerar Relatório</button>
        <button onClick={handleOpenDespesaPopup} className="custom-button">Registrar Despesa</button>
        <button onClick={handleOpenViewExpensePopup} className="custom-button">Relatório de Despesa</button>
        <button onClick={() => setIsDesramaPopupOpen(true)} className="custom-button">Registrar Desrama</button>
        <button onClick={handleDesramaTableOpen} className="custom-button">Relatório de Desrama</button>
        <button className="custom-button" onClick={handleOpenDesbastePopup}>Registrar Desbaste</button>
        <button className="custom-button" onClick={handleOpenDesbasteTable}>Relatório de Desbaste</button>
        <button onClick={handleOpenNotasModal} className="custom-button">Notas</button>
        <button className="custom-button" onClick={() => window.open("https://drive.google.com/drive/folders/1QCx_FSAejryOU2hK-WEV2b37yV8_Okqf", "_blank")}>Arquivos</button>
        <button className="custom-button" onClick={handleOpenInventoryModal}>Inventário</button>
        <button className="custom-button edit-btn" onClick={handleOpenEditModal}>Editar</button>
      </div>

      <InventoryModal isOpen={isInventoryModalOpen} onClose={handleCloseInventoryModal} imovelId={id} />
      <EditImovelModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} imovel={imovel} onSave={handleSaveImovel} />
      <RegisterDespesaPopup isOpen={isDespesaPopupOpen} onClose={handleCloseDespesaPopup} imovelId={id} />
      <ExpenseTablePopup isOpen={isViewExpensePopupOpen} imovelId={id} onClose={handleCloseViewExpensePopup} />
      <DesbasteTablePopup isOpen={isDesbasteTableOpen} imovelId={id} onClose={handleCloseDesbasteTable} />
      <RegisterDesramaPopup isOpen={isDesramaPopupOpen} onClose={() => setIsDesramaPopupOpen(false)} imovelId={id} />
      <DesramaTablePopup isOpen={isDesramaTableOpen} imovelId={id} onClose={handleDesramaTableClose} />
      <RegisterDesbastePopup isOpen={isDesbastePopupOpen} onClose={handleCloseDesbastePopup} imovelId={id} />
      <NotasModal isOpen={isNotasModalOpen} onClose={handleCloseNotasModal} imovelId={id} />

      {isReportModalOpen && (
        <div className="custom-modal">
          <div className="modal-content">
            <h2 className="modal-title">Selecione os Campos para o Relatório</h2>
            <div className="custom-form-group">
              <button className="btn-select-all" onClick={handleSelectAll}>
                Selecionar/Desselecionar Todos
              </button>
              {Object.keys(imovel)
                .filter(key => key !== "id" && key !== "descricao" && formatValue(imovel[key], key) !== null)
                .map((key) => {
                  const label = fieldLabels[key] || key.replace(/_/g, " ").toUpperCase();
                  return (
                    <div key={key} className="custom-checkbox">
                      <input
                        type="checkbox"
                        id={key}
                        name={key}
                        checked={selectedFields[key] || false}
                        onChange={handleFieldChange}
                      />
                      <label htmlFor={key}>{label}</label>
                    </div>
                  );
                })}
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => setIsReportModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleGenerateReport}>
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImovelDetails;
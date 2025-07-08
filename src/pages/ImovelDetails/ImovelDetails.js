import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import logo from '../../img/logo.png';
import ExpenseTablePopup from "../ExpensePages/ExpenseTablePopup";
import RegisterDesramaPopup from "../DesramaPages/RegisterDesramaPopup";
import DesramaTablePopup from "../DesramaPages/DesramaTablePopup";
import RegisterDesbastePopup from "../DesbastePages/RegisterDesbastePopup";
import DesbasteTablePopup from "../DesbastePages/DesbasteTablePopup";
import GalleryModal from "../Galeria/GalleryModal";
import RegisterDespesaPopup from "../ExpensePages/RegisterDespesaPopup";
import NotasModal from "../Notas/NotasModal";
import MapModal from "../MapaModal/MapModal";
import FileModal from "../Arquivos/FilesModal"; // Importe o componente correto
import EditImovelModal from "./EditImovelModal"; // Importe o modal de edição
import InventoryModal from "../Inventario/InventoryModal"; // Ajuste o caminho conforme necessário
import "../modal.css";


const ImovelDetails = () => {
  const { id } = useParams();
  const [isDespesaPopupOpen, setIsDespesaPopupOpen] = useState(false);
  const [isDesbasteTableOpen, setIsDesbasteTableOpen] = useState(false);
  const [isDesramaTableOpen, setIsDesramaTableOpen] = useState(false);
  const [desramaData, setDesramaData] = useState([]);
  const [isExpensePopupOpen, setIsExpensePopupOpen] = useState(false);
  const [isDesramaPopupOpen, setIsDesramaPopupOpen] = useState(false);
  const [isDesbastePopupOpen, setIsDesbastePopupOpen] = useState(false);
  const [imovel, setImovel] = useState(null);
  const [isNotasModalOpen, setIsNotasModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isViewExpensePopupOpen, setIsViewExpensePopupOpen] = useState(false);
  const [contractExpirationAlert, setContractExpirationAlert] = useState("");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);



  const checkContractExpiration = (vencimentoContrato) => {
    const today = new Date();
    const vencimentoDate = new Date(vencimentoContrato);

    // Calcular a diferença em milissegundos
    const diffTime = vencimentoDate - today;

    // Se a data de vencimento for no passado
    if (diffTime < 0) {
      return "Contrato já venceu!";
    }

    // Calcular a diferença em dias
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Se faltar menos de 30 dias para vencer
    if (diffDays <= 30) {
      return `Contrato prestes a vencer em ${diffDays} dias.`;
    }

    return null; // Se o contrato não está perto de vencer
  };

  const fetchImovelDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${id}`);
      if (!response.ok) throw new Error("Imóvel não encontrado");
      const data = await response.json();
      setImovel(data);

      // Verifique se o vencimento do contrato está disponível antes de calcular a expiração
      if (data.vencimento_contrato) {
        const expirationMessage = checkContractExpiration(data.vencimento_contrato);
        setContractExpirationAlert(expirationMessage);
      } else {
        setContractExpirationAlert(""); // Se não houver vencimento de contrato, limpa o alerta
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do imóvel:", error);
      setImovel(undefined);
    }
  };



  useEffect(() => {
    fetchImovelDetails();
  }, [id]);



  useEffect(() => {
    const fetchDesramas = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/imoveis/${id}/desramas`
        );
        const data = await response.json();
        setDesramaData(data); // Aqui, salve as desramas no estado
      } catch (error) {
        console.error("Erro ao buscar desramas:", error);
      }
    };

    fetchDesramas();
  }, [id]);

  // Função para abrir o modal de arquivos
const handleOpenFilesModal = () => setIsFilesModalOpen(true);
const handleCloseFilesModal = () => setIsFilesModalOpen(false);

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

  const handleOpenGallery = () => setIsGalleryOpen(true);
  const handleCloseGallery = () => setIsGalleryOpen(false);



  const handleOpenNotasModal = () => setIsNotasModalOpen(true);
  const handleCloseNotasModal = () => setIsNotasModalOpen(false);

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handleOpenInventoryModal = () => setIsInventoryModalOpen(true);
const handleCloseInventoryModal = () => setIsInventoryModalOpen(false);


  const handleSaveImovel = () => {
    // Lógica para salvar as alterações no imóvel
    console.log("Salvar alterações no imóvel");
  };

  const handleSelectAll = () => {
    const allFieldsSelected = Object.keys(imovel).every(
      (key) => selectedFields[key]
    );

    const newSelectedFields = {};
    Object.keys(imovel).forEach((key) => {
      if (key !== "id" && key !== "descricao") { // Também não seleciona a descrição aqui
        newSelectedFields[key] = !allFieldsSelected;
      }
    });

    setSelectedFields(newSelectedFields);
  };



  const handleGenerateReport = () => {
    const doc = new jsPDF();

    // Definir as margens do documento
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // Inserir logo no cabeçalho, centralizado
    const logoWidth = 50;
    const logoHeight = 20;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, margin, logoWidth, logoHeight);

    // Nome do imóvel (campo descricao) a ser colocado na tabela
    const imovelNome = imovel?.descricao || "Imóvel Desconhecido";

    // Deixar um espaçamento antes de começar a tabela
    let yPosition = margin + logoHeight + 20;

    // Criar a tabela com os dados do imóvel
    const reportData = Object.keys(selectedFields)
  .filter((key) => selectedFields[key])
  .map((key) => ({
    label: fieldLabels[key] || key.replace(/_/g, " ").toUpperCase(),
    value: formatValue(imovel[key], key),
  }));


    // Definir o estilo da tabela
    doc.setFontSize(12);
    doc.setFont("times", "normal");

    // Criar cabeçalhos de tabela
    const columnWidth = (pageWidth - margin * 2) / 2; // Largura das colunas

    // Cabeçalhos da tabela com fundo verde
    doc.setFillColor(34, 139, 34); // Cor de fundo verde
    doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F"); // Retângulo para o cabeçalho
    doc.setTextColor(255, 255, 255); // Cor do texto do cabeçalho (branco)
    doc.text("Campo", margin + 5, yPosition + 7);
    doc.text("Valor", margin + columnWidth + 5, yPosition + 7);

    yPosition += 15; // Distância até os dados da tabela

    // Adicionar o nome do imóvel dentro da tabela
    doc.setFillColor(240, 240, 240); // Cor de fundo para as células
    doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");
    doc.setTextColor(0, 0, 0); // Cor do texto
    doc.text("Nome do Imóvel", margin + 5, yPosition + 7);
    doc.text(imovelNome, margin + columnWidth + 5, yPosition + 7);

    yPosition += 15; // Distância após o nome do imóvel

    // Linha de separação
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);

    // Adicionar os dados na tabela
    yPosition += 10;
    reportData.forEach((field, index) => {
      // Cores alternadas para as linhas
      const isEvenRow = index % 2 === 0;
      doc.setFillColor(isEvenRow ? 255 : 240, 255, 255); // Degradê alternado
      doc.rect(margin, yPosition, pageWidth - margin * 2, 10, "F");

      doc.setTextColor(0, 0, 0); // Cor do texto
      doc.text(field.label, margin + 5, yPosition + 7);
      doc.text(String(field.value), margin + columnWidth + 5, yPosition + 7);

      yPosition += 15;

      if (index < reportData.length - 1) {
        // Linha de separação entre as linhas de dados
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;
      }
    });

    // Rodapé (opcional)
    doc.setFontSize(8);
    doc.setFont("times", "italic");
    doc.text("Relatório gerado por Sis Florestal", margin, 290);

    // Salvar o relatório
    doc.save(`relatorio_imovel_${imovelNome}.pdf`);
    setIsReportModalOpen(false);
  };

  const handleFieldChange = (e) => {
    setSelectedFields({ ...selectedFields, [e.target.name]: e.target.checked });
  };

  const formatValue = (value, key) => {
    // Lista de campos de data
    const dateFields = [
      'data_plantio',
      'data_contrato',
      'vencimento_contrato'
    ];
  
    // Formata campos de data
    if (dateFields.includes(key) && value) {
      const dateValue = new Date(value);
      if (!isNaN(dateValue.getTime())) {
        const day = String(dateValue.getDate()).padStart(2, "0");
        const month = String(dateValue.getMonth() + 1).padStart(2, "0");
        const year = dateValue.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  
    // Retorna nulo para não exibir campos vazios
    if (value === null || value === undefined || value === "N/A" || value === "") {
        return null;
    }
    
    // Lista de campos que devem ser formatados como decimal
    const decimalFields = ['area_imovel', 'area_plantio'];

    // Se a chave (key) for uma das que precisam de formato decimal
    if (decimalFields.includes(key)) {
        const numericValue = Number(value);
        // Se a conversão para número for bem-sucedida, formata com 2 casas decimais
        if (isFinite(numericValue)) {
            return numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }
  
    // Para todos os outros casos (outros números, textos, etc.), retorna o valor como está.
    return String(value);
  };

  const fieldLabels = {
    descricao: "Descrição do Imóvel",
    area_imovel: "Área do Imóvel (ha)",
    area_plantio: "Área de Plantio (ha)",
    especie: "Espécie",
    origem: "Origem",
    num_arvores_plantadas: "Número de Árvores Plantadas",
    num_arvores_cortadas: "Número de Árvores Cortadas",
    num_arvores_remanescentes: "Número de Árvores Remanescentes",
    num_arvores_por_hectare: "Número de Árvores por Hectare",
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
    <div className="container mt-4">
    <h1 className="property-title">{imovel.descricao}</h1>

    {contractExpirationAlert && (
      <div className="property-alert">
        <strong>Atenção!</strong> {contractExpirationAlert}
      </div>
    )}

    <div className="property-details">
      {/* ***** INÍCIO DA ALTERAÇÃO ***** */}
      {/* 1. Renderiza o Código CC primeiro, se ele existir */}
      {imovel.codigo_cc && (
        <div className="property-detail" key="codigo_cc">
          <span className="property-label">{fieldLabels.codigo_cc}:</span>
          <span className="property-value">{formatValue(imovel.codigo_cc, 'codigo_cc')}</span>
        </div>
      )}

      {/* 2. Mapeia o restante dos campos, pulando os que não devem aparecer ou que já apareceram */}
      {Object.keys(imovel).map((key) => {
        // Pula a renderização dos campos 'id', 'descricao' e agora também 'codigo_cc'
        if (key === 'id' || key === 'descricao' || key === 'codigo_cc') {
          return null;
        }

        const formattedValue = formatValue(imovel[key], key);
        const label = fieldLabels[key] || key;
        
        if (formattedValue === null) {
          return null;
        }

        return (
          <div className="property-detail" key={key}>
            <span className="property-label">{label}:</span>
            <span className="property-value">{formattedValue}</span>
          </div>
        );
      })}
      {/* ***** FIM DA ALTERAÇÃO ***** */}
    </div>


<div className="custom-button-group mt-4">
  <button onClick={() => setIsReportModalOpen(true)} className="custom-button">
    Gerar Relatório
  </button>
  <button onClick={handleOpenDespesaPopup} className="custom-button">
    Registrar Despesa
  </button>
  <button onClick={handleOpenViewExpensePopup} className="custom-button">
    Relatório de Despesa
  </button>
  <button onClick={() => setIsDesramaPopupOpen(true)} className="custom-button">
    Registrar Desrama
  </button>
  <button onClick={handleDesramaTableOpen} className="custom-button">
    Relatório de Desrama
  </button>
  <button className="custom-button" onClick={handleOpenDesbastePopup}>
    Registrar Desbaste
  </button>
  <button className="custom-button" onClick={handleOpenDesbasteTable}>
    Relatório de Desbaste
  </button>
  <button onClick={handleOpenNotasModal} className="custom-button">
    Notas
  </button>
<button 
  className="custom-button" 
  onClick={() => window.location.href='https://drive.google.com/drive/folders/1QCx_FSAejryOU2hK-WEV2b37yV8_Okqf?usp=drive_link'}
>
  Arquivos
</button>
<button className="custom-button" onClick={handleOpenInventoryModal}>
  Inventário
</button>

  <button className="custom-button" onClick={handleOpenEditModal}>Editar</button>
</div>


<InventoryModal
  isOpen={isInventoryModalOpen}
  onClose={handleCloseInventoryModal}
  imovelId={id}
/>

{/* Modal de Edição */}
<EditImovelModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        imovel={imovel}
        onSave={handleSaveImovel}
      />

<FileModal
  isOpen={isFilesModalOpen}
  onClose={handleCloseFilesModal}
  imovelId={id}
/>


<MapModal
  isOpen={isMapModalOpen}
  onClose={() => setIsMapModalOpen(false)}
  imovelId={id}
/>


      <RegisterDespesaPopup
        isOpen={isDespesaPopupOpen}
        onClose={handleCloseDespesaPopup}
        imovelId={id}
      />

      <ExpenseTablePopup
        isOpen={isViewExpensePopupOpen} // Usar o estado de "Ver Despesas"
        imovelId={id}
        onClose={handleCloseViewExpensePopup}
      />

      <DesbasteTablePopup
        isOpen={isDesbasteTableOpen}
        imovelId={id}
        onClose={handleCloseDesbasteTable}
      />

      {/* Componente de Registrar Desrama */}
      <RegisterDesramaPopup
        isOpen={isDesramaPopupOpen}
        onClose={() => setIsDesramaPopupOpen(false)}
        imovelId={id}
      />

      <DesramaTablePopup
        isOpen={isDesramaTableOpen}
        imovelId={id}
        onClose={handleDesramaTableClose}
      />

      <RegisterDesbastePopup
        isOpen={isDesbastePopupOpen}
        onClose={handleCloseDesbastePopup}
        imovelId={id}
      />

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        imovelId={id}
      />

<NotasModal
        isOpen={isNotasModalOpen}
        onClose={handleCloseNotasModal}
        imovelId={id}
      />

{isReportModalOpen && (
  <div className="custom-modal">
    <h2 className="modal-title">Selecione as Propriedades para o Relatório</h2>
    <div className="custom-form-group">
      <button className="btn btn-select-all" onClick={handleSelectAll}>
        Selecionar Todos
      </button>
      {Object.keys(imovel).map((key) => {
        const label = fieldLabels[key] || key.replace(/_/g, " ").toUpperCase();
        return (
          // Também não mostra 'id' e 'descricao' nas opções do relatório
          (key !== "id" && key !== "descricao") && (
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
          )
        );
      })}
    </div>
    <div className="modal-actions">
      <button className="btn btn-success" onClick={handleGenerateReport}>
        Gerar Relatório
      </button>
      <button
        className="btn btn-danger"
        onClick={() => setIsReportModalOpen(false)}
      >
        Cancelar
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default ImovelDetails;
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import "./ExpenseTablePopup.css";
import logo from "../../img/logo.png";
import { API_BASE_URL } from "../../config";
import EditExpenseModal from "./EditExpenseModal";
import {
  FaFilePdf,
  FaRegCreditCard,
  FaTrashAlt,
  FaPencilAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

const initialColumnSelection = {
  tipoDeDespesa: true,
  fornecedor: true,
  produto: true,
  unidade: true,
  quantidade: true,
  valorUnitario: true,
  total: true,
  vencimento: true,
};

// Componente reutilizável para renderizar gráficos no React
const ChartComponent = ({ config }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const canvas = canvasRef.current;
    if (canvas) {
      chartRef.current = new Chart(canvas, config);
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [config]);

  return <canvas ref={canvasRef}></canvas>;
};


const ExpenseTablePopup = ({ isOpen, imovelId, onClose }) => {
  const [despesas, setDespesas] = useState([]);
  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForOrder, setSelectedForOrder] = useState([]);
  const [reportOptions, setReportOptions] = useState({
    startDate: "",
    endDate: "",
    columns: initialColumnSelection,
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const chartContainerRef = useRef(null);

  const expensesByType = useMemo(() => {
    return despesas.reduce((acc, despesa) => {
      const type = despesa.tipo_de_despesa || 'Não categorizado';
      if (!acc[type]) acc[type] = [];
      acc[type].push(despesa);
      return acc;
    }, {});
  }, [despesas]);


  const formatCurrency = useCallback((value) => {
    const number = parseFloat(value);
    return isNaN(number)
      ? "R$ 0,00"
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(number);
  }, []);

  const formatDate = useCallback((dateString) => {
    return dateString
      ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      : "N/A";
  }, []);

  const fetchData = useCallback(async () => {
    if (!imovelId) return;
    setLoading(true);
    setError(null);
    try {
      const [despesasRes, imovelRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/imoveis/${imovelId}/despesas`),
        axios.get(`${API_BASE_URL}/api/imoveis/${imovelId}`),
      ]);
      setDespesas(despesasRes.data);
      setImovel(imovelRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Não foi possível carregar os dados das despesas.");
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setDespesas([]);
      setImovel(null);
      setLoading(true);
      setError(null);
      setSelectedForOrder([]);
      setReportOptions({
        startDate: "",
        endDate: "",
        columns: initialColumnSelection,
      });
      setShowDeleteConfirmation(false);
      setItemToDeleteId(null);
      setIsEditModalOpen(false);
      setExpenseToEdit(null);
    }
  }, [isOpen, fetchData]);

  const confirmDelete = (id) => {
    setItemToDeleteId(id);
    setShowDeleteConfirmation(true);
  };
  const cancelDelete = () => {
    setItemToDeleteId(null);
    setShowDeleteConfirmation(false);
  };
  const executeDelete = async () => {
    if (!itemToDeleteId) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/despesas/${itemToDeleteId}`);
      setDespesas((prev) => prev.filter((d) => d.id !== itemToDeleteId));
      setSelectedForOrder((prev) => prev.filter((id) => id !== itemToDeleteId));
    } catch (err) {
      setError("Erro ao excluir despesa.");
    } finally {
      cancelDelete();
    }
  };

  const handleOpenEditModal = (despesa) => {
    setExpenseToEdit(despesa);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleUpdateExpense = async (updatedExpenseData) => {
    try {
      const { data: updatedExpense } = await axios.put(
        `${API_BASE_URL}/api/despesas/${updatedExpenseData.id}`,
        updatedExpenseData
      );
      setDespesas((prevDespesas) =>
        prevDespesas.map((d) =>
          d.id === updatedExpense.id ? updatedExpense : d
        )
      );
      handleCloseEditModal();
    } catch (err) {
      console.error("Erro ao atualizar despesa:", err);
      setError("Não foi possível atualizar a despesa. Tente novamente.");
    }
  };

  const handleSelectForOrder = (id) => {
    setSelectedForOrder((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAllForOrder = (e) => {
    setSelectedForOrder(e.target.checked ? despesas.map((d) => d.id) : []);
  };

  const handleReportOptionsChange = (e) => {
    const { name, value } = e.target;
    setReportOptions((prev) => ({ ...prev, [name]: value }));
  };

  const handleColumnSelectChange = (column) => {
    setReportOptions((prev) => ({
      ...prev,
      columns: { ...prev.columns, [column]: !prev.columns[column] },
    }));
  };

  const totalCusto = despesas.reduce(
    (sum, d) => sum + (parseFloat(d.total) || 0),
    0
  );
  const custoPorArvore = imovel?.num_arvores_remanescentes
    ? totalCusto / imovel.num_arvores_remanescentes
    : 0;
  const despesaPorHa = imovel?.area_plantio
    ? totalCusto / imovel.area_plantio
    : 0;
  const custoPorMuda = imovel?.num_arvores_plantadas
    ? totalCusto / imovel.num_arvores_plantadas
    : 0;
  
  const totalsByType = useMemo(() => {
    return Object.entries(expensesByType).reduce((acc, [type, despesasDoTipo]) => {
      const total = despesasDoTipo.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
      acc[type] = total;
      return acc;
    }, {});
  }, [expensesByType]);

  const comparativeChartConfig = useMemo(() => ({
    type: 'bar',
    data: {
      labels: Object.keys(totalsByType),
      datasets: [{
        label: 'Total Gasto por Tipo (R$)',
        data: Object.values(totalsByType),
        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c', '#34495e', '#1abc9c'],
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.raw)
          }
        },
        datalabels: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value)
          }
        }
      }
    }
  }), [totalsByType, formatCurrency]);

  const gerarOrdemPDF = () => {
    if (selectedForOrder.length === 0) {
      alert("Por favor, selecione ao menos uma despesa para gerar a ordem!");
      return;
    }
    const primeiraDespesa = despesas.find((d) => d.id === selectedForOrder[0]);
    if (!primeiraDespesa) {
      alert("Erro ao encontrar os dados da despesa selecionada.");
      return;
    }
    const fornecedorDaDespesa = primeiraDespesa.fornecedor || "N/A";
    const codigoCcDaDespesa = primeiraDespesa.codigo_cc || "N/A";
    let numeroOrdem = parseInt(localStorage.getItem("numeroOrdem") || "0", 10) + 1;
    localStorage.setItem("numeroOrdem", numeroOrdem);
    const pdf = new jsPDF();
    const contentWidth = 180;
    const margin = (pdf.internal.pageSize.width - contentWidth) / 2;
    const startY = 40;
    const primaryColor = [22, 160, 133];
    const textPrimaryColor = [30, 30, 30];
    const textSecondaryColor = [120, 120, 120];
    const imgWidth = 45;
    const imgHeight = 22.5;
    pdf.addImage(logo, "PNG", (pdf.internal.pageSize.width - imgWidth) / 2, 10, imgWidth, imgHeight);
    let currentY = startY + 10;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...textPrimaryColor);
    pdf.text(`Ordem de Pagamento #${numeroOrdem}`, margin, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...textSecondaryColor);
    pdf.text(`Despesa: ${codigoCcDaDespesa}`, margin + contentWidth, currentY - 2, { align: 'right' });
    pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR", { timeZone: "UTC" })}`, margin + contentWidth, currentY + 3, { align: 'right' });
    currentY += 12;
    const drawInfoLine = (label, value, y) => {
      pdf.setFontSize(10);
      pdf.setTextColor(...textSecondaryColor);
      pdf.setFont("helvetica", "normal");
      pdf.text(label, margin, y);
      pdf.setTextColor(...textPrimaryColor);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, margin + 35, y);
    };
    drawInfoLine("PROPRIETÁRIO:", imovel?.proprietario || "N/A", currentY);
    currentY += 7;
    drawInfoLine("FORNECEDOR:", fornecedorDaDespesa, currentY);
    currentY += 7;
    drawInfoLine("IMÓVEL/FAZENDA:", imovel?.descricao || "N/A", currentY);
    const tableColumns = ["Tipo de Despesa", "Quantidade", "Valor Unitário", "Vencimento", "Total"];
    const tableRows = selectedForOrder.map((despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return [
        despesa.tipo_de_despesa || "",
        parseInt(despesa.quantidade || 0, 10),
        formatCurrency(despesa.valor_unitario),
        formatDate(despesa.validade),
        formatCurrency(despesa.total),
      ];
    });
    pdf.autoTable({
      startY: currentY + 8,
      head: [tableColumns],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 10, },
      styles: { lineWidth: 0.1, lineColor: [200, 200, 200], font: 'helvetica', fontSize: 9, textColor: textPrimaryColor, cellPadding: 2.5 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 4: { halign: 'right' }, },
      tableWidth: contentWidth,
      margin: { left: margin },
    });
    const totalGeral = selectedForOrder.reduce((total, despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return total + (parseFloat(despesa.total) || 0);
    }, 0);
    const totalY = pdf.lastAutoTable.finalY + 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...textSecondaryColor);
    pdf.text('TOTAL GERAL', margin + contentWidth - 45, totalY, { align: 'right' });
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...textPrimaryColor);
    pdf.text(formatCurrency(totalGeral), margin + contentWidth, totalY, { align: 'right' });
    const finalY = totalY + 8;
    const rectHeight = finalY - startY;
    pdf.setDrawColor(...textSecondaryColor);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin - 7, startY - 7, contentWidth + 14, rectHeight, 4, 4);
    pdf.save(`ordem-de-pagamento-${numeroOrdem}.pdf`);
  };
 
const gerarRelatorioPDF = async () => {
    if (!reportOptions.startDate || !reportOptions.endDate) {
      alert("Você deve selecionar um intervalo de datas.");
      return;
    }

    const pdf = new jsPDF("landscape");
    const contentWidth = 277;
    const marginLeft = 10;
    const pageHeight = pdf.internal.pageSize.height;
    
    const headerColor = [39, 174, 96]; 
    const textColor = [45, 45, 45];
    const lightGrayColor = [240, 240, 240];
    const chartColors = ['#2ecc71', '#27ae60', '#1abc9c', '#16a085', '#00d2d3', '#3498db', '#9b59b6'];

    const addChartToPdf = async (chartId, chartConfig, x, y, width, height) => {
      const container = chartContainerRef.current;
      if (!container) return;
      const canvas = document.createElement('canvas');
      canvas.id = chartId;
      canvas.width = width * 3;
      canvas.height = height * 3;
      container.appendChild(canvas);
      try {
        const backgroundColorPlugin = {
          id: 'customBackgroundColor',
          beforeDraw: (chart) => {
            const { ctx } = chart;
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          }
        };
        chartConfig.plugins = [...(chartConfig.plugins || []), backgroundColorPlugin, ChartDataLabels];
        const chart = new Chart(canvas.getContext('2d'), chartConfig);
        await new Promise(resolve => setTimeout(resolve, 500));
        const imgData = chart.toBase64Image('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', x, y, width, height, undefined, 'FAST');
        chart.destroy();
      } catch (e) { console.error(`Erro ao gerar o gráfico ${chartId}:`, e); } 
      finally { container.removeChild(canvas); }
    };
    
    const drawSectionHeader = (text, y) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(...headerColor);
      pdf.rect(marginLeft, y - 6, contentWidth, 10, 'F');
      pdf.text(text, marginLeft + 3, y);
    };

    pdf.addImage(logo, "PNG", marginLeft, 8, 35, 14);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...headerColor);
    pdf.text(`Relatório de Despesas - ${imovel?.descricao || "Imóvel"}`, contentWidth + marginLeft, 15, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...textColor);
    pdf.text(`Período de ${formatDate(reportOptions.startDate)} a ${formatDate(reportOptions.endDate)}`, contentWidth + marginLeft, 21, { align: "right" });
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...headerColor);
    pdf.line(marginLeft, 28, contentWidth + marginLeft, 28);
    
    let currentY = 35;

    const filteredDespesas = despesas.filter((d) => {
      const expenseDate = new Date(d.data);
      if (isNaN(expenseDate.getTime())) return false; 
      return expenseDate >= new Date(reportOptions.startDate) && expenseDate <= new Date(reportOptions.endDate);
    });
    
    drawSectionHeader("Lançamentos Gerais no Período", currentY);
    currentY += 12;
    const tableColumns = [];
    if (reportOptions.columns.tipoDeDespesa) tableColumns.push("Tipo");
    if (reportOptions.columns.fornecedor) tableColumns.push("Fornecedor");
    if (reportOptions.columns.produto) tableColumns.push("Produto");
    if (reportOptions.columns.unidade) tableColumns.push("Un.");
    if (reportOptions.columns.quantidade) tableColumns.push("Qtd.");
    if (reportOptions.columns.valorUnitario) tableColumns.push("V. Unit.");
    if (reportOptions.columns.total) tableColumns.push("Total");
    if (reportOptions.columns.vencimento) tableColumns.push("Vencimento");

    const tableRows = filteredDespesas.map((despesa) => {
      const row = [];
      if (reportOptions.columns.tipoDeDespesa) row.push(despesa.tipo_de_despesa || "");
      if (reportOptions.columns.fornecedor) row.push(despesa.fornecedor || "");
      if (reportOptions.columns.produto) row.push(despesa.produto || "");
      if (reportOptions.columns.unidade) row.push(despesa.unidade || "");
      if (reportOptions.columns.quantidade) row.push(despesa.quantidade || "");
      if (reportOptions.columns.valorUnitario) row.push(formatCurrency(despesa.valor_unitario));
      if (reportOptions.columns.total) row.push(formatCurrency(despesa.total));
      if (reportOptions.columns.vencimento) row.push(formatDate(despesa.validade));
      return row;
    });

    pdf.autoTable({
      startY: currentY,
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: headerColor, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 1.5, textColor: textColor },
      theme: "grid",
    });

    currentY = pdf.lastAutoTable.finalY + 10;
    
    const totalGeralPeriodo = filteredDespesas.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(...headerColor);
    pdf.setDrawColor(...headerColor);
    pdf.roundedRect(marginLeft, currentY, contentWidth, 10, 2, 2, 'FD');
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL GERAL NO PERÍODO:", marginLeft + 5, currentY + 6.5);
    pdf.text(formatCurrency(totalGeralPeriodo), marginLeft + contentWidth - 5, currentY + 6.5, { align: 'right' });
    currentY += 17;

    pdf.setTextColor(...textColor);

    const blockHeight = 22;
    const blockGap = 8;
    if (currentY + (blockHeight * 2) + blockGap > pageHeight - 15) { 
        pdf.addPage();
        currentY = 20;
    }

    drawSectionHeader("Resumo Financeiro do Período", currentY);
    currentY += 12;

    const custoPorArvorePeriodo = imovel?.num_arvores_remanescentes ? totalGeralPeriodo / imovel.num_arvores_remanescentes : 0;
    const despesaPorHaPeriodo = imovel?.area_plantio ? totalGeralPeriodo / imovel.area_plantio : 0;
    const custoPorMudaPeriodo = imovel?.num_arvores_plantadas ? totalGeralPeriodo / imovel.num_arvores_plantadas : 0;
    
    const drawSummaryBlock = (x, y, width, height, label, value) => {
        pdf.setDrawColor(220, 220, 220);
        pdf.setFillColor(...lightGrayColor);
        pdf.roundedRect(x, y, width, height, 3, 3, 'FD');
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(label, x + 8, y + 8);
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(...textColor);
        pdf.text(value, x + width - 8, y + height - 6, { align: 'right' });
    };

    const blockWidth = (contentWidth / 2) - (blockGap / 2);
    const row1Y = currentY;
    const row2Y = row1Y + blockHeight + blockGap;

    drawSummaryBlock(marginLeft, row1Y, blockWidth, blockHeight, 'Custo Total no Período', formatCurrency(totalGeralPeriodo));
    drawSummaryBlock(marginLeft + blockWidth + blockGap, row1Y, blockWidth, blockHeight, 'Custo / Árvore Remanescente', formatCurrency(custoPorArvorePeriodo));
    
    drawSummaryBlock(marginLeft, row2Y, blockWidth, blockHeight, 'Despesa / Hectare', formatCurrency(despesaPorHaPeriodo));
    drawSummaryBlock(marginLeft + blockWidth + blockGap, row2Y, blockWidth, blockHeight, 'Custo / Muda Plantada', formatCurrency(custoPorMudaPeriodo));

    currentY = row2Y + blockHeight + 15;

    // =========================================================================
    // ALTERADO: Lógica da tabela de análise comparativa para incluir percentual
    // =========================================================================
    const totalsByTypeForPDF = filteredDespesas.reduce((acc, despesa) => {
        const type = despesa.tipo_de_despesa || 'Não categorizado';
        if (!acc[type]) acc[type] = 0;
        acc[type] += parseFloat(despesa.total) || 0;
        return acc;
    }, {});
    
    if (Object.keys(totalsByTypeForPDF).length > 0) {
      if (currentY + 80 > pageHeight - 15) { 
          pdf.addPage();
          currentY = 20;
      }

      drawSectionHeader("Análise Comparativa por Tipo de Despesa", currentY);
      currentY += 12;

      const summaryTableX = marginLeft;
      const summaryTableWidth = contentWidth * 0.4;
      const chartX = summaryTableX + summaryTableWidth + 10;
      const chartWidth = contentWidth - summaryTableWidth - 10;
      const sectionStartY = currentY;

      // Corpo da tabela agora inclui o cálculo do percentual
      const summaryTableBody = Object.entries(totalsByTypeForPDF).map(([type, total]) => {
          const percentage = totalGeralPeriodo > 0 ? (total / totalGeralPeriodo) * 100 : 0;
          const formattedPercentage = `${percentage.toFixed(2).replace('.', ',')} %`;
          return [type, formatCurrency(total), formattedPercentage];
      });

      pdf.autoTable({
          startY: sectionStartY,
          head: [['Tipo de Despesa', 'Valor Total', 'Percentual (%)']], // Cabeçalho atualizado
          body: summaryTableBody,
          theme: 'striped',
          headStyles: { fillColor: headerColor, fontSize: 9 },
          styles: { fontSize: 8, cellPadding: 1.5, textColor: textColor },
          margin: { left: summaryTableX },
          tableWidth: summaryTableWidth,
          // Alinhamento atualizado para a coluna de total e percentual
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }, 
      });
      
      const chartHeight = Math.max(70, summaryTableBody.length * 9); 
      const comparativeChartConfigPDF = {
          type: 'bar',
          data: {
              labels: Object.keys(totalsByTypeForPDF),
              datasets: [{
                  data: Object.values(totalsByTypeForPDF),
                  backgroundColor: chartColors,
                  borderColor: headerColor,
                  borderWidth: 1,
              }]
          },
          options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (c) => formatCurrency(c.raw) } },
                  datalabels: {
                      display: true, anchor: 'end', align: 'right',
                      formatter: (value) => formatCurrency(value),
                      color: textColor, font: { size: 9, weight: 'bold' }
                  }
              },
              scales: {
                  x: { ticks: { callback: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(v) } },
                  y: { ticks: { font: { size: 8 } } }
              }
          }
      };
      await addChartToPdf('comparative-chart-pdf', comparativeChartConfigPDF, chartX, sectionStartY, chartWidth, chartHeight);
    }
    
    pdf.save(`relatorio-despesas-${imovel?.descricao?.replace(/\s+/g, '-') || 'imovel'}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="expense-modal-overlay" onClick={onClose}>
      <div
        className="expense-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={chartContainerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1000px', height: '1000px' }}></div>
        
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          expense={expenseToEdit}
          onSave={handleUpdateExpense}
        />

        {showDeleteConfirmation && (
          <div className="delete-confirmation-overlay" onClick={cancelDelete}>
            <div
              className="delete-confirmation-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <FaExclamationTriangle className="warning-icon" />
              <h3>Confirmar Exclusão</h3>
              <p>
                Tem certeza que deseja excluir esta despesa? A ação não pode ser
                desfeita.
              </p>
              <div className="modal-footer-stacked">
                <button className="btn-danger-stacked" onClick={executeDelete}>
                  <FaTrashAlt /> Confirmar Exclusão
                </button>
                <button className="btn-link-stacked" onClick={cancelDelete}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="expense-modal-header">
          <h2 className="expense-modal-title">Relatório de Despesas</h2>
          <span className="expense-modal-subtitle">
            {imovel?.descricao || ""}
          </span>
          <button className="expense-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </header>

        <main className="expense-modal-body">
          {loading ? (
            <p className="expense-loading-message">Carregando...</p>
          ) : error ? (
            <p className="expense-error-message">{error}</p>
          ) : (
            <>
              <section className="expense-section">
                <h3 className="expense-section-title">Resumo Financeiro</h3>
                <table className="expense-summary-table">
                  <thead>
                    <tr>
                      <th>Custo Total</th>
                      <th>Custo / Árv. Remanescentes</th>
                      <th>Despesa / Ha</th>
                      <th>Custo por Muda</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td data-label="Custo Total">
                        {formatCurrency(totalCusto)}
                      </td>
                      <td data-label="Custo / Árv. Rem.">
                        {formatCurrency(custoPorArvore)}
                      </td>
                      <td data-label="Despesa / Ha">
                        {formatCurrency(despesaPorHa)}
                      </td>
                      <td data-label="Custo por Muda">
                        {formatCurrency(custoPorMuda)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <div className="expense-divider"></div>

              <section className="expense-section">
                <h3 className="expense-section-title">Lista de Despesas</h3>
                <div className="expense-table-responsive">
                  <table className="expense-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            onChange={handleSelectAllForOrder}
                            checked={
                              despesas.length > 0 &&
                              selectedForOrder.length === despesas.length
                            }
                            title="Selecionar Todos para Ordem"
                          />
                        </th>
                        <th>Tipo</th>
                        <th>Fornecedor</th>
                        <th>Produto</th>
                        <th>Unidade</th>
                        <th>Qtd.</th>
                        <th>V. Unitário</th>
                        <th>Total</th>
                        <th>Vencimento</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesas.map((despesa) => (
                        <tr
                          key={despesa.id}
                          className={
                            selectedForOrder.includes(despesa.id)
                              ? "selected-row"
                              : ""
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedForOrder.includes(despesa.id)}
                              onChange={() =>
                                handleSelectForOrder(despesa.id)
                              }
                            />
                          </td>
                          <td>{despesa.tipo_de_despesa}</td>
                          <td>{despesa.fornecedor}</td>
                          <td>{despesa.produto}</td>
                          <td>{despesa.unidade}</td>
                          <td className="text-right">{despesa.quantidade}</td>
                          <td className="text-right">
                            {formatCurrency(despesa.valor_unitario)}
                          </td>
                          <td className="text-right total-cell">
                            {formatCurrency(despesa.total)}
                          </td>
                          <td>{formatDate(despesa.validade)}</td>
                          <td className="actions-cell">
                            <button
                              className="action-btn-expense edit-btn"
                              title="Editar Despesa"
                              onClick={() => handleOpenEditModal(despesa)}
                            >
                              <FaPencilAlt />
                            </button>
                            <button
                              className="action-btn-expense delete-btn"
                              title="Excluir Despesa"
                              onClick={() => confirmDelete(despesa.id)}
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              
              <div className="expense-divider"></div>

              <section className="expense-section">
                <h3 className="expense-section-title">
                  Opções de Relatório Geral
                </h3>
                <div className="expense-report-options">
                  <div className="date-filter">
                    <label>Período do Relatório:</label>
                    <div className="date-inputs">
                      <input
                        type="date"
                        name="startDate"
                        value={reportOptions.startDate}
                        onChange={handleReportOptionsChange}
                      />
                      <span>até</span>
                      <input
                        type="date"
                        name="endDate"
                        value={reportOptions.endDate}
                        onChange={handleReportOptionsChange}
                      />
                    </div>
                  </div>
                  <div className="column-filter">
                    <label>Colunas Incluídas:</label>
                    <div className="column-checkboxes">
                      {Object.keys(initialColumnSelection).map((col) => (
                        <div className="checkbox-item" key={col}>
                          <input
                            type="checkbox"
                            id={`col-${col}`}
                            name={col}
                            checked={reportOptions.columns[col]}
                            onChange={() => handleColumnSelectChange(col)}
                          />
                          <label htmlFor={`col-${col}`}>
                            {col
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="expense-divider"></div>
              
              {/* ========================================================================= */}
              {/* ALTERADO: Seção unificada com tabela e gráfico comparativo com percentual */}
              {/* ========================================================================= */}
              <section className="expense-section">
                <h3 className="expense-section-title">Análise Comparativa por Tipo de Despesa</h3>
                <div className="expense-table-responsive" style={{ marginBottom: '2rem' }}>
                    <table className="summary-table">
                        <thead>
                            <tr>
                                <th>Tipo de Despesa</th>
                                <th className="text-right">Total</th>
                                <th className="text-right">Percentual (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(totalsByType).map(([type, total]) => (
                                <tr key={type}>
                                    <td>{type}</td>
                                    <td className="text-right">{formatCurrency(total)}</td>
                                    <td className="text-right">
                                        {/* Cálculo do percentual em relação ao custo total de todas as despesas */}
                                        {totalCusto > 0 
                                            ? `${((total / totalCusto) * 100).toFixed(2).replace('.', ',')} %` 
                                            : '0,00 %'
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="comparative-chart-container" style={{ position: 'relative', height: '350px' }}>
                    <ChartComponent config={comparativeChartConfig} />
                </div>
              </section>
            </>
          )}
        </main>
        
        <footer className="expense-modal-footer">
          <button
            type="button"
            className="modal-btn-expense btn-cancel-expense"
            onClick={onClose}
          >
            Fechar
          </button>
          <button
            type="button"
            className="modal-btn-expense btn-secondary-expense"
            onClick={gerarOrdemPDF}
            disabled={selectedForOrder.length === 0}
          >
            <FaRegCreditCard /> Gerar Ordem
          </button>
          <button
            type="button"
            className="modal-btn-expense btn-success-expense"
            onClick={gerarRelatorioPDF}
            disabled={!reportOptions.startDate || !reportOptions.endDate}
          >
            <FaFilePdf /> Gerar Relatório
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ExpenseTablePopup;
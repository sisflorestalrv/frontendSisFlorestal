import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import "./ExpenseTablePopup.css";
import logo from "../../img/logo.png";
import { API_BASE_URL } from "../../config";
import {
  FaFilePdf,
  FaRegCreditCard,
  FaTrashAlt,
  FaExclamationTriangle,
} from "react-icons/fa";

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

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    return isNaN(number)
      ? "R$ 0,00"
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(number);
  };

  const formatDate = (dateString) => {
    return dateString
      ? new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      : "N/A";
  };

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

  // --- LÓGICA DO PDF DE ORDEM DE PAGAMENTO RESTAURADA ---
  const gerarOrdemPDF = () => {
    if (selectedForOrder.length === 0) {
      alert("Por favor, selecione ao menos uma despesa para gerar a ordem!");
      return;
    }

    let numeroOrdem =
      parseInt(localStorage.getItem("numeroOrdem") || "0", 10) + 1;
    localStorage.setItem("numeroOrdem", numeroOrdem);

    const pdf = new jsPDF();
    const contentWidth = 180;
    const squareX = (pdf.internal.pageSize.width - contentWidth) / 2;
    const squareY = 15 + 20;
    const squareHeight = 95;

    const imgWidth = 50;
    const imgHeight = 25;
    pdf.addImage(
      logo,
      "PNG",
      (pdf.internal.pageSize.width - imgWidth) / 2,
      10,
      imgWidth,
      imgHeight
    );

    pdf.setDrawColor(0, 0, 0, 50);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(squareX, squareY, contentWidth, squareHeight, 3, 3);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    const ordemTop = squareY + 10;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Ordem de Pagamento ${numeroOrdem}`, squareX + 5, ordemTop);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Despesa: " + (despesas[0]?.codigo_cc || "N/A"),
      squareX + contentWidth - 40,
      ordemTop
    );

    const linhaImovelDataTop = ordemTop + 10;
    pdf.text(
      "Nome do Imóvel: " + (imovel?.descricao || "N/A"),
      squareX + 5,
      linhaImovelDataTop
    );
    pdf.text(
      "Data: " + new Date().toLocaleDateString("pt-BR"),
      squareX + contentWidth - 40,
      linhaImovelDataTop
    );

    const linhaProprietarioTop = linhaImovelDataTop + 10;
    pdf.text(
      "Proprietário: " + (imovel?.proprietario || "N/A"),
      squareX + 5,
      linhaProprietarioTop
    );

    const tableColumns = [
      "Tipo de Despesa",
      "Quantidade",
      "Valor Unitário",
      "Vencimento",
      "Total",
    ];

    const tableRows = selectedForOrder.map((despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return [
        despesa.tipo_de_despesa || "",
        despesa.quantidade || 0,
        `R$ ${parseFloat(despesa.valor_unitario || 0).toFixed(2)}`,
        new Date(despesa.validade).toLocaleDateString("pt-BR") || "",
        `R$ ${parseFloat(despesa.total || 0).toFixed(2)}`,
      ];
    });

    pdf.autoTable({
      startY: linhaProprietarioTop + 8,
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      theme: "grid",
      tableWidth: contentWidth,
      margin: { left: squareX },
    });

    const totalGeral = selectedForOrder.reduce((total, despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return total + (parseFloat(despesa.total) || 0);
    }, 0);

    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 4,
      body: [["Total", "", "", `R$ ${totalGeral.toFixed(2)}`, ""]],
      styles: { fontSize: 10, halign: "right" },
      columnStyles: { 0: { halign: "left" } },
      tableWidth: contentWidth,
      margin: { left: squareX },
    });

    pdf.save(`ordem-de-pagamento-${numeroOrdem}.pdf`);
  };

  // --- LÓGICA DO PDF DE RELATÓRIO GERAL RESTAURADA ---
  const gerarRelatorioPDF = () => {
    if (!reportOptions.startDate || !reportOptions.endDate) {
      alert("Você deve selecionar um intervalo de datas.");
      return;
    }

    const pdf = new jsPDF("landscape");
    const contentWidth = 270;
    const marginLeft = (pdf.internal.pageSize.width - contentWidth) / 2;

    pdf.addImage(
      logo,
      "PNG",
      (pdf.internal.pageSize.width - 50) / 2,
      10,
      50,
      20
    );
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(
      `Relatório de Despesas - ${imovel?.descricao || "Imóvel"}`,
      pdf.internal.pageSize.width / 2,
      40,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(
      `Período de ${formatDate(reportOptions.startDate)} até ${formatDate(
        reportOptions.endDate
      )}`,
      pdf.internal.pageSize.width / 2,
      48,
      { align: "center" }
    );

    const tableColumns = [];
    if (reportOptions.columns.tipoDeDespesa)
      tableColumns.push("Tipo de Despesa");
    if (reportOptions.columns.fornecedor) tableColumns.push("Fornecedor");
    if (reportOptions.columns.produto) tableColumns.push("Produto");
    if (reportOptions.columns.unidade) tableColumns.push("Unidade");
    if (reportOptions.columns.quantidade) tableColumns.push("Qtd.");
    if (reportOptions.columns.valorUnitario) tableColumns.push("V. Unitário");
    if (reportOptions.columns.total) tableColumns.push("Total");
    if (reportOptions.columns.vencimento) tableColumns.push("Vencimento");

    const filteredDespesas = despesas.filter((despesa) => {
      const despesaDate = new Date(despesa.data);
      const start = new Date(reportOptions.startDate);
      const end = new Date(reportOptions.endDate);
      return despesaDate >= start && despesaDate <= end;
    });

    const tableRows = filteredDespesas.map((despesa) => {
      const row = [];
      if (reportOptions.columns.tipoDeDespesa)
        row.push(despesa.tipo_de_despesa || "");
      if (reportOptions.columns.fornecedor) row.push(despesa.fornecedor || "");
      if (reportOptions.columns.produto) row.push(despesa.produto || "");
      if (reportOptions.columns.unidade) row.push(despesa.unidade || "");
      if (reportOptions.columns.quantidade) row.push(despesa.quantidade || "");
      if (reportOptions.columns.valorUnitario)
        row.push(formatCurrency(despesa.valor_unitario));
      if (reportOptions.columns.total) row.push(formatCurrency(despesa.total));
      if (reportOptions.columns.vencimento)
        row.push(formatDate(despesa.validade));
      return row;
    });

    pdf.autoTable({
      startY: 60,
      head: [tableColumns],
      body: tableRows,
      headStyles: { fillColor: [22, 160, 133] },
      theme: "grid",
    });

    const totalDespesas = filteredDespesas.reduce(
      (total, despesa) => total + (parseFloat(despesa.total) || 0),
      0
    );

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `Total de Despesas no Período: ${formatCurrency(totalDespesas)}`,
      marginLeft,
      pdf.lastAutoTable.finalY + 15
    );

    pdf.save("relatorio-de-despesas.pdf");
  };

  if (!isOpen) return null;

  return (
    <>
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

      <div className="expense-modal-overlay" onClick={onClose}>
        <div
          className="expense-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
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
                        {/* ADICIONE OS data-label AQUI */}
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
                          <th>Ação</th>
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
                            <td>
                              <button
                                className="action-btn-expense"
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
    </>
  );
};

export default ExpenseTablePopup;

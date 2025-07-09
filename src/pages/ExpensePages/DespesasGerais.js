import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilePdf } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png';
import './ExpensesPage.css';
import { API_BASE_URL } from "../../config";

const ExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/despesas`)
      .then((response) => response.json())
      .then((data) => setExpenses(data))
      .catch((error) => console.error('Erro ao buscar despesas:', error));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredExpenses = expenses.filter((expense) =>
    (expense.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.descricao_imovel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (expense.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckboxChange = (expense) => {
    setSelectedExpenses(prevSelected =>
      prevSelected.find(item => item.id === expense.id)
        ? prevSelected.filter(item => item.id !== expense.id)
        : [...prevSelected, expense]
    );
  };
  
  const formatCurrency = (value) => {
    const number = Number(value);
    if (isNaN(number)) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(number);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (date instanceof Date && !isNaN(date)) {
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    return 'Data inválida';
  };

  const handleGeneratePDF = () => {
    if (selectedExpenses.length === 0) {
      alert("Por favor, selecione ao menos uma despesa para gerar o relatório.");
      return;
    }
  
    const doc = new jsPDF({ orientation: 'landscape' });
  
    // --- CABEÇALHO DO PDF ---
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
  
    doc.addImage(logo, 'PNG', margin, margin, 40, 15);
  
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#333333');
    doc.text('Relatório de Despesas', pageWidth - margin, margin + 10, { align: 'right' });
  
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#666666');
    const propertyName = selectedExpenses[0]?.descricao_imovel || 'Diversos';
    doc.text(`Imóvel: ${propertyName}`, pageWidth - margin, margin + 16, { align: 'right' });
    
    // --- TABELA DE DESPESAS ---
    const tableData = selectedExpenses.map(expense => [
      formatDate(expense.data),
      expense.descricao_imovel,
      expense.fornecedor,
      expense.descricao,
      parseInt(expense.quantidade, 10),
      formatCurrency(expense.total),
    ]);
  
    const totalValue = selectedExpenses.reduce((sum, expense) => sum + parseFloat(expense.total), 0);
    tableData.push([
      { content: 'TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', textColor: '#333333'} },
      { content: formatCurrency(totalValue), styles: { fontStyle: 'bold', textColor: '#333333' } },
    ]);
  
    doc.autoTable({
      head: [['Data', 'Imóvel', 'Fornecedor', 'Descrição', 'Qtd', 'Valor']],
      body: tableData,
      startY: 45,
      theme: 'striped',
      styles: {
        font: 'Helvetica',
        fontSize: 9,
        cellPadding: 3.5,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: '#4CAF50', // Usando o novo verde vivo
        textColor: '#FFFFFF',
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA',
      },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });
  
    // --- RODAPÉ DO PDF ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#AAAAAA');
      const footerText = `Relatório gerado por Sis Florestal em ${new Date().toLocaleDateString()} | Página ${i} de ${pageCount}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  
    doc.save(`relatorio_despesas_${propertyName.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="expenses-container">
      <div className="toolbar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="expenses-search-input"
            placeholder="Pesquisar por imóvel, fornecedor ou descrição..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button 
          className="expenses-generate-btn" 
          onClick={handleGeneratePDF}
          disabled={selectedExpenses.length === 0}
        >
          <FaFilePdf />
          Gerar Relatório
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table expenses-table mt-4">
          <thead>
            <tr>
              <th></th>
              <th>Data</th>
              <th>Imóvel</th>
              <th>Fornecedor</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedExpenses.some(item => item.id === expense.id)}
                      onChange={() => handleCheckboxChange(expense)}
                    />
                  </td>
                  <td>{formatDate(expense.data)}</td>
                  <td>{expense.descricao_imovel}</td>
                  <td>{expense.fornecedor}</td>
                  <td>{expense.descricao}</td>
                  <td className="text-center">{parseInt(expense.quantidade, 10)}</td>
                  <td className="text-right">{formatCurrency(expense.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center no-results">Nenhuma despesa encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesPage;
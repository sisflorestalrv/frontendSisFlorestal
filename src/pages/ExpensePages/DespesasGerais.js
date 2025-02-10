import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilePdf } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png'; // Importe a logo do seu diretório
import './ExpensesPage.css'; // Importe o CSS exclusivo para essa página

const ExpensesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/despesas')
      .then((response) => response.json())
      .then((data) => setExpenses(data))
      .catch((error) => console.error('Erro ao buscar despesas:', error));
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredExpenses = expenses.filter((expense) =>
    expense.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckboxChange = (expense) => {
    if (selectedExpenses.includes(expense)) {
      setSelectedExpenses(selectedExpenses.filter((item) => item.id !== expense.id));
    } else {
      setSelectedExpenses([...selectedExpenses, expense]);
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF('landscape');
    
    const logoWidth = 50;
    const logoHeight = 20;
    const logoX = (doc.internal.pageSize.width - logoWidth) / 2;
    const logoY = 10;
    doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    const title = `Relatório de Despesas ${selectedExpenses.length > 0 ? selectedExpenses[0].descricao_imovel : 'Sem Descrição'}`;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");

    const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize();
    const titleX = (doc.internal.pageSize.width - logoWidth) / 2.6;
    const titleY = logoY + logoHeight + 10;
    
    doc.text(title, titleX, titleY);
    
    const tableData = selectedExpenses.map((expense) => [
      new Date(expense.data).toLocaleDateString('pt-BR'),
      expense.descricao,
      expense.produto,
      expense.quantidade,
      `R$ ${Number(expense.total).toFixed(2)}`,
      new Date(expense.validade).toLocaleDateString('pt-BR'),
      
      
    ]);

    doc.autoTable({
      head: [['Data', 'Descrição', 'Produto', 'Quantidade', 'Valor Total', 'Vencimento']],
      body: tableData,
      startY: titleY + 20,
      theme: 'grid',
      styles: {
        cellPadding: 3,
        fontSize: 12,
        font: "helvetica",
        textColor: 0,
        lineWidth: 0.1,
        lineColor: [44, 62, 80],
        halign: 'center',
      },
      headStyles: {
        fillColor: [34, 139, 34], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 20 },
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Relatório gerado por Sis Florestal", doc.internal.pageSize.width - 100, doc.internal.pageSize.height - 10);

    doc.save('relatorio-despesas.pdf');
  };

  const formatDate = (date) => {
    const formattedDate = new Date(date);
    return formattedDate instanceof Date && !isNaN(formattedDate)
      ? formattedDate.toLocaleDateString('pt-BR')
      : 'Data inválida';
  };

  return (
    <div className="expenses-container mt-4">
      <h1 className="text-center expenses-title">Despesas Gerais</h1>
      <div className="search-bar mt-4 d-flex justify-content-between align-items-center">
        <div className="input-group">
          <input
            type="text"
            className="form-control expenses-search-input"
            placeholder="Pesquisar despesa..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <span className="input-group-text expenses-search-icon">
            <FaSearch />
          </span>
        </div>
      </div>
      <table className="table expenses-table mt-4">
        <thead>
          <tr>
            <th></th>
            <th>Data</th>
            <th>Imóvel</th>
            <th>Descrição</th>
            <th>Quantidade</th>
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
                    checked={selectedExpenses.includes(expense)}
                    onChange={() => handleCheckboxChange(expense)}
                  />
                </td>
                <td>{formatDate(expense.data)}</td>
                <td>{expense.descricao_imovel}</td>
                <td>{expense.descricao}</td>
                <td>{parseInt(expense.quantidade, 10)}</td>
                <td>R$ {Number(expense.total).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">Nenhuma despesa encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="text-center mt-4">
        <button className="btn expenses-generate-btn" onClick={handleGeneratePDF}>
          <FaFilePdf /> Gerar Relatório 
        </button>
      </div>
    </div>
  );
};

export default ExpensesPage;

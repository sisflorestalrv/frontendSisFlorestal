import React, { useState, useEffect } from 'react'; 
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ExpenseTablePopup.css';
import logo from '../../img/logo.png';

const ExpenseTablePopup = ({ isOpen, imovelId, onClose }) => {
  const [despesas, setDespesas] = useState([]);
  const [imovel, setImovel] = useState(null);
  const [selectedDespesas, setSelectedDespesas] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetching despesas
      fetch(`http://localhost:5000/api/imoveis/${imovelId}/despesas`)
        .then((res) => res.json())
        .then((data) => setDespesas(data))
        .catch((err) => console.error('Erro ao buscar despesas:', err));

      // Fetching imóvel details
      fetch(`http://localhost:5000/api/imoveis/${imovelId}`)
        .then((res) => res.json())
        .then((data) => setImovel(data))
        .catch((err) => console.error('Erro ao buscar imóvel:', err));
    }
  }, [isOpen, imovelId]);
  const handleDeleteDespesa = (despesaId) => {
    // Enviar requisição para deletar a despesa
    fetch(`http://localhost:5000/api/despesas/${despesaId}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) {
          // Remover a despesa da lista local após exclusão bem-sucedida
          setDespesas(despesas.filter((despesa) => despesa.id !== despesaId));
          alert('Despesa excluída com sucesso!');
        } else {
          alert('Erro ao excluir despesa!');
        }
      })
      .catch((err) => console.error('Erro ao excluir despesa:', err));
  };

  const [selectedColumns, setSelectedColumns] = useState({
    tipoDeDespesa: true,
    fornecedor: true,
    produto: true,
    unidade: true,
    quantidade: true,
    valorUnitario: true,
    total: true,
    vencimento: true,
  });

  const handleColumnSelectChange = (column) => {
    setSelectedColumns((prevSelected) => ({
      ...prevSelected,
      [column]: !prevSelected[column],
    }));
  };
  
  

  const totalCusto = despesas.length > 0 ? despesas.reduce(
    (sum, despesa) => sum + (parseFloat(despesa.total) || 0), 
    0
  ) : 0;
  
  
  const custoPorArvore = imovel?.num_arvores_remanescentes
  ? totalCusto / imovel.num_arvores_remanescentes
  : 0;

const despesaPorHa = imovel?.area_plantio
  ? totalCusto / imovel.area_plantio
  : 0;

const custoPorMuda = imovel?.num_arvores_plantadas
  ? totalCusto / imovel.num_arvores_plantadas
  : 0;


  const gerarOrdemPDF = () => {
    if (selectedDespesas.length === 0) {
      alert('Por favor, selecione ao menos uma despesa para gerar a ordem!');
      return;
    }
  
    // Recuperar o número da ordem do localStorage ou inicializar como 1
    let numeroOrdem = parseInt(localStorage.getItem('numeroOrdem') || '0', 10) + 1;
    localStorage.setItem('numeroOrdem', numeroOrdem);
  
    const pdf = new jsPDF();
    const marginLeft = 10;
    const marginTop = 15;
    const contentWidth = 180;
  
    const squareX = (pdf.internal.pageSize.width - contentWidth) / 2;
    const squareY = marginTop + 20;
    const squareHeight = 95; // Aumentado para acomodar o proprietário
  
    const imgWidth = 50;
    const imgHeight = 25;
    pdf.addImage(logo, 'PNG', (pdf.internal.pageSize.width - imgWidth) / 2, 10, imgWidth, imgHeight);
  
    pdf.setDrawColor(0, 0, 0, 50);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(squareX, squareY, contentWidth, squareHeight, 3, 3);
  
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
  
    const ordemTop = squareY + 10;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Ordem de Pagamento ${numeroOrdem}`, squareX + 5, ordemTop); // Adicionado número da ordem
  
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text('Despesa: ' + (despesas[0]?.codigo_cc || 'N/A'), squareX + contentWidth - 40, ordemTop);
  
    const linhaImovelDataTop = ordemTop + 10;
    pdf.text('Nome do Imóvel: ' + (imovel?.descricao || 'N/A'), squareX + 5, linhaImovelDataTop);
    pdf.text('Data: ' + new Date().toLocaleDateString('pt-BR'), squareX + contentWidth - 40, linhaImovelDataTop);
  
    // Adicionando o campo proprietário
    const linhaProprietarioTop = linhaImovelDataTop + 10;
    pdf.text('Proprietário: ' + (imovel?.proprietario || 'N/A'), squareX + 5, linhaProprietarioTop);
  
    const tableColumns = [
      'Tipo de Despesa',
      'Quantidade',
      'Valor Unitário',
      'Vencimento',
      'Total',
    ];
  
    const tableRows = selectedDespesas.map((despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return [
        despesa.tipo_de_despesa || '',
        despesa.quantidade || 0,
        `R$ ${parseFloat(despesa.valor_unitario || 0).toFixed(2)}`,
        new Date(despesa.validade).toLocaleDateString('pt-BR') || '',
        `R$ ${parseFloat(despesa.total || 0).toFixed(2)}`,
      ];
    });
  
    pdf.autoTable({
      startY: linhaProprietarioTop + 8,
      head: [tableColumns],
      body: tableRows,
      headStyles: {
        fillColor: [0, 255, 0],
        textColor: 255,
        fontSize: 9,
        halign: 'center',
        fontStyle: 'bold',
        cellPadding: 2,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        cellPadding: 3,
        lineWidth: 0.3,
      },
      theme: 'grid',
      tableWidth: contentWidth,
      margin: { left: (pdf.internal.pageSize.width - contentWidth) / 2 },
    });
  
    const totalGeral = selectedDespesas.reduce((total, despesaId) => {
      const despesa = despesas.find((d) => d.id === despesaId);
      return total + (parseFloat(despesa.total) || 0);
    }, 0);
  
    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 4,
      body: [['Total', '', '', `R$ ${totalGeral.toFixed(2)}`, '']],
      styles: {
        fontSize: 10,
        halign: 'right',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        cellPadding: 2,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { halign: 'left' },
      },
      tableWidth: contentWidth,
      margin: { left: (pdf.internal.pageSize.width - contentWidth) / 2 },
    });
  
    pdf.save(`ordem-de-pagamento-${numeroOrdem}.pdf`); // Nome do arquivo com o número da ordem
  };
  

  const gerarRelatorioPDF = () => {
    if (!startDate || !endDate) {
      alert("Você deve selecionar um intervalo de datas.");
      return;
    }
  
    const pdf = new jsPDF('landscape');
    const contentWidth = 180;
    const marginLeft = (pdf.internal.pageSize.width - contentWidth) / 2;
    const marginTop = 15;
    const imgWidth = 50;
    const imgHeight = 25;
    pdf.addImage(logo, 'PNG', (pdf.internal.pageSize.width - imgWidth) / 2, 10, imgWidth, imgHeight);
  
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(`Relatório de Despesas do Imóvel ${imovel?.descricao}`, marginLeft + 5, marginTop + 25);
  
    // Formatar as datas para aa/mm/aaaa
    const formattedStartDate = new Date(startDate.split('/').reverse().join('/')).toLocaleDateString('pt-BR');
    const formattedEndDate = new Date(endDate.split('/').reverse().join('/')).toLocaleDateString('pt-BR');
  
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Relatório gerado de ${formattedStartDate} até ${formattedEndDate}`, marginLeft + 5, marginTop + 35);
  
    const tableColumns = [];
    if (selectedColumns.tipoDeDespesa) tableColumns.push('Tipo de Despesa');
    if (selectedColumns.fornecedor) tableColumns.push('Fornecedor');
    if (selectedColumns.produto) tableColumns.push('Produto');
    if (selectedColumns.unidade) tableColumns.push('Unidade');
    if (selectedColumns.quantidade) tableColumns.push('Quantidade');
    if (selectedColumns.valorUnitario) tableColumns.push('Valor Unitário');
    if (selectedColumns.total) tableColumns.push('Total');
    if (selectedColumns.vencimento) tableColumns.push('Vencimento');
  
    const filteredDespesas = despesas.filter((despesa) => {
      const despesaDate = new Date(despesa.data);
      const start = new Date(startDate.split('/').reverse().join('/'));
      const end = new Date(endDate.split('/').reverse().join('/'));
      return despesaDate >= start && despesaDate <= end;
    });
  
    const tableRows = filteredDespesas.map((despesa) => {
      const row = [];
      if (selectedColumns.tipoDeDespesa) row.push(despesa.tipo_de_despesa || '');
      if (selectedColumns.fornecedor) row.push(despesa.fornecedor || '');
      if (selectedColumns.produto) row.push(despesa.produto || '');
      if (selectedColumns.unidade) row.push(despesa.unidade || '');
      if (selectedColumns.quantidade) row.push(despesa.quantidade || '');
      if (selectedColumns.valorUnitario) row.push(`R$ ${parseFloat(despesa.valor_unitario || 0).toFixed(2)}`);
      if (selectedColumns.total) row.push(`R$ ${parseFloat(despesa.total || 0).toFixed(2)}`);
      if (selectedColumns.vencimento) row.push(new Date(despesa.validade).toLocaleDateString('pt-BR') || '');
      return row;
    });
  
    pdf.autoTable({
      startY: marginTop + 45,
      head: [tableColumns],
      body: tableRows,
      headStyles: {
        fillColor: [0, 255, 0],
        textColor: 255,
        fontSize: 9,
        halign: 'center',
        fontStyle: 'bold',
        cellPadding: 2,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        cellPadding: 3,
        lineWidth: 0.3,
      },
      theme: 'grid',
      tableWidth: contentWidth,
      margin: { left: marginLeft },
    });
  
    const totalDespesas = filteredDespesas.reduce((total, despesa) => total + (parseFloat(despesa.total) || 0), 0);
  
    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 4,
      body: [['Total de Despesas', '', '', '', `R$ ${totalDespesas.toFixed(2)}`]],
      styles: {
        fontSize: 10,
        halign: 'right',
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        cellPadding: 2,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { halign: 'left' },
      },
      tableWidth: contentWidth,
      margin: { left: marginLeft }
    });
  
    pdf.save('relatorio-de-despesas.pdf');
  };
  
  
  
  

  const handleSelectChange = (despesaId) => {
    setSelectedDespesas((prevSelected) => {
      if (prevSelected.includes(despesaId)) {
        return prevSelected.filter((id) => id !== despesaId);
      } else {
        return [...prevSelected, despesaId];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="expense-popup-overlay">
      <div className="expense-popup-container">
        <div className="expense-popup-header">
          <h5 className="modal-title">Despesas do Imóvel {imovel?.descricao}</h5>
          <button type="button" className="expense-popup-close" onClick={onClose}>
            <span>&times;</span>
          </button>
        </div>
        <div className="expense-popup-body">
        <div className="expense-popup-table-container">
            <table className="expense-popup-table expense-popup-table-striped">
              <thead>
                <tr>
                  <th>Custo Total</th>
                  <th>Custo / Árvores Remanescentes</th>
                  <th>Despesa / Ha</th>
                  <th>Custo por Muda</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{`R$ ${totalCusto.toFixed(2)}`}</td>
                  <td>{`R$ ${custoPorArvore.toFixed(2)}`}</td>
                  <td>{`R$ ${despesaPorHa.toFixed(2)}`}</td>
                  <td>{`R$ ${custoPorMuda.toFixed(2)}`}</td>
                </tr>
              </tbody>
            </table>
            <br></br>
          </div>
          <div className="expense-popup-table-container">
            <table className="expense-popup-table expense-popup-table-striped">
              <thead>
                <tr>
                  <th>Selecionar</th>
                  <th>Tipo de Despesa</th>
                  <th>Fornecedor</th>
                  <th>Produto</th>
                  <th>Unidade</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Total</th>
                  <th>Vencimento</th>
                  <th>Ação</th> {/* Nova coluna */}
                </tr>
              </thead>
              <tbody>
              {Array.isArray(despesas) && despesas.map((despesa) => (
  <tr key={despesa.id}>
    <td>
      <input
        type="checkbox"
        checked={selectedDespesas.includes(despesa.id)}
        onChange={() => handleSelectChange(despesa.id)}
      />
    </td>
    <td>{despesa.tipo_de_despesa}</td>
    <td>{despesa.fornecedor}</td>
    <td>{despesa.produto}</td>
    <td>{despesa.unidade}</td>
    <td>{despesa.quantidade}</td>
    <td>{`R$ ${parseFloat(despesa.valor_unitario || 0).toFixed(2)}`}</td>
    <td>{`R$ ${parseFloat(despesa.total || 0).toFixed(2)}`}</td>
    <td>{new Date(despesa.validade).toLocaleDateString('pt-BR')}</td>
    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteDespesa(despesa.id)}
                      >
                        Excluir
                      </button>
                    </td>
  </tr>
))}

              </tbody>
            </table>
          </div>
          <br></br>
          <div className="expense-popup-form">
            <h5>Intervalo de Datas para relatório</h5>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              placeholder="Data Início"
            />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              placeholder="Data Fim"
            />
          </div>
          <div className="expense-popup-form">
  <h5>Selecionar Colunas para Relatório</h5>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.tipoDeDespesa}
      onChange={() => handleColumnSelectChange('tipoDeDespesa')}
    />
    Tipo de Despesa
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.fornecedor}
      onChange={() => handleColumnSelectChange('fornecedor')}
    />
    Fornecedor
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.produto}
      onChange={() => handleColumnSelectChange('produto')}
    />
    Produto
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.unidade}
      onChange={() => handleColumnSelectChange('unidade')}
    />
    Unidade
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.quantidade}
      onChange={() => handleColumnSelectChange('quantidade')}
    />
    Quantidade
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.valorUnitario}
      onChange={() => handleColumnSelectChange('valorUnitario')}
    />
    Valor Unitário
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.total}
      onChange={() => handleColumnSelectChange('total')}
    />
    Total
  </div>
  <div>
    <input
      type="checkbox"
      checked={selectedColumns.vencimento}
      onChange={() => handleColumnSelectChange('vencimento')}
    />
    Vencimento
  </div>
</div>

        </div>
        <div className="expense-popup-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={gerarOrdemPDF}
            disabled={selectedDespesas.length === 0}
          >
            Gerar Ordem
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={gerarRelatorioPDF}
          >
            Gerar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTablePopup;

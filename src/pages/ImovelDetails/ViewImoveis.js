import React, { useState, useEffect, useRef } from 'react'; 
import { FaSearch, FaFilter, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png';
import './ViewImoveis.css';
import { API_BASE_URL } from "../../config";
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // <-- NOVO
Chart.register(...registerables, ChartDataLabels); // <-- ALTERADO

const ViewImoveis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const chartContainerRef = useRef(null);
  const [imoveis, setImoveis] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('');
  const [filters, setFilters] = useState({
    especie: '',
    proprietario: '',
    area_imovel_min: '',
    area_imovel_max: '',
    data_contrato_start: '',
    data_contrato_end: '',
  });
  const [reportFilters, setReportFilters] = useState({
    tipoImovel: 'todos',
    atributos: {
      descricao: false, area_imovel: false, area_plantio: false, especie: false,
      num_arvores_plantadas: false, num_arvores_cortadas: false, num_arvores_remanescentes: false,
      matricula: false, data_plantio: false, vencimento_contrato: false, data_contrato: false,
      proprietario: false, arrendatario: false, municipio: false, localidade: false,
      altura_desrama: false, numero_car: false, codigo_cc: false,
    },
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState(null);

  const friendlyNames = {
    descricao: 'Descrição', area_imovel: 'Área do Imóvel (ha)',
    area_plantio: 'Área de Plantio (ha)', especie: 'Espécie',
    num_arvores_plantadas: 'Nº de Árvores Plantadas', num_arvores_cortadas: 'Nº de Árvores Cortadas',
    num_arvores_remanescentes: 'Nº de Árvores Remanescentes', matricula: 'Matrícula',
    data_plantio: 'Data de Plantio', vencimento_contrato: 'Vencimento do Contrato',
    data_contrato: 'Data do Contrato', proprietario: 'Proprietário',
    arrendatario: 'Arrendatário', municipio: 'Município',
    localidade: 'Localidade', altura_desrama: 'Altura da Desrama',
    numero_car: 'Número do CAR', codigo_cc: 'Código CC',
  };

  const getFriendlyName = (key) => friendlyNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const fetchImoveis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic my-simple-token'
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setImoveis(data);
      } else {
        console.error('Falha ao buscar imóveis ou resposta inválida:', data);
        setImoveis([]);
      }
    } catch (error) {
      console.error('Erro de conexão ao buscar imóveis:', error);
      setImoveis([]);
    }
  };

  useEffect(() => {
    fetchImoveis();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortCriteria]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const confirmDelete = (id) => {
    setItemToDeleteId(id);
    setShowDeleteConfirmation(true);
  };

  const handleDelete = async () => {
    if (itemToDeleteId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/imoveis/${itemToDeleteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic my-simple-token'
          }
        });
        if (response.ok) {
          setImoveis(imoveis.filter((imovel) => imovel.id !== itemToDeleteId));
        } else {
          const errorData = await response.json();
          console.error('Falha ao excluir o imóvel no backend:', errorData.error);
        }
      } catch (error) {
        console.error('Erro de conexão ao excluir imóvel:', error);
      } finally {
        setShowDeleteConfirmation(false);
        setItemToDeleteId(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setItemToDeleteId(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportAtributosChange = (e) => {
    const { name, checked } = e.target;
    setReportFilters((prev) => ({
      ...prev,
      atributos: { ...prev.atributos, [name]: checked },
    }));
  };

  // INDICAÇÃO: Adicione esta função dentro do seu componente ViewImoveis
const truncateText = (text, maxLength) => {
    // Converte o valor para string para garantir o funcionamento
    const textAsString = String(text ?? ''); 
    if (textAsString.length <= maxLength) {
        return textAsString;
    }
    // Subtrai 3 para dar espaço às reticências
    return textAsString.substring(0, maxLength - 3) + '...';
};

  const filteredImoveis = imoveis
    .filter((imovel) => {
      const matchesSearchTerm = imovel.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEspecie = imovel.especie?.toLowerCase().includes(filters.especie.toLowerCase());
      const matchesProprietario = imovel.proprietario?.toLowerCase().includes(filters.proprietario.toLowerCase());

      const areaMinText = String(filters.area_imovel_min || '').replace(',', '.');
      const areaMaxText = String(filters.area_imovel_max || '').replace(',', '.');

      const matchesAreaImovel =
        (areaMinText ? imovel.area_imovel >= parseFloat(areaMinText) : true) &&
        (areaMaxText ? imovel.area_imovel <= parseFloat(areaMaxText) : true);

      const matchesDataContrato =
        (filters.data_contrato_start ? new Date(imovel.data_contrato) >= new Date(filters.data_contrato_start) : true) &&
        (filters.data_contrato_end ? new Date(imovel.data_contrato) <= new Date(filters.data_contrato_end) : true);

      const matchesTipoImovel = showReportModal ?
          (reportFilters.tipoImovel === 'todos' ||
          (reportFilters.tipoImovel === 'proprio' && !imovel.arrendatario) ||
          (reportFilters.tipoImovel === 'arrendado' && imovel.arrendatario))
        : true;

      return matchesSearchTerm && matchesEspecie && matchesProprietario && matchesAreaImovel && matchesDataContrato && matchesTipoImovel;
    })
    .sort((a, b) => {
        if (!sortCriteria) return 0;
        const valA = a[sortCriteria] || '';
        const valB = b[sortCriteria] || '';

        switch (sortCriteria) {
            case 'descricao':
            case 'proprietario':
                return valA.localeCompare(valB);
            case 'area_plantio':
                return (b.area_plantio || 0) - (a.area_plantio || 0);
            case 'data_plantio_desc':
                return new Date(b.data_plantio) - new Date(a.data_plantio);
            case 'codigo_cc':
                return String(valA).localeCompare(String(valB), undefined, { numeric: true });
            default:
                return 0;
        }
    });

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredImoveis.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredImoveis.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const formatarData = (data) => {
    if (!data) return "N/A";
    const date = new Date(data);
    if (isNaN(date.getTime())) return "N/A";
    const dia = String(date.getUTCDate()).padStart(2, '0');
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const ano = date.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarNumero = (num) => {
    if (num === null || num === undefined || String(num).trim() === '') return "N/A";
    const numero = Number(String(num).replace(',', '.'));
    if (isNaN(numero)) return "N/A";
    return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const gerarRelatorio = async () => {
    const colunasSelecionadas = Object.keys(reportFilters.atributos)
        .filter(key => reportFilters.atributos[key])
        .map(key => ({ key, name: getFriendlyName(key) }));

    if (colunasSelecionadas.length === 0) {
        alert("Por favor, selecione pelo menos um atributo para o relatório.");
        return;
    }

    setShowReportModal(false);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const THEME_COLOR = [56, 189, 114];
    const LIGHT_GRAY = [220, 220, 220];
    const TEXT_COLOR_DARK = '#333333';

    const pageHeader = (data) => {
        if (data.pageNumber === 1) {
            try {
                if (logo) doc.addImage(logo, 'PNG', 15, 12, 25, 8);
            } catch (e) { console.error("Erro ao adicionar logo:", e); }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(...THEME_COLOR);
            doc.text('Relatório de Imóveis', 15, 30);
            doc.setDrawColor(...THEME_COLOR);
            doc.setLineWidth(0.3);
            doc.line(15, 33, pageWidth - 15, 33);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(128);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 15, 30, { align: 'right' });
        }
    };

    const pageFooter = (data) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    const head = [colunasSelecionadas.map(col => col.name)];
    // INDICAÇÃO: Dentro da função gerarRelatorio, substitua a criação do 'body' por este trecho

const body = filteredImoveis.map(imovel => (
    colunasSelecionadas.map(col => {
        const valor = imovel[col.key];

        // --- LÓGICA DE TRUNCAMENTO APLICADA AQUI ---
        const camposTextoLongo = ['descricao', 'proprietario', 'arrendatario', 'localidade'];
        if (camposTextoLongo.includes(col.key)) {
            // Limita campos de texto a 25 caracteres para manter a naturalidade
            return truncateText(valor, 25);
        }

        const camposNumerosLongos = ['matricula', 'numero_car'];
        if (camposNumerosLongos.includes(col.key)) {
            // Limita campos de código/número a 15 caracteres
            return truncateText(valor, 15);
        }
        // --- FIM DA LÓGICA DE TRUNCAMENTO ---
        
        // Mantém a formatação original para os outros campos
        if (['data_plantio', 'vencimento_contrato', 'data_contrato'].includes(col.key)) return formatarData(valor);
        if (['area_imovel', 'area_plantio', 'altura_desrama'].includes(col.key)) return formatarNumero(valor);
        if (['num_arvores_plantadas', 'num_arvores_cortadas', 'num_arvores_remanescentes'].includes(col.key)) {
            const numero = Number(String(valor).replace(',', '.'));
            return isNaN(numero) ? "N/A" : numero.toLocaleString('pt-BR');
        }
        
        // Para os demais campos, apenas limita o tamanho geral para segurança
        return truncateText(valor, 30);
    })
));
    let tableFontSize = 8.5;
    if (colunasSelecionadas.length > 20) tableFontSize = 5;
    else if (colunasSelecionadas.length > 16) tableFontSize = 6;
    else if (colunasSelecionadas.length > 12) tableFontSize = 7;
    else if (colunasSelecionadas.length > 8) tableFontSize = 8;
    doc.autoTable({
        head, body, startY: 40, showHead: 'firstPage',
        didDrawPage: (data) => { pageHeader(data); pageFooter(data); },
        margin: { top: 38, bottom: 20 }, theme: 'grid',
        styles: { fontSize: tableFontSize, cellPadding: 2.5, valign: 'middle', lineColor: LIGHT_GRAY, lineWidth: 0.1, textColor: TEXT_COLOR_DARK },
        headStyles: { fillColor: THEME_COLOR, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: tableFontSize + 0.5, lineColor: THEME_COLOR },
    });
    const colunasNumericas = ['area_imovel', 'area_plantio', 'num_arvores_plantadas', 'num_arvores_cortadas', 'num_arvores_remanescentes'];
    const totalData = [], totalHeaders = [];
    colunasSelecionadas.forEach(col => {
        if (colunasNumericas.includes(col.key)) {
            const total = filteredImoveis.reduce((sum, imovel) => sum + (parseFloat(String(imovel[col.key]).replace(/\./g, '').replace(',', '.')) || 0), 0);
            totalHeaders.push(getFriendlyName(col.key));
            totalData.push(total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    });
    if (totalData.length > 0) {
        doc.autoTable({
            head: [['TOTAIS', ...totalHeaders]], body: [['', ...totalData]],
            startY: doc.autoTable.previous.finalY + 5, theme: 'plain',
            headStyles: { fontStyle: 'bold', fillColor: THEME_COLOR, textColor: 255, halign: 'center' },
            bodyStyles: { fontStyle: 'bold', halign: 'center' },
            didParseCell: (data) => {
                if(data.section === 'head' && data.cell.raw === 'TOTAIS') data.cell.styles.halign = 'right';
                if(data.section === 'body') data.cell.styles.fillColor = [245, 245, 245];
            }
        });
    }

    doc.addPage();
    const chartPageNumber = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...THEME_COLOR);
    doc.text('Dashboard de Análise', pageWidth / 2, 20, { align: 'center' });
    pageFooter({ pageNumber: chartPageNumber });

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
            chartConfig.plugins = [...(chartConfig.plugins || []), backgroundColorPlugin];
            const chart = new Chart(canvas.getContext('2d'), chartConfig);
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgData = chart.toBase64Image('image/png', 1.0);
            doc.addImage(imgData, 'PNG', x, y, width, height, undefined, 'FAST');
            chart.destroy();
        } catch (e) {
            console.error(`Erro ao gerar o gráfico ${chartId}:`, e);
        } finally {
            container.removeChild(canvas);
        }
    };
    
    const commonY = 35;
    const commonHeight = pageHeight - commonY - 25;

    const pieChartSize = commonHeight;
    const pieChartX = 20;

    const barChartX = pieChartX + pieChartSize + 10;
    const barChartWidth = pageWidth - barChartX - 20;
    const barChartHeight = commonHeight;

    const chartColors = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6', '#34495e', '#1abc9c'];

    const baseChartOptions = {
        animation: false,
        layout: { padding: { top: 20, right: 20, bottom: 5, left: 10 } },
        plugins: {
            legend: { display: true, position: 'top', labels: { color: TEXT_COLOR_DARK, font: { size: 12 } } },
            datalabels: { color: '#ffffff', font: { weight: 'bold', size: 11 }, textShadowBlur: 2, textShadowColor: 'rgba(0, 0, 0, 0.5)' }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#EAEAEA' }, title: { display: true, color: TEXT_COLOR_DARK, font: { size: 14, weight: 'bold' } }, ticks: { color: TEXT_COLOR_DARK, font: { size: 11 } } },
            x: { grid: { display: false }, title: { display: true, color: TEXT_COLOR_DARK, font: { size: 14, weight: 'bold' } }, ticks: { color: TEXT_COLOR_DARK, font: { size: 11 } } }
        }
    };

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);

    const areaPorEspecie = filteredImoveis.reduce((acc, imovel) => {
        const especie = imovel.especie || 'N/A';
        const area = parseFloat(String(imovel.area_plantio).replace(/\./g, '').replace(',', '.')) || 0;
        acc[especie] = (acc[especie] || 0) + area;
        return acc;
    }, {});

    doc.text('Área de Plantio por Espécie', pieChartX + pieChartSize / 2, commonY - 8, { align: 'center' });
    const areaChartConfig = {
        type: 'pie',
        data: {
            labels: Object.keys(areaPorEspecie),
            datasets: [{
                data: Object.values(areaPorEspecie),
                backgroundColor: chartColors,
                borderColor: '#FFFFFF',
                borderWidth: 2,
            }]
        },
        options: {
            ...baseChartOptions,
            maintainAspectRatio: true,
            scales: {},
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15 } },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed.toLocaleString('pt-BR')} ha` } },
                datalabels: {
                    formatter: (value, ctx) => {
                        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = (value * 100 / sum).toFixed(1) + '%';
                        return (sum > 0 && (value*100/sum) > 5) ? percentage : '';
                    },
                    color: '#fff',
                }
            }
        }
    };
    await addChartToPdf('areaChartCanvas', areaChartConfig, pieChartX, commonY, pieChartSize, pieChartSize);
    
    const imoveisPorMunicipio = filteredImoveis.reduce((acc, imovel) => {
        const municipio = imovel.municipio || 'N/A';
        acc[municipio] = (acc[municipio] || 0) + 1;
        return acc;
    }, {});
    
    doc.text('Imóveis por Município', barChartX + barChartWidth / 2, commonY - 8, { align: 'center' });
    const municipioChartConfig = {
        type: 'bar',
        data: {
            labels: Object.keys(imoveisPorMunicipio),
            datasets: [{
                label: 'Nº de Imóveis',
                data: Object.values(imoveisPorMunicipio),
                // ALTERADO: Removida a função de degradê e substituída por cores sólidas para maior confiabilidade.
                backgroundColor: chartColors, 
            }]
        },
        options: {
            ...baseChartOptions,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    color: '#444',
                    textShadowBlur: 0,
                    textShadowColor: 'transparent',
                    font: { weight: 'normal' },
                    formatter: (value) => value.toLocaleString('pt-BR'),
                }
            },
            scales: {
                x: { ...baseChartOptions.scales.x, grid: { display: true, color: '#EAEAEA' }, title: { ...baseChartOptions.scales.x.title, text: 'Nº de Imóveis' } },
                y: { ...baseChartOptions.scales.y, grid: { display: false }, title: { ...baseChartOptions.scales.y.title, text: '' } }
            }
        }
    };
    await addChartToPdf('municipioChartCanvas', municipioChartConfig, barChartX, commonY, barChartWidth, barChartHeight);

    doc.save(`relatorio_imoveis_${new Date().toISOString().slice(0,10)}.pdf`);
};
  const selecionarTodosAtributos = (selecionar) => {
    const todosAtributos = Object.keys(reportFilters.atributos).reduce((acc, key) => {
      acc[key] = selecionar;
      return acc;
    }, {});
    setReportFilters((prev) => ({ ...prev, atributos: todosAtributos }));
  };

  return (
    <div className="view-imoveis-container">
      <div ref={chartContainerRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>
      {showDeleteConfirmation && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <FaExclamationTriangle className="warning-icon" />
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este imóvel?</p>
            <p>Esta ação não pode ser desfeita.</p>
            
            <div className="modal-footer-stacked">
              <button className="btn btn-danger" onClick={handleDelete}>
                <FaTrashAlt /> Confirmar Exclusão
              </button>
              <button className="btn-link" onClick={cancelDelete}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-content filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Filtrar Imóveis</h3>
              <button className="modal-close-btn" onClick={() => setShowFilterModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="filter-form-grid">
                <div className="form-group full-width">
                  <label htmlFor="especie">Espécie:</label>
                  <input type="text" id="especie" name="especie" value={filters.especie} onChange={handleFilterChange} />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="proprietario">Proprietário:</label>
                  <input type="text" id="proprietario" name="proprietario" value={filters.proprietario} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="area_imovel_min">Área mínima (ha):</label>
                  <input type="number" step="any" id="area_imovel_min" name="area_imovel_min" value={filters.area_imovel_min} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="area_imovel_max">Área máxima (ha):</label>
                  <input type="number" step="any" id="area_imovel_max" name="area_imovel_max" value={filters.area_imovel_max} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="data_contrato_start">Data contrato (início):</label>
                  <input type="date" id="data_contrato_start" name="data_contrato_start" value={filters.data_contrato_start} onChange={handleFilterChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="data_contrato_end">Data contrato (fim):</label>
                  <input type="date" id="data_contrato_end" name="data_contrato_end" value={filters.data_contrato_end} onChange={handleFilterChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>Aplicar Filtros</button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content modal-lg report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gerar Relatório de Imóveis</h3>
              <button className="modal-close-btn" onClick={() => setShowReportModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="tipoImovel">Filtrar por Tipo de Imóvel:</label>
                <select id="tipoImovel" name="tipoImovel" value={reportFilters.tipoImovel} onChange={handleReportFilterChange}>
                  <option value="todos">Todos</option>
                  <option value="proprio">Próprio</option>
                  <option value="arrendado">Arrendado</option>
                </select>
              </div>
              <hr />
              <h6>Selecione os Atributos para o Relatório:</h6>
              
              {/* --- BOTÕES "SELECIONAR/LIMPAR" ATUALIZADOS --- */}
              <div className="report-attributes-actions">
                  <button type="button" className="btn btn-outline" onClick={() => selecionarTodosAtributos(true)}>Selecionar Todos</button>
                  <button type="button" className="btn btn-outline" onClick={() => selecionarTodosAtributos(false)}>Limpar Seleção</button>
              </div>
              
              <div className="report-attributes-grid">
                {Object.keys(reportFilters.atributos).map((key) => (
                  <div className="form-check" key={key}>
                    <input type="checkbox" id={`attr-${key}`} name={key} checked={reportFilters.atributos[key]} onChange={handleReportAtributosChange} />
                    <label htmlFor={`attr-${key}`}>{getFriendlyName(key)}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={gerarRelatorio}><FaFilePdf /> Gerar PDF</button>
            </div>
          </div>
        </div>
      )}

      <header className="page-header"></header>

      <div className="controls-bar">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Pesquisar por descrição..." value={searchTerm} onChange={handleSearchChange} />
        </div>
        <div className="actions">
          <select className="sort-select" value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)}>
              <option value="">Ordenar por...</option>
              <option value="codigo_cc">Código CC</option>
              <option value="descricao">Descrição (A-Z)</option>
              <option value="area_plantio">Área de Plantio (maior)</option>
              <option value="proprietario">Proprietário (A-Z)</option>
              <option value="data_plantio_desc">Data de Plantio (recente)</option>
          </select>
          <button className="btn btn-secondary" onClick={() => setShowFilterModal(true)}>
            <FaFilter /> Filtrar
          </button>
          <button className="btn btn-secondary" onClick={() => setShowReportModal(true)}>
            <FaFilePdf /> Relatório
          </button>
        </div>
      </div>

      <div className="imoveis-list">
        {currentItems.length > 0 ? (
          <table className="imoveis-table">
            <thead>
              <tr>
                <th>Código CC</th>
                <th>Descrição</th>
                <th>Data de Plantio</th>
                <th>Área de Plantio (ha)</th>
                <th>Espécie</th>
                <th>Proprietário</th>
                <th className="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((imovel) => (
                <tr key={imovel.id}>
                  <td data-label="Código CC"><Link to={`/imovel/${imovel.id}`}>{imovel.codigo_cc || 'N/A'}</Link></td>
                  <td data-label="Descrição"><Link to={`/imovel/${imovel.id}`}>{imovel.descricao}</Link></td>
                  <td data-label="Data Plantio"><Link to={`/imovel/${imovel.id}`}>{formatarData(imovel.data_plantio)}</Link></td>
                  <td data-label="Área Plantio"><Link to={`/imovel/${imovel.id}`}>{formatarNumero(imovel.area_plantio)}</Link></td>
                  <td data-label="Espécie"><Link to={`/imovel/${imovel.id}`}>{imovel.especie}</Link></td>
                  <td data-label="Proprietário"><Link to={`/imovel/${imovel.id}`}>{imovel.proprietario}</Link></td>
                  <td className="actions-cell">
                    <button className="btn btn-danger" onClick={() => confirmDelete(imovel.id)}>
                      <FaTrashAlt /> <span className="delete-text">Excluir</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">
            <p>Nenhum imóvel encontrado.</p>
            <span>Tente ajustar seus filtros ou termo de pesquisa.</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="pagination-arrow">
                <FaChevronLeft />
            </button>
            <span className="pagination-info">
                Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-arrow">
                <FaChevronRight />
            </button>
        </div>
      )}
    </div>
  );
};

export default ViewImoveis;
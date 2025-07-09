import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaFilePdf, FaChevronLeft, FaChevronRight, FaTimes, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../../img/logo.png';
import './ViewImoveis.css';
import { API_BASE_URL } from "../../config";

const ViewImoveis = () => {
  const [searchTerm, setSearchTerm] = useState('');
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
      const response = await fetch(`${API_BASE_URL}/api/imoveis`);
      const data = await response.json();
      setImoveis(data);
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
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
        await fetch(`${API_BASE_URL}/api/imoveis/${itemToDeleteId}`, { method: 'DELETE' });
        setImoveis(imoveis.filter((imovel) => imovel.id !== itemToDeleteId));
      } catch (error) {
        console.error('Erro ao excluir imóvel:', error);
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

  const gerarRelatorio = () => {
    const colunasSelecionadas = Object.keys(reportFilters.atributos)
        .filter(key => reportFilters.atributos[key])
        .map(key => ({ key, name: getFriendlyName(key) }));

    if (colunasSelecionadas.length === 0) {
        alert("Por favor, selecione pelo menos um atributo para o relatório.");
        return;
    }

    const head = [colunasSelecionadas.map(col => col.name)];

    const body = filteredImoveis.map(imovel => {
        return colunasSelecionadas.map(col => {
            const valor = imovel[col.key];
            if (col.key.includes('data_') || col.key.includes('_contrato')) {
                return formatarData(valor);
            }
            if (col.key.includes('area_') || col.key.includes('altura_')) {
                return formatarNumero(valor);
            }
            return valor ?? "N/A";
        });
    });

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.addImage(logo, 'PNG', 14, 10, 40, 16);
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Relatório de Imóveis', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.autoTable({
        head: head,
        body: body,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    setShowReportModal(false);
    doc.save('relatorio_imoveis.pdf');
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
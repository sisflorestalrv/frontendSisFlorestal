  import React, { useState, useEffect } from 'react';
  import { FaSearch, FaFilter, FaFilePdf } from 'react-icons/fa';
  import { Link } from 'react-router-dom';
  import jsPDF from 'jspdf';
  import logo from '../../img/logo.png'; // Importe a logo do seu diretório

  const ViewImoveis = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [imoveis, setImoveis] = useState([]);
    const [showFilters, setShowFilters] = useState(false); // Controla a visibilidade dos filtros
    const [showReportFilters, setShowReportFilters] = useState(false); // Controla a visibilidade do filtro de relatório
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
      tipoImovel: 'todos', // Pode ser 'próprio' ou 'arrendado'
      atributos: {
        descricao: true,
        area_imovel: true,
        area_plantio: true,
        especie: true,
        num_arvores_plantadas: false,
        num_arvores_cortadas: false,
        num_arvores_remanescentes: false,
        matricula: false,
        data_plantio: false,
        vencimento_contrato: false,
        arrendatario: false,
        municipio: false,
        localidade: false,
        altura_desrama: false,
        numero_car: false,
        codigo_cc: false,
      },
    });

    const friendlyNames = {
      descricao: 'Descrição',
      area_imovel: 'Área do Imóvel (m²)',
      area_plantio: 'Área de Plantio (m²)',
      especie: 'Espécie',
      num_arvores_plantadas: 'Número de Árvores Plantadas',
      num_arvores_cortadas: 'Número de Árvores Cortadas',
      num_arvores_remanescentes: 'Número de Árvores Remanescentes',
      matricula: 'Matrícula',
      data_plantio: 'Data de Plantio',
      vencimento_contrato: 'Vencimento do Contrato',
      arrendatario: 'Arrendatário',
      municipio: 'Município',
      localidade: 'Localidade',
      altura_desrama: 'Altura da Desrama',
      numero_car: 'Número do CAR',
      codigo_cc: 'Código CC',
    };
    
    const getFriendlyName = (key) => friendlyNames[key] || key.replace('_', ' ').toUpperCase();
    
    

    const fetchImoveis = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/imoveis');
        const data = await response.json();
        setImoveis(data);
      } catch (error) {
        console.error('Erro ao buscar imóveis:', error);
      }
    };

    useEffect(() => {
      fetchImoveis();
    }, []);

    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
    };

    const handleDelete = async (id) => {
      try {
        await fetch(`http://localhost:5000/api/imoveis/${id}`, {
          method: 'DELETE',
        });
        setImoveis(imoveis.filter((imovel) => imovel.id !== id));
      } catch (error) {
        console.error('Erro ao excluir imóvel:', error);
      }
    };

    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters((prevFilters) => ({
        ...prevFilters,
        [name]: value
      }));
    };

    const handleReportFilterChange = (e) => {
      const { name, value } = e.target;
      setReportFilters((prevReportFilters) => ({
        ...prevReportFilters,
        [name]: value
      }));
    };

    const handleReportAtributosChange = (e) => {
      const { name, checked } = e.target;
      setReportFilters((prevReportFilters) => ({
        ...prevReportFilters,
        atributos: {
          ...prevReportFilters.atributos,
          [name]: checked
        }
      }));
    };

    const filteredImoveis = imoveis
  .filter((imovel) => {
    const matchesSearchTerm = imovel.descricao && imovel.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEspecie = imovel.especie && imovel.especie.toLowerCase().includes(filters.especie.toLowerCase());
    const matchesProprietario = imovel.proprietario && imovel.proprietario.toLowerCase().includes(filters.proprietario.toLowerCase());
    const matchesAreaImovel =
      (filters.area_imovel_min ? imovel.area_imovel >= parseFloat(filters.area_imovel_min) : true) &&
      (filters.area_imovel_max ? imovel.area_imovel <= parseFloat(filters.area_imovel_max) : true);
    const matchesDataContrato =
      (filters.data_contrato_start ? new Date(imovel.data_contrato) >= new Date(filters.data_contrato_start) : true) &&
      (filters.data_contrato_end ? new Date(imovel.data_contrato) <= new Date(filters.data_contrato_end) : true);
    const matchesTipoImovel = reportFilters.tipoImovel === 'todos' ||
      (reportFilters.tipoImovel === 'proprio' && !imovel.arrendatario) ||
      (reportFilters.tipoImovel === 'arrendado' && imovel.arrendatario);

    return (
      matchesSearchTerm &&
      matchesEspecie &&
      matchesProprietario &&
      matchesAreaImovel &&
      matchesDataContrato &&
      matchesTipoImovel
    );
  })
  .sort((a, b) => {
    if (sortCriteria === 'descricao') {
      // Ordenar por descrição
      return a.descricao.localeCompare(b.descricao);
    } else if (sortCriteria === 'area_plantio') {
      // Ordenar por área de plantio (maior para menor)
      return b.area_plantio - a.area_plantio;
    } else if (sortCriteria === 'proprietario') {
      // Ordenar por proprietário
      return a.proprietario.localeCompare(b.proprietario);
    }
    return 0; // Sem ordenação
  });

    

  
  const gerarRelatorio = () => {
    const relatorioImoveis = filteredImoveis.map((imovel) => {
      const selectedAttributes = {};
      for (const [key, value] of Object.entries(reportFilters.atributos)) {
        if (value) {
          switch (key) {
            case 'descricao':
              selectedAttributes['Descrição'] = imovel.descricao;
              break;
            case 'area_imovel':
              selectedAttributes['Área do Imóvel (m²)'] = imovel.area_imovel;
              break;
            case 'area_plantio':
              selectedAttributes['Área de Plantio (m²)'] = imovel.area_plantio;
              break;
            case 'especie':
              selectedAttributes['Espécie'] = imovel.especie;
              break;
            case 'num_arvores_plantadas':
              selectedAttributes['Número de Árvores Plantadas'] = imovel.num_arvores_plantadas;
              break;
            case 'num_arvores_cortadas':
              selectedAttributes['Número de Árvores Cortadas'] = imovel.num_arvores_cortadas;
              break;
            case 'num_arvores_remanescentes':
              selectedAttributes['Número de Árvores Remanescentes'] = imovel.num_arvores_remanescentes;
              break;
            case 'matricula':
              selectedAttributes['Matrícula'] = imovel.matricula;
              break;
            case 'data_plantio':
              selectedAttributes['Data de Plantio'] = imovel.data_plantio;
              break;
            case 'proprietario':
              selectedAttributes['Proprietário'] = imovel.proprietario;
              break;
            case 'arrendatario':
              selectedAttributes['Arrendatário'] = imovel.arrendatario;
              break;
            case 'vencimento_contrato':
              selectedAttributes['Vencimento do Contrato'] = imovel.vencimento_contrato;
              break;
            case 'municipio':
              selectedAttributes['Município'] = imovel.municipio;
              break;
            case 'localidade':
              selectedAttributes['Localidade'] = imovel.localidade;
              break;
            case 'numero_car':
              selectedAttributes['Número do CAR'] = imovel.numero_car;
              break;
            case 'codigo_cc':
              selectedAttributes['Código CC'] = imovel.codigo_cc;
              break;
            case 'altura_desrama':
              selectedAttributes['Altura da Desrama'] = imovel.altura_desrama;
              break;
            default:
              selectedAttributes[key.replace('_', ' ')] = imovel[key];
              break;
          }
        }
      }
      return selectedAttributes;
    });
  
    // Modo paisagem
    const doc = new jsPDF('landscape'); // Modo paisagem
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12); // Reduzir o tamanho da fonte para comprimido
    
    // Adicionar logo no topo
    doc.addImage(logo, 'PNG', 10, 10, 50, 20); // Ajuste o tamanho e posição conforme necessário
  
    // Título centralizado
    doc.setTextColor(0, 0, 0); // Texto preto
    doc.text('Relatório de Imóveis', doc.internal.pageSize.width / 2, 30, { align: 'center' });
  
    let y = 40; // Posiciona a tabela abaixo do título
  
    const colunas = Object.keys(reportFilters.atributos).filter(attr => reportFilters.atributos[attr])
      .map(attr => {
        switch (attr) {
          case 'descricao':
            return 'Descrição'; // Aqui você ajusta para 'Descrição'
          case 'area_imovel':
            return 'Área do Imóvel (m²)';
          case 'area_plantio':
            return 'Área de Plantio (m²)';
          case 'especie':
            return 'Espécie';
          case 'num_arvores_plantadas':
            return 'Número de Árvores Plantadas';
          case 'num_arvores_cortadas':
            return 'Número de Árvores Cortadas';
          case 'num_arvores_remanescentes':
            return 'Número de Árvores Remanescentes';
          case 'matricula':
            return 'Matrícula';
          case 'data_plantio':
            return 'Data de Plantio';
          case 'proprietario':
            return 'Proprietário';
          case 'arrendatario':
            return 'Arrendatário';
          case 'vencimento_contrato':
            return 'Vencimento do Contrato';
          case 'municipio':
            return 'Município';
          case 'localidade':
            return 'Localidade';
          case 'numero_car':
            return 'Número do CAR';
          case 'codigo_cc':
            return 'Código CC';
          case 'altura_desrama':
            return 'Altura da Desrama';
          default:
            return attr.replace('_', ' ').toUpperCase(); // Remover caixa alta
        }
      });
  
    const dados = relatorioImoveis.map((imovel) => {
      return colunas.map((col) => imovel[col] || "Não disponível");
    });
  
    // Gerar a tabela com apenas cabeçalho e corpo da tabela com fundo branco e texto preto
    doc.autoTable({
      startY: y,
      head: [colunas],
      body: dados,
      theme: 'grid', // Sem estilização extra
      styles: {
        fontSize: 6, // Tamanho da fonte reduzido
        cellPadding: 1, // Padding reduzido
        fillColor: [255, 255, 255], // Células com fundo branco
        textColor: [0, 0, 0], // Texto preto
      },
    });
  
    // Salvar o PDF
    doc.save('relatorio_imoveis.pdf');
  };
  
  
  
  

    return (
      <div className="container mt-4">
        <h1 className="text-center">Visualização de Imóveis</h1>

        {/* Barra de pesquisa */}
        <div className="search-bar mt-4 d-flex justify-content-between align-items-center">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Pesquisar imóvel..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <span className="input-group-text">
              <FaSearch />
            </span>
          </div>
          <button className="btn btn-success ms-2" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> Filtrar
          </button>
          <button className="btn btn-primary ms-2" onClick={() => setShowReportFilters(!showReportFilters)}>
            <FaFilePdf /> Gerar Relatório
          </button>
        </div>
        <div className="mb-2">
  <label htmlFor="sortCriteria" className="form-label">Ordenar por:</label>
  <select
    id="sortCriteria"
    name="sortCriteria"
    className="form-control"
    value={sortCriteria}
    onChange={(e) => setSortCriteria(e.target.value)}
  >
    <option value="">Selecione...</option>
    <option value="descricao">Descrição (A-Z)</option>
    <option value="area_plantio">Área de Plantio (maior primeiro)</option>
    <option value="proprietario">Proprietário (A-Z)</option>
  </select>
</div>


        {/* Caixa de filtros de pesquisa */}
        {showFilters && (
          <div className="mt-3 p-3 border rounded">
            <h5>Filtros de Pesquisa</h5>
            <form>
              <div className="mb-2">
                <label htmlFor="especie" className="form-label">Espécie:</label>
                <input
                  type="text"
                  id="especie"
                  name="especie"
                  className="form-control"
                  value={filters.especie}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="proprietario" className="form-label">Proprietário:</label>
                <input
                  type="text"
                  id="proprietario"
                  name="proprietario"
                  className="form-control"
                  value={filters.proprietario}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="area_imovel_min" className="form-label">Área mínima (m²):</label>
                <input
                  type="number"
                  id="area_imovel_min"
                  name="area_imovel_min"
                  className="form-control"
                  value={filters.area_imovel_min}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="area_imovel_max" className="form-label">Área máxima (m²):</label>
                <input
                  type="number"
                  id="area_imovel_max"
                  name="area_imovel_max"
                  className="form-control"
                  value={filters.area_imovel_max}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="data_contrato_start" className="form-label">Data contrato (início):</label>
                <input
                  type="date"
                  id="data_contrato_start"
                  name="data_contrato_start"
                  className="form-control"
                  value={filters.data_contrato_start}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="data_contrato_end" className="form-label">Data contrato (fim):</label>
                <input
                  type="date"
                  id="data_contrato_end"
                  name="data_contrato_end"
                  className="form-control"
                  value={filters.data_contrato_end}
                  onChange={handleFilterChange}
                />
              </div>
            </form>
          </div>
        )}

        {/* Caixa de filtros para gerar relatório */}
        {showReportFilters && (
          <div className="mt-3 p-3 border rounded">
            <h5>Filtros do Relatório</h5>
            <form>
              <div className="mb-2">
                <label htmlFor="tipoImovel" className="form-label">Tipo de Imóvel:</label>
                <select
                  id="tipoImovel"
                  name="tipoImovel"
                  className="form-control"
                  value={reportFilters.tipoImovel}
                  onChange={handleReportFilterChange}
                >
                  <option value="todos">Todos</option>
                  <option value="proprio">Próprio</option>
                  <option value="arrendado">Arrendado</option>
                </select>
              </div>

              {/* Atributos a incluir no relatório */}
              <h6>Atributos para o Relatório:</h6>
              {Object.keys(reportFilters.atributos).map((key) => (
                <div className="form-check" key={key}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name={key}
                    checked={reportFilters.atributos[key]}
                    onChange={handleReportAtributosChange}
                  />
                  <label className="form-check-label">{getFriendlyName(key)}</label>


                </div>
              ))}

              <button type="button" className="btn btn-primary mt-3" onClick={gerarRelatorio}>
                Gerar Relatório
              </button>
            </form>
          </div>
        )}

{/* Lista de imóveis filtrados */}
<div className="imoveis-list mt-4">
  {filteredImoveis.length > 0 ? (
    <table className="table table-striped">
      <thead>
  <tr className="table-header">
    <th>Descrição</th>
    <th>Área de Plantio (m²)</th>
    <th>Espécie</th>
    <th>Proprietário</th>
  </tr>
</thead>

      <tbody>
        {filteredImoveis.map((imovel) => (
          <tr key={imovel.id}>
            <td>
              <Link
                to={`/imovel/${imovel.id}`}
                className="text-decoration-none text-dark"
                style={{ color: "inherit" }}
              >
                {imovel.descricao}
              </Link>
            </td>
            <td>
              <Link
                to={`/imovel/${imovel.id}`}
                className="text-decoration-none text-dark"
                style={{ color: "inherit" }}
              >
                {imovel.area_plantio}
              </Link>
            </td>
            <td>
              <Link
                to={`/imovel/${imovel.id}`}
                className="text-decoration-none text-dark"
                style={{ color: "inherit" }}
              >
                {imovel.especie}
              </Link>
            </td>
            <td>
              <Link
                to={`/imovel/${imovel.id}`}
                className="text-decoration-none text-dark"
                style={{ color: "inherit" }}
              >
                {imovel.proprietario}
              </Link>
            </td>
            <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(imovel.id)}
                    >
                      Excluir
                    </button>
                  </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className="text-center">Nenhum imóvel encontrado.</p>
  )}
</div>


      </div>
    );
  };

  export default ViewImoveis;

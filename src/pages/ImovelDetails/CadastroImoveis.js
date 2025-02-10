import React, { useState } from 'react';
import PopupAlert from '../PopupAlert';

const CadastroImoveis = () => {
  const [formData, setFormData] = useState({
    descricao: '',
    codigo_cc: '',
    area_imovel: '',
    area_plantio: '',
    especie: '',
    origem: '',
    num_arvores_plantadas: '',
    num_arvores_cortadas: '',
    matricula: '',
    data_plantio: '',
    data_contrato: '',
    vencimento_contrato: '',
    numero_ccir: '',
    numero_itr: '',
    proprietario: '',
    arrendatario: '',
    municipio: '',
    localidade: '',
    numero_car: '',
  });

  const [isArrendado, setIsArrendado] = useState(false);
  const [codigoCCExists, setCodigoCCExists] = useState(false);
  const [popup, setPopup] = useState({ message: '', type: '' }); // Estado do popup

  const handleChange = async (e) => {
  const { id, value } = e.target;
  setFormData({ ...formData, [id]: value });

  if (id === "codigo_cc") {
    const exists = await checkCodigoCCExists(value);
    setCodigoCCExists(exists);
  }
};


  const checkCodigoCCExists = async (codigo_cc) => {
    try {
      const response = await fetch(`http://localhost:5000/api/verificarCodigoCC?codigo_cc=${codigo_cc}`);
      const data = await response.json();
      return data.exists;  // Supondo que o backend retorne um objeto { exists: true/false }
    } catch (error) {
      console.error("Erro ao verificar o código CC:", error);
      return false; // Caso ocorra algum erro na consulta
    }
  };

  const isValidNumber = (num) => {
    // Aceitar apenas números no formato "100000.00" ou "100000"
    const regex = /^\d+(\.\d{1,2})?$/;
    return regex.test(num);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar se o código CC já existe
    const exists = await checkCodigoCCExists(formData.codigo_cc);
    if (exists) {
      setPopup({ message: "O código CC já existe!", type: 'error' });
      return;
    }

    // Validar valores negativos ou zero
    if (
      formData.area_imovel <= 0 ||
      formData.area_plantio <= 0 ||
      formData.num_arvores_plantadas < 0 ||
      formData.num_arvores_cortadas < 0 ||
      formData.numero_car < 0
    ) {
      setPopup({ message: "Os valores não podem ser negativos ou zero!", type: 'error' });
      return;
    }

    // Validar formato dos números
    if (
      !isValidNumber(formData.area_imovel) ||
      !isValidNumber(formData.area_plantio) ||
      !isValidNumber(formData.num_arvores_plantadas) ||
      !isValidNumber(formData.num_arvores_cortadas)
    ) {
      setPopup({ message: "Os números devem estar no formato correto (ex: 100000.00).", type: 'error' });
      return;
    }

    // Formatar números
    const formatNumber = (num) => num.replace(/\./g, '').replace(',', '.');

    const area_imovel = formData.area_imovel;
    const area_plantio = formData.area_plantio;
    const num_arvores_plantadas = formData.num_arvores_plantadas;
    const num_arvores_cortadas = formData.num_arvores_cortadas;

    const num_arvores_remanescentes = num_arvores_plantadas - num_arvores_cortadas;
    const num_arvores_por_hectare = num_arvores_remanescentes / area_plantio;

    const formDataToSend = {
      ...formData,
      area_imovel,
      area_plantio,
      num_arvores_plantadas,
      num_arvores_cortadas,
      num_arvores_remanescentes,
      num_arvores_por_hectare,
      altura_desrama: 0, // Altura da desrama sempre como 0
      arrendatario: isArrendado ? formData.arrendatario : null,
      vencimento_contrato: isArrendado ? formData.vencimento_contrato : null,
      data_contrato: isArrendado ? formData.data_contrato : null,
    };

    // Enviar para o servidor
    const response = await fetch('http://localhost:5000/api/imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formDataToSend),
    });

    if (response.ok) {
      setPopup({ message: "Imóvel cadastrado com sucesso!", type: 'success' });
      setFormData({
        descricao: '',
        codigo_cc: '',
        area_imovel: '',
        area_plantio: '',
        especie: '',
        origem: '',
        num_arvores_plantadas: '',
        num_arvores_cortadas: '',
        matricula: '',
        data_plantio: '',
        data_contrato: '',
        vencimento_contrato: '',
        numero_ccir: '',
        numero_itr: '',
        proprietario: '',
        arrendatario: '',
        municipio: '',
        localidade: '',
        numero_car: '',
      });
    } else {
      setPopup({ message: "Erro ao cadastrar o imóvel.", type: 'error' });
    }
  };

  const toggleTipoImovel = (tipo) => {
    setIsArrendado(tipo === 'arrendado');
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Cadastro de Imóveis</h1>

      <div className="text-center mb-4">
        <button type="button" className={`btn btn-secondary mx-2 ${!isArrendado ? 'active' : ''}`} onClick={() => toggleTipoImovel('proprio')}>Próprio</button>
        <button type="button" className={`btn btn-secondary mx-2 ${isArrendado ? 'active' : ''}`} onClick={() => toggleTipoImovel('arrendado')}>Arrendado</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <div className="form-group">
          <label htmlFor="descricao">Descrição</label>
          <input type="text" className="form-control" id="descricao" value={formData.descricao} onChange={handleChange} placeholder="Digite a descrição do imóvel" required />
        </div>

        <div className="form-group">
          <label htmlFor="codigo_cc">Código CC</label>
          <input type="text" className="form-control" id="codigo_cc" value={formData.codigo_cc} onChange={handleChange} placeholder="Digite o código CC" required />
          {codigoCCExists && <div className="text-danger">Código CC já existe</div>}
        </div>

        <div className="form-group">
          <label htmlFor="numero_car">Número CAR</label>
          <input type="text" className="form-control" id="numero_car" value={formData.numero_car} onChange={handleChange} placeholder="Digite o número CAR" required />
        </div>

        <div className="form-group">
          <label htmlFor="area_imovel">Área do Imóvel</label>
          <input type="number" className="form-control" id="area_imovel" value={formData.area_imovel} onChange={handleChange} placeholder="Digite a área do imóvel" required />
        </div>

        <div className="form-group">
          <label htmlFor="area_plantio">Área de Plantio</label>
          <input type="number" className="form-control" id="area_plantio" value={formData.area_plantio} onChange={handleChange} placeholder="Digite a área de plantio" required />
        </div>

        <div className="form-group">
          <label htmlFor="especie">Espécie</label>
          <input type="text" className="form-control" id="especie" value={formData.especie} onChange={handleChange} placeholder="Digite a espécie" required />
        </div>

        <div className="form-group">
          <label htmlFor="origem">Origem</label>
          <input type="text" className="form-control" id="origem" value={formData.origem} onChange={handleChange} placeholder="Digite a origem" required />
        </div>

        <div className="form-group">
          <label htmlFor="num_arvores_plantadas">Número de Árvores Plantadas</label>
          <input type="number" className="form-control" id="num_arvores_plantadas" value={formData.num_arvores_plantadas} onChange={handleChange} placeholder="Digite o número de árvores plantadas" required />
        </div>

        <div className="form-group">
          <label htmlFor="num_arvores_cortadas">Número de Árvores Cortadas</label>
          <input type="number" className="form-control" id="num_arvores_cortadas" value={formData.num_arvores_cortadas} onChange={handleChange} placeholder="Digite o número de árvores cortadas" required />
        </div>

        <div className="form-group">
          <label htmlFor="matricula">Matrícula</label>
          <input type="text" className="form-control" id="matricula" value={formData.matricula} onChange={handleChange} placeholder="Digite a matrícula" required />
        </div>

        <div className="form-group">
          <label htmlFor="data_plantio">Data de Plantio</label>
          <input type="date" className="form-control" id="data_plantio" value={formData.data_plantio} onChange={handleChange} required />
        </div>

        {isArrendado && (
          <>
            <div className="form-group">
              <label htmlFor="vencimento_contrato">Vencimento do Contrato</label>
              <input type="date" className="form-control" id="vencimento_contrato" value={formData.vencimento_contrato} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="arrendatario">Arrendatário</label>
              <input type="text" className="form-control" id="arrendatario" value={formData.arrendatario} onChange={handleChange} placeholder="Digite o nome do arrendatário" required />
            </div>
            <div className="form-group">
              <label htmlFor="data_contrato">Data do Contrato</label>
              <input type="date" className="form-control" id="data_contrato" value={formData.data_contrato} onChange={handleChange} required />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="numero_ccir">Número do CCIR</label>
          <input type="text" className="form-control" id="numero_ccir" value={formData.numero_ccir} onChange={handleChange} placeholder="Digite o número do CCIR" required />
        </div>

        <div className="form-group">
          <label htmlFor="numero_itr">Número do ITR</label>
          <input type="text" className="form-control" id="numero_itr" value={formData.numero_itr} onChange={handleChange} placeholder="Digite o número do ITR" required />
        </div>

        <div className="form-group">
          <label htmlFor="proprietario">Proprietário</label>
          <input type="text" className="form-control" id="proprietario" value={formData.proprietario} onChange={handleChange} placeholder="Digite o nome do proprietário" required />
        </div>

        <div className="form-group">
          <label htmlFor="municipio">Município</label>
          <input type="text" className="form-control" id="municipio" value={formData.municipio} onChange={handleChange} placeholder="Digite o município" required />
        </div>

        <div className="form-group">
          <label htmlFor="localidade">Localidade</label>
          <input type="text" className="form-control" id="localidade" value={formData.localidade} onChange={handleChange} placeholder="Digite a localidade" required />
        </div>

        <button type="submit" className="btn btn-primary btn-block">Cadastrar</button>
      </form>

      {/* PopupAlert */}
      {popup.message && <PopupAlert message={popup.message} type={popup.type} onClose={() => setPopup({ message: '', type: '' })} />}
    </div>
  );
};

export default CadastroImoveis;

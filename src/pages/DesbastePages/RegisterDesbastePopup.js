import React, { useState, useEffect } from "react";
import "./RegisterDesbastePopup.css";
import PopupAlert from "../PopupAlert";

const formatDate = (date) => {
  if (!date) return "";
  const parsedDate = new Date(date);
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();
  return `${day}/${month}/${year}`;
};

const RegisterDesbastePopup = ({ isOpen, onClose, imovelId }) => {
  const [desbaste, setDesbaste] = useState({
    numero: "",
    data: "",
    arvores_cortadas: "",
    lenha: "",
    toretes: "",
    toras_20_25cm: "",
    toras_25_33cm: "",
    toras_acima_33cm: "",
    preco_lenha: "",
    preco_toretes: "",
    preco_toras_20_25cm: "",
    preco_toras_25_33cm: "",
    preco_toras_acima_33cm: "",
    valor_extracao: "",
    previsao: "",
  });

  const [selectedPrevisao, setSelectedPrevisao] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [previsoes, setPrevisoes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setDesbaste({ ...desbaste, [e.target.name]: e.target.value });
  };

  
  const handleSubmit = async () => {
    if (!desbaste.numero || !desbaste.data || !desbaste.arvores_cortadas) {
      setPopup({ message: "Todos os campos são obrigatórios!", type: "error" });
      return;
    }
  
    const formattedDesbaste = {
      numero: desbaste.numero,
      data: desbaste.data,
      arvores_cortadas: desbaste.arvores_cortadas,
      lenha: desbaste.lenha,
      toretes: desbaste.toretes,
      toras_20_25cm: desbaste.toras_20_25cm,
      toras_25_33cm: desbaste.toras_25_33cm,
      toras_acima_33cm: desbaste.toras_acima_33cm,
      preco_lenha: desbaste.preco_lenha,
      preco_toretes: desbaste.preco_toretes,
      preco_toras_20_25cm: desbaste.preco_toras_20_25cm,
      preco_toras_25_33cm: desbaste.preco_toras_25_33cm,
      preco_toras_acima_33cm: desbaste.preco_toras_acima_33cm,
      valor_extracao: desbaste.valor_extracao,
    };
  
    try {
      const response = await fetch(`http://localhost:5000/api/desbastes/${selectedPrevisao.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedDesbaste),
      });
  
      if (!response.ok) throw new Error("Erro ao atualizar desbaste");
  
      setPopup({ message: "Desbaste atualizado com sucesso!", type: "success" });
      setSelectedPrevisao(null); // Garantir que a previsão seja desmarcada após a edição
      fetchPrevisoes(); // Atualiza as previsões imediatamente após editar
    } catch (error) {
      console.error(error);
      setPopup({ message: "Falha ao atualizar desbaste", type: "error" });
    }
  };
  
  const handlePrevisaoSubmit = async () => {
    if (!desbaste.previsao) {
      setPopup({ message: "O campo 'previsão' é obrigatório!", type: "error" });
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/desbastes/previsao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previsao: desbaste.previsao }),
      });
  
      if (!response.ok) throw new Error("Erro ao registrar previsão");
  
      setPopup({ message: "Previsão de desbaste registrada com sucesso!", type: "success" });
      setDesbaste({ ...desbaste, previsao: "" });
      fetchPrevisoes(); // Atualiza previsões após adicionar uma nova
    } catch (error) {
      console.error(error);
      setPopup({ message: "Erro ao registrar previsão", type: "error" });
    }
  };
  
  const fetchPrevisoes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/desbastes/previsoes`);
      if (!response.ok) throw new Error("Erro ao carregar previsões");
  
      const data = await response.json();
      setPrevisoes(data); // Atualiza o estado das previsões
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    if (selectedPrevisao) {
      setDesbaste({
        numero: selectedPrevisao.numero,
        data: selectedPrevisao.data,
        arvores_cortadas: selectedPrevisao.arvores_cortadas,
        lenha: selectedPrevisao.lenha,
        toretes: selectedPrevisao.toretes,
        toras_20_25cm: selectedPrevisao.toras_20_25cm,
        toras_25_33cm: selectedPrevisao.toras_25_33cm,
        toras_acima_33cm: selectedPrevisao.toras_acima_33cm,
        preco_lenha: selectedPrevisao.preco_lenha,
        preco_toretes: selectedPrevisao.preco_toretes,
        preco_toras_20_25cm: selectedPrevisao.preco_toras_20_25cm,
        preco_toras_25_33cm: selectedPrevisao.preco_toras_25_33cm,
        preco_toras_acima_33cm: selectedPrevisao.preco_toras_acima_33cm,
        valor_extracao: selectedPrevisao.valor_extracao,
      });
    }
  }, [selectedPrevisao]);
  


   // Fechar o popup após uma ação (Ex: após sucesso ou erro)
   const closePopupAlert = () => {
    setPopup({ message: "", type: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="desbaste-popup-overlay">
      <div className="desbaste-popup-container">
        <h2 className="desbaste-popup-title">Registrar Previsão de Desbaste</h2>

        <div className="desbaste-popup-form-group">
          <label>Previsão:</label>
          <input
            type="date"
            name="previsao"
            value={desbaste.previsao}
            onChange={handleChange}
            className="desbaste-popup-input"
          />
        </div>

        <button onClick={handlePrevisaoSubmit} className="btn btn-secondary">
          Registrar Previsão
        </button>

        <hr />

        <h3>Previsões Pendentes</h3>
        {isLoading ? (
          <p>Carregando previsões...</p>
        ) : previsoes.length === 0 ? (
          <p>Nenhuma previsão pendente.</p>
        ) : (
          <ul className="previsoes-list">
            {previsoes.map((prev) => (
              <li key={prev.id} className="previsao-item">
                <span>{formatDate(prev.previsao)}</span>
                <button onClick={() => setSelectedPrevisao(prev)} className="btn btn-primary">
  Editar Desbaste
</button>

              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose} className="btn btn-danger">
          Fechar
        </button>
      </div>

      {selectedPrevisao && (
        <div className="edit-popup">
          <h2>Editar Previsão de Desbaste</h2>
          <div className="desbaste-popup-form-group">
            <label>Número:</label>
            <input
              type="number"
              name="numero"
              value={desbaste.numero}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Data:</label>
            <input
              type="date"
              name="data"
              value={desbaste.data}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Árvores Cortadas:</label>
            <input
              type="number"
              name="arvores_cortadas"
              value={desbaste.arvores_cortadas}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          {/* Campos restantes */}
          <div className="desbaste-popup-form-group">
            <label>Lenha:</label>
            <input
              type="number"
              name="lenha"
              value={desbaste.lenha}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Toretes:</label>
            <input
              type="number"
              name="toretes"
              value={desbaste.toretes}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Toras 20-25cm:</label>
            <input
              type="number"
              name="toras_20_25cm"
              value={desbaste.toras_20_25cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Toras 25-33cm:</label>
            <input
              type="number"
              name="toras_25_33cm"
              value={desbaste.toras_25_33cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Toras Acima de 33cm:</label>
            <input
              type="number"
              name="toras_acima_33cm"
              value={desbaste.toras_acima_33cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Preço Lenha:</label>
            <input
              type="number"
              name="preco_lenha"
              value={desbaste.preco_lenha}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Preço Toretes:</label>
            <input
              type="number"
              name="preco_toretes"
              value={desbaste.preco_toretes}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Preço Toras 20-25cm:</label>
            <input
              type="number"
              name="preco_toras_20_25cm"
              value={desbaste.preco_toras_20_25cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Preço Toras 25-33cm:</label>
            <input
              type="number"
              name="preco_toras_25_33cm"
              value={desbaste.preco_toras_25_33cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Preço Toras Acima de 33cm:</label>
            <input
              type="number"
              name="preco_toras_acima_33cm"
              value={desbaste.preco_toras_acima_33cm}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <div className="desbaste-popup-form-group">
            <label>Valor Extração:</label>
            <input
              type="number"
              name="valor_extracao"
              value={desbaste.valor_extracao}
              onChange={handleChange}
              className="desbaste-popup-input"
            />
          </div>
          <button onClick={handleSubmit} className="btn btn-success">
            Atualizar
          </button>
          <button onClick={() => setSelectedPrevisao(null)} className="btn btn-danger">
            Cancelar
          </button>
        </div>
      )}

{popup.message && <PopupAlert message={popup.message} type={popup.type} onClose={closePopupAlert} />}
    </div>
  );
};

export default RegisterDesbastePopup;

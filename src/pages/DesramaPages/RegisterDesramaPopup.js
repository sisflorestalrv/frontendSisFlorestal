import React, { useState, useEffect } from "react";
import "./RegisterDesramaPopup.css";
import PopupAlert from "../PopupAlert";

const formatDate = (date) => {
  if (!date) return "";
  const parsedDate = new Date(date);
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();
  return `${day}/${month}/${year}`;
};


const RegisterDesramaPopup = ({ isOpen, onClose, imovelId }) => {
  const [desrama, setDesrama] = useState({
    altura: "",
    numero: "",
    data: "",
    previsao: "",
  });

  const [selectedPrevisao, setSelectedPrevisao] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [previsoes, setPrevisoes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setDesrama({ ...desrama, [e.target.name]: e.target.value });
  };

  const handlePrevisaoSubmit = async () => {
    if (!desrama.previsao) {
      setPopup({ message: "O campo 'previsão' é obrigatório!", type: "error" });
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/desramas/previsao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previsao: desrama.previsao }),
      });

      if (!response.ok) throw new Error("Erro ao registrar previsão");

      setPopup({ message: "Previsão registrada com sucesso!", type: "success" });
      setDesrama({ ...desrama, previsao: "" });
      fetchPrevisoes();
    } catch (error) {
      console.error(error);
      setPopup({ message: "Erro ao registrar previsão", type: "error" });
    }
  };

  const handleSubmit = async () => {
    if (!desrama.altura || !desrama.numero || !desrama.data) {
      setPopup({ message: "Todos os campos são obrigatórios!", type: "error" });
      return;
    }

    const formattedDesrama = {
      altura: desrama.altura.replace(",", "."),
      numero: desrama.numero,
      data: desrama.data,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/desramas/${selectedPrevisao.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedDesrama),
      });

      if (!response.ok) throw new Error("Erro ao atualizar desrama");

      setPopup({ message: "Desrama atualizada com sucesso!", type: "success" });
      setSelectedPrevisao(null);
      fetchPrevisoes();
    } catch (error) {
      console.error(error);
      setPopup({ message: "Falha ao atualizar desrama", type: "error" });
    }
  };

  const fetchPrevisoes = async (imovelId) => {
    setIsLoading(true); // Inicia o estado de carregamento
    try {
      // Realiza a requisição GET passando o imovelId
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/desramas/previsoes`);
      
      if (!response.ok) throw new Error("Erro ao carregar previsões");
  
      // Converte a resposta para JSON
      const data = await response.json();
      setPrevisoes(data); // Atualiza o estado das previsões
    } catch (error) {
      console.error(error); // Registra o erro no console
    } finally {
      setIsLoading(false); // Finaliza o carregamento
    }
  };
  
  useEffect(() => {
  if (isOpen && imovelId) fetchPrevisoes(imovelId); // Chama a função com o ID do imóvel
}, [isOpen, imovelId]); // A função é chamada quando `isOpen` ou `imovelId` muda


  if (!isOpen) return null;

  return (
    <div className="desrama-popup-overlay">
      <div className="desrama-popup-container">
        <h2 className="desrama-popup-title">Registrar Desrama</h2>

        <div className="desrama-popup-form-group">
          <label>Previsão:</label>
          <input
            type="date"
            name="previsao"
            value={desrama.previsao}
            onChange={handleChange}
            className="desrama-popup-input"
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
                  Registrar Desrama
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
          <h2>Editar Previsão</h2>
          <div className="desrama-popup-form-group">
            <label>Altura:</label>
            <input
              type="text"
              name="altura"
              value={desrama.altura}
              onChange={handleChange}
              className="desrama-popup-input"
            />
          </div>
          <div className="desrama-popup-form-group">
            <label>Número:</label>
            <input
              type="number"
              name="numero"
              value={desrama.numero}
              onChange={handleChange}
              className="desrama-popup-input"
            />
          </div>
          <div className="desrama-popup-form-group">
            <label>Data:</label>
            <input
              type="date"
              name="data"
              value={desrama.data}
              onChange={handleChange}
              className="desrama-popup-input"
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

      {popup.message && <PopupAlert message={popup.message} type={popup.type} onClose={() => setPopup({ message: "", type: "" })} />}
    </div>
  );
};

export default RegisterDesramaPopup;

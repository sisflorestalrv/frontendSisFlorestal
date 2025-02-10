import React, { useState, useEffect } from "react";
import './NotasModal.css'; // Importando o CSS
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importando os ícones do react-icons
import PopupAlert from '../PopupAlert'; // Importando o componente PopupAlert

const NotasModal = ({ isOpen, onClose, imovelId }) => {
  const [notas, setNotas] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [editingNotaId, setEditingNotaId] = useState(null);
  const [notaDetalhada, setNotaDetalhada] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "" }); // Estado para popup

  const fetchNotas = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/imoveis/${imovelId}/notas`);
      const data = await response.json();
      setNotas(data);
    } catch (error) {
      console.error("Erro ao buscar as notas:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotas();
    }
  }, [isOpen, imovelId]);

  const handleSaveNota = async () => {
    const notaData = { titulo: novoTitulo, descricao: novaDescricao };

    try {
      if (editingNotaId) {
        // Atualizando nota existente
        await fetch(`http://localhost:5000/api/imoveis/${imovelId}/notas/${editingNotaId}`, {
          method: "PUT",
          body: JSON.stringify(notaData),
          headers: { "Content-Type": "application/json" },
        });
        setPopup({ message: "Nota atualizada com sucesso!", type: "success" });
      } else {
        // Criando nova nota
        await fetch(`http://localhost:5000/api/imoveis/${imovelId}/notas`, {
          method: "POST",
          body: JSON.stringify(notaData),
          headers: { "Content-Type": "application/json" },
        });
        setPopup({ message: "Nota registrada com sucesso!", type: "success" });
      }
      setNovoTitulo("");
      setNovaDescricao("");
      setEditingNotaId(null);
      fetchNotas();
      if (notaDetalhada) {
        handleCloseNotaDetails(); // Fechar apenas o modal de detalhes
      }
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      setPopup({ message: "Erro ao salvar a nota.", type: "error" });
    }
  };

  const handleDeleteNota = async (notaId) => {
    try {
      await fetch(`http://localhost:5000/api/imoveis/${imovelId}/notas/${notaId}`, {
        method: "DELETE",
      });
      setPopup({ message: "Nota excluída com sucesso!", type: "success" });
      fetchNotas();
      if (notaDetalhada) {
        handleCloseNotaDetails(); // Fechar apenas o modal de detalhes
      }
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      setPopup({ message: "Erro ao excluir a nota.", type: "error" });
    }
  };

  const handleShowNotaDetails = (nota) => {
    setNotaDetalhada(nota);
    setNovoTitulo(nota.titulo);
    setNovaDescricao(nota.descricao);
    setEditingNotaId(nota.id);
  };

  const handleCloseNotaDetails = () => {
    setNotaDetalhada(null); // Fechar apenas o modal de detalhes
  };

  return (
    isOpen && (
      <div className="notas-modal show">
        <div className="notas-modal-content">
          <button className="notas-modal-close-btn" onClick={onClose}>X</button>
          <h2>Notas do Imóvel</h2>

          {/* Exibindo o PopupAlert */}
          {popup.message && <PopupAlert message={popup.message} onClose={() => setPopup({ message: "", type: "" })} type={popup.type} />}

          <div className="notas-modal-body">
            <input
              type="text"
              placeholder="Título"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              className="input-modal"
            />
            <textarea
              placeholder="Descrição"
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              className="textarea-modal"
            ></textarea>
            <button className="notas-modal-button" onClick={handleSaveNota}>Salvar Nota</button>
            <h3>Notas Registradas</h3>
            <table className="notas-modal-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => (
                  <tr key={nota.id}>
                    <td>{nota.titulo}</td>
                    <td>{nota.descricao}</td>
                    <td>
                      <button
                        className="btn btn-info"
                        onClick={() => handleShowNotaDetails(nota)} // Exibe os detalhes da nota
                      >
                        Ver Detalhes
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => { setNovoTitulo(nota.titulo); setNovaDescricao(nota.descricao); setEditingNotaId(nota.id); }}
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteNota(nota.id)}
                      >
                        <FaTrashAlt /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {notaDetalhada && (
          <div className="nota-detalhada-modal show">
            <div className="nota-detalhada-modal-content">
              <button className="nota-detalhada-modal-close-btn" onClick={handleCloseNotaDetails}>Fechar</button>
              <h2>Editando: {notaDetalhada.titulo}</h2>
              <input
                type="text"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                className="input-modal"
              />
              <textarea
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                className="textarea-modal"
              />
              <div className="nota-detalhada-modal-actions">
                <button className="btn btn-warning" onClick={handleSaveNota}>
                  <FaEdit /> Salvar Edição
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteNota(notaDetalhada.id)}>
                  <FaTrashAlt /> Excluir
                </button>
                <button className="btn btn-secondary" onClick={handleCloseNotaDetails}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default NotasModal;

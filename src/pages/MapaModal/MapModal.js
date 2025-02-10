import React, { useState, useEffect } from "react";
import axios from 'axios'; // Biblioteca para fazer requisições
import { FiFile, FiTrash2 } from 'react-icons/fi'; // Ícones para arquivo
import './MapModal.css';

const MapModal = ({ isOpen, onClose, imovelId }) => {
  const [maps, setMaps] = useState([]);
  const [mapFile, setMapFile] = useState(null);
  const [title, setTitle] = useState(''); // Para armazenar o título do arquivo

  // Carregar os mapas do imóvel
  useEffect(() => {
    if (isOpen) {
      fetchMaps();
    }
  }, [isOpen]);

  const fetchMaps = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/imoveis/${imovelId}/mapas`);
      setMaps(response.data); // Armazenar a lista de mapas, incluindo os títulos
    } catch (error) {
      console.error("Erro ao carregar os mapas:", error);
    }
  };

  const handleMapUpload = async () => {
    if (!mapFile || !title) return; // Verificar se o arquivo e título estão definidos

    const formData = new FormData();
    formData.append("mapa", mapFile);
    formData.append("titulo", title); // Adicionar o título ao envio

    try {
      await axios.post(`http://localhost:5000/api/imoveis/${imovelId}/mapas`, formData);
      fetchMaps(); // Atualiza a lista de mapas após upload
      setTitle(''); // Limpa o campo de título após o envio
      setMapFile(null); // Limpa o campo de arquivo após o envio
    } catch (error) {
      console.error("Erro ao enviar o mapa:", error);
    }
  };

  const handleDeleteMap = async (mapId) => {
    try {
      await axios.delete(`http://localhost:5000/api/imoveis/${imovelId}/mapas/${mapId}`);
      fetchMaps(); // Atualiza a lista de mapas após exclusão
    } catch (error) {
      console.error("Erro ao deletar o mapa:", error);
    }
  };

  return (
    isOpen && (
      <div className="custom-modal-overlay">
        <div className="custom-modal">
          <h2 className="modal-title">Mapas do Imóvel</h2>
          <div className="modal-body">
            <div className="upload-section">
              <input
                type="text"
                placeholder="Digite o título do mapa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
              <input
                type="file"
                accept="image/*,application/pdf,application/vnd.google-earth.kml+xml"
                onChange={(e) => setMapFile(e.target.files[0])}
                className="file-input"
              />
              <button className="btn btn-primary" onClick={handleMapUpload}>
                Subir Mapa
              </button>
            </div>
            <div className="map-list">
              {maps.map((map) => (
                <div key={map.id} className="map-item">
                  <div className="map-info">
                    <FiFile size={20} />
                    <span>{map.titulo}</span> {/* Exibe o título do arquivo */}
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMap(map.id)}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-danger" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default MapModal;

import React, { useState, useEffect } from "react";
import axios from 'axios'; // Biblioteca para fazer requisições
import { FiFile, FiTrash2 } from 'react-icons/fi'; // Ícones para arquivo
import './FilesModal.css'; // Altere o nome da classe de CSS para "FilesModal.css"

const FilesModal = ({ isOpen, onClose, imovelId }) => {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(''); // Para armazenar o título do arquivo

  // Carregar os arquivos do imóvel
  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/imoveis/${imovelId}/arquivos`);
      setFiles(response.data); // Armazenar a lista de arquivos, incluindo os títulos
    } catch (error) {
      console.error("Erro ao carregar os arquivos:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !title) return; // Verificar se o arquivo e título estão definidos

    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("titulo", title); // Adicionar o título ao envio

    try {
      await axios.post(`http://localhost:5000/api/imoveis/${imovelId}/arquivos`, formData);
      fetchFiles(); // Atualiza a lista de arquivos após upload
      setTitle(''); // Limpa o campo de título após o envio
      setFile(null); // Limpa o campo de arquivo após o envio
    } catch (error) {
      console.error("Erro ao enviar o arquivo:", error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`http://localhost:5000/api/imoveis/${imovelId}/arquivos/${fileId}`);
      fetchFiles(); // Atualiza a lista de arquivos após exclusão
    } catch (error) {
      console.error("Erro ao deletar o arquivo:", error);
    }
  };

  return (
    isOpen && (
      <div className="custom-modal-overlay">
        <div className="custom-modal">
          <h2 className="modal-title">Arquivos do Imóvel</h2>
          <div className="modal-body">
            <div className="upload-section">
              <input
                type="text"
                placeholder="Digite o título do arquivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="title-input"
              />
              <input
                type="file"
                accept="*/*" // Aceita todos os tipos de arquivos
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
              <button className="btn btn-primary" onClick={handleFileUpload}>
                Subir Arquivo
              </button>
            </div>
            <div className="file-list">
              {files.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-info">
                    <FiFile size={20} />
                    <span>{file.titulo}</span> {/* Exibe o título do arquivo */}
                  </div>
                  <div className="action-buttons">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFile(file.id)}
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

export default FilesModal;

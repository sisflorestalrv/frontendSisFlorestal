import React, { useState, useEffect } from "react";
import PopupAlert from '../PopupAlert'; // Importando o PopupAlert
import "./GalleryModal.css"; // Importação do estilo CSS

const GalleryModal = ({ isOpen, onClose, imovelId }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [popup, setPopup] = useState({ message: "", type: "" }); // Estado para popup
  const [titulo, setTitulo] = useState(""); 

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/imoveis/${imovelId}/imagens`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar imagens");
      }
      const data = await response.json();
      setImages(data);
    } catch (error) {
      setPopup({ message: error.message, type: "error" });
    }
  };

  const handleImageUpload = async () => {
    if (!file) {
      setPopup({ message: "Selecione uma imagem para enviar.", type: "error" });
      return;
    }
    if (!titulo) {
      setPopup({ message: "Informe um título para a imagem.", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("imagem", file);
    formData.append("titulo", titulo);

    try {
      const response = await fetch(
        `http://localhost:5000/api/imoveis/${imovelId}/imagens`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar imagem");
      }
      setFile(null); // Limpa o estado do arquivo
      setTitulo(""); // Limpa o título
      fetchImages(); // Atualiza as imagens
      setPopup({ message: "Imagem enviada com sucesso!", type: "success" });
    } catch (error) {
      setPopup({ message: error.message, type: "error" });
    }
  };

  const handleDeleteImage = async (imageId) => {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta imagem?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/imoveis/${imovelId}/imagens/${imageId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao excluir imagem");
      }

      // Remove a imagem do estado imediatamente após a exclusão
      setImages((prevImages) => prevImages.filter(image => image.id !== imageId));
      setPopup({ message: "Imagem excluída com sucesso!", type: "success" });
    } catch (error) {
      setPopup({ message: error.message, type: "error" });
    }
  };

  return (
    isOpen && (
      <div className="modal">
        <div className="modal-content">
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
          <h2>Galeria de Imagens</h2>

          {/* Exibindo o PopupAlert */}
          {popup.message && <PopupAlert message={popup.message} onClose={() => setPopup({ message: "", type: "" })} type={popup.type} />}

          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="upload-input"
            />
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título da imagem"
              className="upload-title"
            />
            <button
              onClick={handleImageUpload}
              className="btn btn-success"
              disabled={!file || !titulo}
            >
              Enviar Imagem
            </button>
          </div>

          <div className="gallery">
            {images.length > 0 ? (
              images.map((image) => (
                <div key={image.id} className="gallery-item">
                  <img
                    src={`http://localhost:5000/${image.caminho}`}
                    alt="Imagem do imóvel"
                    className="gallery-image"
                    onClick={() => setSelectedImage(image)}
                  />
                  <div className="image-title">{image.titulo}</div>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    Excluir
                  </button>
                </div>
              ))
            ) : (
              <p>Nenhuma imagem encontrada.</p>
            )}
          </div>

          {selectedImage && (
            <div className="fullscreen-overlay">
              <div className="fullscreen-container">
                <button
                  className="close-fullscreen"
                  onClick={() => setSelectedImage(null)}
                >
                  &times;
                </button>
                <img
                  src={`http://localhost:5000/${selectedImage.caminho}`}
                  alt="Imagem selecionada"
                  className="fullscreen-image"
                />
                <div className="image-title">{selectedImage.titulo}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default GalleryModal;

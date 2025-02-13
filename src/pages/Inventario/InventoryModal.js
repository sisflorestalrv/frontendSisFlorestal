  import React, { useState, useEffect } from "react";
  import "./InventoryModal.css";
  import jsPDF from "jspdf";
  import "jspdf-autotable";

  const InventoryModal = ({ isOpen, onClose, imovelId }) => {
    const [inventoryData, setInventoryData] = useState({
      numeroInventario: "",
      data: "",
      quantidadeAmostras: "",
      quantidadeArvores: "",
      pesoKgM3: "",
      diametroMedio: "",
      alturaMedia: "",
      volumeTotalM3: "",
      volumeTotalTON: "",
      volumeLenha: "",
      volume15a20: "",
      volume20a25: "",
      volume25a33: "",
      volume33Acima: "",
      valorLenha: "",
      valor15a20: "",
      valor20a25: "",
      valor25a33: "",
      valor33Acima: "",
      valorTotal: "",
    });

    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedInventarios, setSelectedInventarios] = useState([]);

    useEffect(() => {
      if (isOpen) {
        setLoading(true);
        setError(null);
        fetch(`http://localhost:5000/api/imoveis/${imovelId}/inventario`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Erro ao carregar inventários.");
            }
            return response.json();
          })
          .then((data) => {
            if (Array.isArray(data)) {
              setInventarios(data);
            } else {
              setInventarios([]);
            }
          })
          .catch((error) => {
            console.error("Erro ao carregar inventários:", error);
            setError(error.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, [isOpen, imovelId]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInventoryData({ ...inventoryData, [name]: value });
    };

    const handleSave = () => {
      fetch(`http://localhost:5000/api/imoveis/${imovelId}/inventario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inventoryData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Inventário salvo:", data);
          onClose();
        })
        .catch((error) => console.error("Erro ao salvar inventário:", error));
    };

    const handleSelectInventario = (id) => {
      setSelectedInventarios((prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((item) => item !== id)
          : [...prevSelected, id]
      );
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const generateReport = () => {
      const selectedData = inventarios.filter((inventario) =>
        selectedInventarios.includes(inventario.id)
      );
    
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
    
      doc.autoTable({
        head: [
          [
            "Número",
            "Data",
            "Quantidade Amostras",
            "Quantidade Árvores",
            "Peso (kg/m³)",
            "Diâmetro Médio",
            "Altura Média",
            "Volume Total (m³)",
            "Volume Total (TON)",
            "Volume Lenha",
            "Volume 15 a 20",
            "Volume 20 a 25",
            "Volume 25 a 33",
            "Volume 33 acima",
            "Valor Lenha (R$)",
            "Valor 15 a 20 (R$)",
            "Valor 20 a 25 (R$)",
            "Valor 25 a 33 (R$)",
            "Valor 33 acima (R$)",
            "Valor Total (R$)",
          ],
        ],
        body: selectedData.map((inventario) => [
          inventario.numero_inventario,
          formatDate(inventario.data), // Formatar a data aqui
          inventario.quantidade_amostras,
          inventario.quantidade_arvores,
          inventario.peso_kg_m3,
          inventario.diametro_medio,
          inventario.altura_media,
          inventario.volume_total_m3,
          inventario.volume_total_ton,
          inventario.volume_lenha,
          inventario.volume_15_a_20,
          inventario.volume_20_a_25,
          inventario.volume_25_a_33,
          inventario.volume_33_acima,
          inventario.valor_lenha,
          inventario.valor_15_a_20,
          inventario.valor_20_a_25,
          inventario.valor_25_a_33,
          inventario.valor_33_acima,
          inventario.valor_total,
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 1,
        },
        margin: { top: 10 },
        startY: 10,
        theme: "grid",
        tableWidth: "auto",
      });
    
      doc.save("relatorio_inventario.pdf");
    };

    if (!isOpen) return null;

    return (
      <>
        <div className="customModalInventory-overlay" onClick={onClose}></div>
        <div className="customModalInventory">
          <h2 className="customModalInventory-title">Inventário do Imóvel</h2>
          <div className="customModalInventory-content">
            <table className="customModalInventory-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Data</th>
                  <th>Quantidade Amostras</th>
                  <th>Quantidade Árvores</th>
                  <th>Peso (kg/m³)</th>
                  <th>Diâmetro Médio</th>
                  <th>Altura Média</th>
                  <th>Volume Total (m³)</th>
                  <th>Volume Total (TON)</th>
                  <th>Volume Lenha</th>
                  <th>Volume 15 a 20</th>
                  <th>Volume 20 a 25</th>
                  <th>Volume 25 a 33</th>
                  <th>Volume 33 acima</th>
                  <th>Valor Lenha (R$)</th>
                  <th>Valor 15 a 20 (R$)</th>
                  <th>Valor 20 a 25 (R$)</th>
                  <th>Valor 25 a 33 (R$)</th>
                  <th>Valor 33 acima (R$)</th>
                  <th>Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      type="text"
                      name="numeroInventario"
                      value={inventoryData.numeroInventario}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      name="data"
                      value={inventoryData.data}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantidadeAmostras"
                      value={inventoryData.quantidadeAmostras}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantidadeArvores"
                      value={inventoryData.quantidadeArvores}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="pesoKgM3"
                      value={inventoryData.pesoKgM3}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="diametroMedio"
                      value={inventoryData.diametroMedio}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="alturaMedia"
                      value={inventoryData.alturaMedia}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volumeTotalM3"
                      value={inventoryData.volumeTotalM3}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volumeTotalTON"
                      value={inventoryData.volumeTotalTON}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volumeLenha"
                      value={inventoryData.volumeLenha}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volume15a20"
                      value={inventoryData.volume15a20}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volume20a25"
                      value={inventoryData.volume20a25}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volume25a33"
                      value={inventoryData.volume25a33}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="volume33Acima"
                      value={inventoryData.volume33Acima}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valorLenha"
                      value={inventoryData.valorLenha}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valor15a20"
                      value={inventoryData.valor15a20}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valor20a25"
                      value={inventoryData.valor20a25}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valor25a33"
                      value={inventoryData.valor25a33}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valor33Acima"
                      value={inventoryData.valor33Acima}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="valorTotal"
                      value={inventoryData.valorTotal}
                      onChange={handleInputChange}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <h3>Inventários Cadastrados</h3>
            {loading ? (
              <p>Carregando inventários...</p>
            ) : error ? (
              <p className="customModalInventory-error">{error}</p>
            ) : (
              <>
                <table className="customModalInventory-table">
                  <thead>
                    <tr>
                      <th>Selecionar</th>
                      <th>Número</th>
                      <th>Data</th>
                      <th>Quantidade Amostras</th>
                      <th>Quantidade Árvores</th>
                      <th>Peso (kg/m³)</th>
                      <th>Diâmetro Médio</th>
                      <th>Altura Média</th>
                      <th>Volume Total (m³)</th>
                      <th>Volume Total (TON)</th>
                      <th>Volume Lenha</th>
                      <th>Volume 15 a 20</th>
                      <th>Volume 20 a 25</th>
                      <th>Volume 25 a 33</th>
                      <th>Volume 33 acima</th>
                      <th>Valor Lenha (R$)</th>
                      <th>Valor 15 a 20 (R$)</th>
                      <th>Valor 20 a 25 (R$)</th>
                      <th>Valor 25 a 33 (R$)</th>
                      <th>Valor 33 acima (R$)</th>
                      <th>Valor Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
  {Array.isArray(inventarios) &&
    inventarios.map((inventario) => (
      <tr key={inventario.id}>
        <td>
          <input
            type="checkbox"
            checked={selectedInventarios.includes(inventario.id)}
            onChange={() => handleSelectInventario(inventario.id)}
          />
        </td>
        <td>{inventario.numero_inventario}</td>
        <td>{formatDate(inventario.data)}</td> {/* Formatar a data aqui */}
        <td>{inventario.quantidade_amostras}</td>
        <td>{inventario.quantidade_arvores}</td>
        <td>{inventario.peso_kg_m3}</td>
        <td>{inventario.diametro_medio}</td>
        <td>{inventario.altura_media}</td>
        <td>{inventario.volume_total_m3}</td>
        <td>{inventario.volume_total_ton}</td>
        <td>{inventario.volume_lenha}</td>
        <td>{inventario.volume_15_a_20}</td>
        <td>{inventario.volume_20_a_25}</td>
        <td>{inventario.volume_25_a_33}</td>
        <td>{inventario.volume_33_acima}</td>
        <td>{inventario.valor_lenha}</td>
        <td>{inventario.valor_15_a_20}</td>
        <td>{inventario.valor_20_a_25}</td>
        <td>{inventario.valor_25_a_33}</td>
        <td>{inventario.valor_33_acima}</td>
        <td>{inventario.valor_total}</td>
      </tr>
    ))}
</tbody>
                </table>
                <button
                  className="customModalInventory-btn customModalInventory-btn-primary"
                  onClick={generateReport}
                >
                  Gerar Relatório
                </button>
              </>
            )}
          </div>
          <div className="customModalInventory-actions">
            <button
              className="customModalInventory-btn customModalInventory-btn-success"
              onClick={handleSave}
            >
              Salvar
            </button>
            <button
              className="customModalInventory-btn customModalInventory-btn-danger"
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </>
    );
  };

  export default InventoryModal;
import React, { useState, useEffect, useCallback } from "react";
import "./InventoryModal.css"; // O CSS não precisa de alterações
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from '../../img/logo.png';
import { API_BASE_URL } from "../../config";

const initialInventoryState = {
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
    valorTotal: "", // Este será calculado automaticamente
};

const InventoryModal = ({ isOpen, onClose, imovelId }) => {
    const [inventoryData, setInventoryData] = useState(initialInventoryState);
    const [inventarios, setInventarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [selectedInventarios, setSelectedInventarios] = useState([]);

    // --- NOVO: Efeito para calcular o valor total automaticamente ---
    useEffect(() => {
        const {
            valorLenha,
            valor15a20,
            valor20a25,
            valor25a33,
            valor33Acima,
        } = inventoryData;

        // Converte os valores para número, tratando strings vazias como 0
        const total =
            (parseFloat(valorLenha) || 0) +
            (parseFloat(valor15a20) || 0) +
            (parseFloat(valor20a25) || 0) +
            (parseFloat(valor25a33) || 0) +
            (parseFloat(valor33Acima) || 0);

        // Atualiza o estado apenas se o total calculado for diferente do atual
        // toFixed(2) para garantir consistência com duas casas decimais
        if (total.toFixed(2) !== parseFloat(inventoryData.valorTotal).toFixed(2)) {
             setInventoryData(prevData => ({ ...prevData, valorTotal: total.toFixed(2) }));
        }

    }, [
        inventoryData.valorLenha,
        inventoryData.valor15a20,
        inventoryData.valor20a25,
        inventoryData.valor25a33,
        inventoryData.valor33Acima,
        inventoryData.valorTotal, // Adicionado para evitar stale state
    ]);
    
    const fetchInventarios = useCallback(async () => {
    if (!imovelId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/inventario`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // A linha da correção:
          'Authorization': 'Basic my-simple-token'
        }
      });

      // A sua lógica de tratamento de erro já era ótima, então a mantemos.
      if (!response.ok) {
        // Se a resposta for 404 (Nenhum inventário), não trata como um erro,
        // mas garante que a lista fique vazia.
        if (response.status === 404) {
          setInventarios([]);
        } else {
          throw new Error("Falha ao carregar os inventários. Tente novamente mais tarde.");
        }
      } else {
        const data = await response.json();
        setInventarios(Array.isArray(data) ? data : []);
      }

    } catch (err) {
      setError(err.message);
      setInventarios([]);
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

    useEffect(() => {
        if (isOpen) {
            fetchInventarios();
        } else {
            setInventoryData(initialInventoryState);
            setSelectedInventarios([]);
            setInventarios([]);
            setError(null);
            setLoading(true);
        }
    }, [isOpen, fetchInventarios]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInventoryData(prev => ({ ...prev, [name]: value }));
    };

    
const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
        const response = await fetch(`${API_BASE_URL}/api/imoveis/${imovelId}/inventario`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // A linha da correção:
                "Authorization": "Basic my-simple-token"
            },
            body: JSON.stringify(inventoryData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Evita erro se a resposta não for JSON
            throw new Error(errorData.error || "Não foi possível salvar. Verifique os dados.");
        }
        
        setInventoryData(initialInventoryState);
        await fetchInventarios(); // Recarrega a lista de inventários

    } catch (err) {
        setError(err.message);
    } finally {
        setIsSaving(false);
    }
};
    const handleSelectInventario = (id) => {
        setSelectedInventarios(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString("pt-BR");
    };

    const generateReport = () => {
        const selectedData = inventarios.filter(inv => selectedInventarios.includes(inv.id));
        if (selectedData.length === 0) {
            alert("Por favor, selecione pelo menos um inventário para gerar o relatório.");
            return;
        }

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.addImage(logo, 'PNG', (pageWidth / 2) - 25, 10, 50, 20);
        doc.setFontSize(16);
        doc.text("Relatório de Inventários", pageWidth / 2, 40, { align: "center" });

        const head = [
            ["Número", "Data", "Amostras", "Árvores", "Peso (kg/m³)", "Ø Médio", "Altura Média", "Vol Total (m³)", "Vol Total (TON)", "Valor Total (R$)"],
        ];
        const body = selectedData.map(inv => [
            inv.numero_inventario, formatDate(inv.data), inv.quantidade_amostras, inv.quantidade_arvores, inv.peso_kg_m3, inv.diametro_medio, inv.altura_media, inv.volume_total_m3, inv.volume_total_ton, parseFloat(inv.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]);

        doc.autoTable({
            head, body, startY: 50, theme: "grid",
            headStyles: { fillColor: [22, 160, 133], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 9: { halign: 'right' } }
        });
        
        doc.save("relatorio_inventarios.pdf");
    };

    if (!isOpen) return null;

    return (
        <div className="inventory-modal-overlay" onClick={onClose}>
            <div className="inventory-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="inventory-modal-header">
                    <h2 className="inventory-modal-title">Inventário do Imóvel</h2>
                    <button className="inventory-modal-close-btn" onClick={onClose}>&times;</button>
                </header>

                <main className="inventory-modal-body">
                    <div className="inventory-form-section">
                        <h3 className="inventory-section-title">Cadastrar Novo Inventário</h3>
                        <div className="inventory-form-grid">
                            {Object.entries(initialInventoryState).map(([key, _]) => (
                                <div className="inventory-input-group" key={key}>
                                    <label className="inventory-form-label" htmlFor={key}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                    <input
                                        id={key}
                                        type={key === 'data' ? 'date' : 'number'}
                                        name={key}
                                        value={inventoryData[key]}
                                        onChange={handleInputChange}
                                        className="inventory-form-input"
                                        step="0.01"
                                        // --- MUDANÇA: Campo "valorTotal" se torna somente leitura ---
                                        readOnly={key === 'valorTotal'}
                                        style={key === 'valorTotal' ? { backgroundColor: '#e9ecef', fontWeight: 'bold' } : {}}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="inventory-form-actions">
                            <button onClick={handleSave} className="modal-btn modal-btn-success" disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Inventário"}
                            </button>
                        </div>
                         {error && <p className="inventory-error-message">{error}</p>}
                    </div>

                    <div className="inventory-divider"></div>
                    
                    <div className="inventory-table-section">
                        <h3 className="inventory-section-title">Inventários Cadastrados</h3>
                        {loading ? (
                            <p>Carregando...</p>
                        ) : inventarios.length === 0 ? (
                            <p>Nenhum inventário encontrado para este imóvel.</p>
                        ) : (
                            <div className="inventory-table-responsive">
                                <table className="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Sel.</th>
                                            <th>Número</th>
                                            <th>Data</th>
                                            <th>Qtd Amostras</th>
                                            <th>Qtd Árvores</th>
                                            <th>Peso (kg/m³)</th>
                                            <th>Ø Médio</th>
                                            <th>Altura Média</th>
                                            <th>Vol. Total (m³)</th>
                                            <th>Vol. Total (TON)</th>
                                            <th>Vol. Lenha</th>
                                            <th>Vol. 15-20</th>
                                            <th>Vol. 20-25</th>
                                            <th>Vol. 25-33</th>
                                            <th>Vol. 33</th>
                                            <th>Valor Lenha</th>
                                            <th>Valor 15-20</th>
                                            <th>Valor 20-25</th>
                                            <th>Valor 25-33</th>
                                            <th>Valor +33</th>
                                            <th>Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventarios.map((inv) => (
                                            <tr key={inv.id}>
                                                <td><input type="checkbox" checked={selectedInventarios.includes(inv.id)} onChange={() => handleSelectInventario(inv.id)} /></td>
                                                <td>{inv.numero_inventario}</td>
                                                <td>{formatDate(inv.data)}</td>
                                                <td>{inv.quantidade_amostras}</td>
                                                <td>{inv.quantidade_arvores}</td>
                                                <td>{inv.peso_kg_m3}</td>
                                                <td>{inv.diametro_medio}</td>
                                                <td>{inv.altura_media}</td>
                                                <td>{inv.volume_total_m3}</td>
                                                <td>{inv.volume_total_ton}</td>
                                                <td>{inv.volume_lenha}</td>
                                                <td>{inv.volume_15_a_20}</td>
                                                <td>{inv.volume_20_a_25}</td>
                                                <td>{inv.volume_25_a_33}</td>
                                                <td>{inv.volume_33_acima}</td>
                                                <td>{parseFloat(inv.valor_lenha || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{parseFloat(inv.valor_15_a_20 || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{parseFloat(inv.valor_20_a_25 || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{parseFloat(inv.valor_25_a_33 || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{parseFloat(inv.valor_33_acima || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td>{parseFloat(inv.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>

                <footer className="inventory-modal-footer">
                    <button className="modal-btn modal-btn-cancel" onClick={onClose}>Fechar</button>
                    <button className="modal-btn modal-btn-success" onClick={generateReport} disabled={selectedInventarios.length === 0}>
                        Gerar Relatório
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default InventoryModal;
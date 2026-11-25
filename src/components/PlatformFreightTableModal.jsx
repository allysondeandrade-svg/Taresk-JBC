import React from 'react';
import { X, Table, Truck } from 'lucide-react';

export default function PlatformFreightTableModal({ isOpen, onClose, platformKey }) {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (platformKey) {
      case 'mercadoLivre':
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                Regras de Frete e Tarifas — Mercado Livre
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Cruzamento oficial de <b>Peso (Real ou Cubado)</b> com as <b>Faixas de Preço de Venda</b>:
              </p>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '420px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#fef08a', color: '#854d0e', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '8px 10px', border: '1px solid #fde047', textAlign: 'left', whiteSpace: 'nowrap' }}>Peso Máx</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>Até R$ 19*</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 19 a 49</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 49 a 79</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 79 a 100</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 100 a 120</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 120 a 150</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>R$ 150 a 200</th>
                    <th style={{ padding: '8px 8px', border: '1px solid #fde047', whiteSpace: 'nowrap' }}>Acima de 200</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { weight: '300 g', fees: ['R$ 5,65', 'R$ 6,85', 'R$ 8,15', 'R$ 12,95', 'R$ 14,95', 'R$ 16,95', 'R$ 19,05', 'R$ 21,65'] },
                    { weight: '500 g', fees: ['R$ 5,95', 'R$ 6,95', 'R$ 8,25', 'R$ 13,85', 'R$ 16,15', 'R$ 18,15', 'R$ 20,45', 'R$ 23,25'] },
                    { weight: '1,0 kg', fees: ['R$ 6,05', 'R$ 7,15', 'R$ 8,45', 'R$ 14,45', 'R$ 16,85', 'R$ 19,05', 'R$ 21,35', 'R$ 24,45'] },
                    { weight: '1,5 kg', fees: ['R$ 6,15', 'R$ 7,35', 'R$ 8,65', 'R$ 14,75', 'R$ 17,15', 'R$ 19,45', 'R$ 21,75', 'R$ 25,45'] },
                    { weight: '2,0 kg', fees: ['R$ 6,25', 'R$ 7,45', 'R$ 8,75', 'R$ 15,05', 'R$ 17,65', 'R$ 19,85', 'R$ 22,25', 'R$ 25,55'] },
                    { weight: '3,0 kg', fees: ['R$ 6,35', 'R$ 8,65', 'R$ 9,15', 'R$ 16,45', 'R$ 19,15', 'R$ 21,65', 'R$ 24,35', 'R$ 27,05'] },
                    { weight: '4,0 kg', fees: ['R$ 6,45', 'R$ 8,75', 'R$ 9,75', 'R$ 17,85', 'R$ 20,75', 'R$ 23,35', 'R$ 26,35', 'R$ 29,25'] },
                    { weight: '5,0 kg', fees: ['R$ 6,55', 'R$ 8,85', 'R$ 10,25', 'R$ 19,75', 'R$ 22,85', 'R$ 26,05', 'R$ 29,25', 'R$ 32,45'] },
                    { weight: '6,0 kg', fees: ['R$ 6,65', 'R$ 8,95', 'R$ 10,35', 'R$ 25,95', 'R$ 29,15', 'R$ 33,35', 'R$ 36,45', 'R$ 40,85'] },
                    { weight: '7,0 kg', fees: ['R$ 6,75', 'R$ 9,05', 'R$ 10,45', 'R$ 27,55', 'R$ 31,65', 'R$ 36,75', 'R$ 40,85', 'R$ 45,25'] },
                    { weight: '8,0 kg', fees: ['R$ 6,85', 'R$ 9,25', 'R$ 10,55', 'R$ 29,45', 'R$ 34,35', 'R$ 39,25', 'R$ 44,15', 'R$ 49,35'] },
                    { weight: '9,0 kg', fees: ['R$ 6,95', 'R$ 9,35', 'R$ 10,65', 'R$ 30,25', 'R$ 35,25', 'R$ 40,35', 'R$ 45,35', 'R$ 50,75'] },
                    { weight: '10,0 kg', fees: ['R$ 7,05', 'R$ 9,45', 'R$ 10,85', 'R$ 38,25', 'R$ 45,05', 'R$ 51,95', 'R$ 58,75', 'R$ 65,85'] },
                    { weight: '15,0 kg', fees: ['R$ 7,25', 'R$ 10,25', 'R$ 11,65', 'R$ 45,55', 'R$ 52,95', 'R$ 60,55', 'R$ 68,15', 'R$ 75,65'] },
                    { weight: '20,0 kg', fees: ['R$ 7,45', 'R$ 10,65', 'R$ 12,05', 'R$ 55,15', 'R$ 64,35', 'R$ 73,55', 'R$ 82,75', 'R$ 91,95'] },
                    { weight: '30,0 kg', fees: ['R$ 7,75', 'R$ 11,25', 'R$ 12,45', 'R$ 66,45', 'R$ 76,05', 'R$ 86,25', 'R$ 97,15', 'R$ 107,85'] }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fefce8' }}>
                      <td style={{ padding: '6px 10px', fontWeight: '700', border: '1px solid #e2e8f0', textAlign: 'left', whiteSpace: 'nowrap' }}>{row.weight}</td>
                      {row.fees.map((fee, fIdx) => (
                        <td key={fIdx} style={{ padding: '6px 8px', border: '1px solid #e2e8f0', color: '#334155', whiteSpace: 'nowrap' }}>{fee}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b' }}>
              *Para produtos com preço inferior a R$ 19,00, o frete máximo cobrado é limitado a 50% do valor do produto.
            </p>
          </div>
        );

      case 'shopee':
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                Regras de Tarifas e Fretes — Shopee
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Estrutura de comissão e tarifa fixa cobrada por unidade vendida:
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#ffedd5', color: '#9a3412', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #fdba74', whiteSpace: 'nowrap' }}>Faixa de Preço</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #fdba74', whiteSpace: 'nowrap' }}>Comissão %</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #fdba74', whiteSpace: 'nowrap' }}>Tarifa Fixa</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #fdba74', whiteSpace: 'nowrap' }}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Até R$ 79,99</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c', fontWeight: '800', whiteSpace: 'nowrap' }}>20,0%</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 4,50</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Envio padrão</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff7ed' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 80,00 a R$ 99,99</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c', fontWeight: '800', whiteSpace: 'nowrap' }}>14,0%</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 16,00</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Frete grátis subsidiado</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 100,00 a R$ 199,99</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c', fontWeight: '800', whiteSpace: 'nowrap' }}>14,0%</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 20,00</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Frete grátis subsidiado</td>
                  </tr>
                  <tr style={{ background: '#fff7ed' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Acima de R$ 200,00</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c', fontWeight: '800', whiteSpace: 'nowrap' }}>14,0%</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 26,00</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Frete grátis subsidiado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'amazon':
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                Regras de Frete DBA — Amazon
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Tarifa padrão de <b>12,5%</b> de comissão + tabela de frete DBA:
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Faixa de Preço</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Tarifa Fixa / Frete</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Regra de Cálculo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Até R$ 29,99</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 4,50</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Fixo por item</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 30,00 a R$ 49,99</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 6,50</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Fixo por item</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 50,00 a R$ 78,99</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 6,75</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Fixo por item</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>A partir de R$ 79,00</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Tabela DBA por Peso</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>De R$ 11,95 até R$ 59,95+ conforme peso cubado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'magalu':
        return (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                Regras de Frete — Magalu (Luiza Envios)
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Tarifa padrão de <b>18,0%</b> de comissão + taxas de envio:
              </p>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: '#e0f2fe', color: '#0369a1', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>Faixa de Preço</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>Custo de Frete</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Abaixo de R$ 79,00</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 3,00</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Taxa fixa por item</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f0f9ff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>R$ 79,00 a R$ 199,00</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>De R$ 17,95 a R$ 117,95</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Tabela intermediária por peso</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>Acima de R$ 199,00</td>
                    <td style={{ padding: '10px 14px', fontWeight: '700', whiteSpace: 'nowrap' }}>De R$ 19,45 a R$ 127,45</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>Tabela superior por peso</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Table size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Tabela de Fretes e Tarifas
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Regras oficiais aplicadas automaticamente na precificadora
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {renderContent()}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#f8fafc'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { Award, CheckCircle2, Sparkles, Star, Flame, ArrowRight, X } from 'lucide-react';

export default function DopamineCelebrationModal({
  isOpen,
  onClose,
  taskTitle = 'Tarefa',
  assigneeName = 'Colaborador'
}) {
  if (!isOpen) return null;

  // Efeito sonoro sutil via Web Audio API (opcional, sintetizador puro e limpo)
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.35); // C6
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // Navegadores sem suporte a áudio continuam normalmente
    }
  }, [isOpen]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf4ff 50%, #faf5ff 100%)',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 60px -15px rgba(108, 92, 231, 0.5), 0 0 40px rgba(245, 158, 11, 0.2)',
        border: '3px solid #facc15',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        animation: 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        overflow: 'hidden'
      }}>
        {/* Confetes animados em CSS puro flutuando */}
        <div style={{ position: 'absolute', top: '15px', left: '20px', fontSize: '24px' }}>✨</div>
        <div style={{ position: 'absolute', top: '25px', right: '35px', fontSize: '28px' }}>🎉</div>
        <div style={{ position: 'absolute', bottom: '25px', left: '25px', fontSize: '24px' }}>🚀</div>
        <div style={{ position: 'absolute', bottom: '20px', right: '25px', fontSize: '28px' }}>⚡</div>

        {/* Botão Fechar no Topo */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {/* Emblema Dopaminérgico Central com Troféu e Chamas */}
        <div style={{
          width: '104px',
          height: '104px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 30px -5px rgba(245, 158, 11, 0.6), inset 0 2px 4px rgba(255,255,255,0.8)',
          border: '4px solid #ffffff'
        }}>
          <span style={{ fontSize: '50px', transform: 'scale(1.1)' }}>🏆</span>
        </div>

        {/* Badge de Recompensa */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#fef3c7',
          color: '#92400e',
          padding: '6px 16px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '16px',
          border: '1.5px solid #fde68a'
        }}>
          <Flame size={16} color="#d97706" /> +100 XP • TAREFA ENTREGUE!
        </div>

        {/* Título Celebratório */}
        <h2 style={{
          fontSize: '28px',
          fontWeight: '900',
          color: '#1e1b4b',
          letterSpacing: '-0.5px',
          marginBottom: '8px'
        }}>
          Sensacional, Parabéns!
        </h2>

        {/* Descrição com o nome do produto */}
        <p style={{
          fontSize: '15px',
          color: '#475569',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          A tarefa <strong style={{ color: '#0f172a' }}>"{taskTitle}"</strong> foi totalmente concluída e catalogada com sucesso em todos os marketplaces!
        </p>

        {/* Mini Card de Métricas de Conquista */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '28px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>FOTOS IA</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>100%</div>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>CANAIS</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#5925dc' }}>4/4 Prontos</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>STATUS</div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#f59e0b' }}>FINALIZADA</div>
          </div>
        </div>

        {/* Botão de Fechar / Continuar Produzindo */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #5925dc 0%, #4338ca 100%)',
            color: '#ffffff',
            fontSize: '17px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 10px 25px -5px rgba(89, 37, 220, 0.5)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>Bora pra próxima!</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

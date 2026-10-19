import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, UserCheck, AlertCircle, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen({ onLogin, users, onOpenSettings, isSyncing, onSync }) {
  const [email, setEmail] = useState('eletrojbc@gmail.com');
  const [password, setPassword] = useState('Jbc29378125@');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.password === password
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        setLoading(false);
      }
    }, 300);
  };

  const handleQuickLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Botão de Configurações da Planilha no topo */}
      {onOpenSettings && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
          {onSync && (
            <button
              onClick={onSync}
              title="Sincronizar dados da Planilha"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? 'Sincronizando...' : 'Planilha'}</span>
            </button>
          )}
          <button
            onClick={onOpenSettings}
            title="Configurações (Conectar Planilha)"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -10px rgba(108, 92, 231, 0.15), 0 1px 3px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '460px',
        padding: '44px 36px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {/* Ícone de Avatar Circular idêntico ao Mockup da Página 1 do PDF */}
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          border: '3px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          background: '#ffffff',
          position: 'relative',
          boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#334155',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '6px',
          letterSpacing: '-0.5px'
        }}>
          Taresk
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#64748b',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Painel de Gestão e Marketplaces • JBC Eletro
        </p>

        {error && (
          <div style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#dc2626',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Campo E-mail / Usuário em formato de cápsula arredondada fiel ao mockup */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '15px 22px 15px 44px',
                borderRadius: '9999px',
                border: '2px solid #334155',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1e293b',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
            <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Campo Senha em formato de cápsula arredondada com botão de Olho */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '15px 50px 15px 44px',
                borderRadius: '9999px',
                border: '2px solid #334155',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1e293b',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
            <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2px',
            marginBottom: '4px'
          }}>
            <a
              href="#recuperar"
              onClick={(e) => { e.preventDefault(); alert('Dica: Use eletrojbc@gmail.com / Jbc29378125@ para Login Master Premium.'); }}
              style={{
                color: '#64748b',
                fontSize: '13px',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Forgot Password?
            </a>
          </div>

          {/* Botão Roxo Vibrante com cantos arredondados do Mockup da Página 1 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '9999px',
              backgroundColor: '#5925dc', // Roxo vibrante como na imagem
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 20px -5px rgba(89, 37, 220, 0.45)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Login'}
          </button>
        </form>

        {/* Atalhos de Demonstração / Alternância Rápida de Usuários */}
        <div style={{
          width: '100%',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px dashed #e2e8f0'
        }}>
          <p style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Acesso Rápido para Testes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: u.role === 'premium_admin' ? '#f5f3ff' : '#f8fafc',
                  border: u.role === 'premium_admin' ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{u.avatar}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {u.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: u.role === 'premium_admin' ? '#7c3aed' : '#e2e8f0',
                    color: u.role === 'premium_admin' ? '#ffffff' : '#475569'
                  }}>
                    {u.role === 'premium_admin' ? '👑 Premium' : 'Colaborador'}
                  </span>
                  <ArrowRight size={14} color="#94a3b8" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

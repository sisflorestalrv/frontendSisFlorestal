import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import logo from '../../img/logo.png';
// Adicionamos um ícone de alerta para o card de erro
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL } from "../../config";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // NOVO: Um estado para erros de validação (campos) e outro para erro do servidor
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // NOVO: Função de validação
  const validateFields = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'O campo de usuário é obrigatório.';
    }
    if (!password) {
      errors.password = 'O campo de senha é obrigatório.';
    }
    return errors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    // Limpa os erros antigos
    setServerError('');
    setValidationErrors({});
    
    // Roda a validação primeiro
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return; // Impede o envio do formulário se houver erros
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
      onLoginSuccess();
      navigate('/');
    } catch (err) {
      // Define apenas o erro vindo do servidor
      setServerError(err.response?.data?.error || 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1 className="login-title">Bem-vindo de volta!</h1>
        <p className="login-subtitle">Entre com suas credenciais para continuar</p>
        
        <form onSubmit={handleLogin} noValidate>
          {/* NOVO: O card de erro do servidor agora é mais bonito */}
          {serverError && (
            <div className="server-error-card">
              <FaExclamationTriangle className="error-card-icon" />
              <p>{serverError}</p>
            </div>
          )}

          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              // NOVO: Classe de erro é aplicada dinamicamente
              className={`login-input ${validationErrors.username ? 'input-error' : ''}`}
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {/* NOVO: Mensagem de erro específica para o campo */}
            {validationErrors.username && <p className="field-error-text">{validationErrors.username}</p>}
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              className={`login-input ${validationErrors.password ? 'input-error' : ''}`}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={togglePasswordVisibility} className="password-toggle-icon">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            {validationErrors.password && <p className="field-error-text">{validationErrors.password}</p>}
          </div>
          
          <button type="submit" className="login-button">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
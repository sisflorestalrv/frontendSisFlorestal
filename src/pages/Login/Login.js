import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Certifique-se de importar o CSS aqui
import logo from '../../img/logo.png';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      onLoginSuccess(); // Atualiza o estado de autenticação
      navigate('/'); // Redireciona para a página inicial após o login
    } catch (err) {
      // Exibe a mensagem de erro sem o alert, apenas no estado
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo do projeto */}
        <img src={logo} alt="Logo do Projeto" className="login-logo" />

        <h1 className="login-title">Login</h1>
        <form onSubmit={handleLogin}>
          <div className="login-input-group">
            <label className="login-label">Usuário</label>
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="login-input-group">
            <label className="login-label">Senha</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="login-button">Entrar</button>
          {/* Exibindo o erro de login sem usar o alert */}
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;

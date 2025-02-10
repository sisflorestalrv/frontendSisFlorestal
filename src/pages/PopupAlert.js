import React from 'react';

const PopupAlert = ({ message, onClose, type }) => {
  const popupStyles = {
    backgroundColor: type === 'success' ? '#28a745' : '#dc3545', // verde para sucesso, vermelho para erro
    color: 'white',
    padding: '15px',
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    width: '300px',
  };

  return (
    <div style={popupStyles}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px' }}>
        X
      </button>
    </div>
  );
};

export default PopupAlert;

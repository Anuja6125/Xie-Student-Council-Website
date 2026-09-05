import React from 'react';
import { useNavigate } from 'react-router-dom';

const WaitingRoom = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ fontSize: '60px', marginBottom: '20px' }}>⏳</div>
      <h1 style={{ color: '#333' }}>Verification Successful!</h1>
      <p style={{ fontSize: '18px', color: '#666', maxWidth: '500px', lineHeight: '1.6' }}>
        Your request to become a <strong>Council Admin</strong> has been received. 
        To maintain security, a faculty member must review your ID Card before your account is activated.
      </p>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '8px',
        color: '#0056b3'
      }}>
        <strong>What’s next?</strong> You will receive an email notification once a teacher approves your access.
      </div>

      <button 
        onClick={() => navigate('/login')}
        style={{
          marginTop: '40px',
          padding: '10px 25px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Back to Login
      </button>
    </div>
  );
};

export default WaitingRoom;
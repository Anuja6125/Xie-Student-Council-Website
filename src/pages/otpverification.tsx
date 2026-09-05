import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email passed from Signup page

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/verify-otp', { email, otp });
      
      if (response.data.role === 'student') {
        alert("Verification Successful! Please Login.");
        navigate('/login');
      } else {
        alert("Verified! Please wait for Teacher Approval.");
        navigate('/waiting-room'); 
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Verify Your Email</h2>
      <p>Enter the 6-digit code sent to <b>{email}</b></p>
      
      <form onSubmit={handleVerify}>
        <input 
          type="text" 
          maxLength={6} 
          value={otp} 
          onChange={(e) => setOtp(e.target.value)}
          placeholder="000000"
          style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center', padding: '10px' }}
          required
        />
        <br /><br />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
};

export default OTPVerification;
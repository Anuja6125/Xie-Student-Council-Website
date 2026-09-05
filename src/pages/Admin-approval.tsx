import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface PendingRequest {
  _id: string;
  name: string;
  email: string;
  dept: string;
  councilDept: string;
  councilRole: string;
  idCard: { url: string };
}

const AdminApproval = () => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const navigate = useNavigate();
  const teacherName = "Prof. Smith";

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/pending-requests');
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);
   

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await axios.post(`http://localhost:5000/api/admin/${action}/${id}`, { teacherName });
      alert(`Admin ${action}d successfully`);
      fetchRequests(); 
    } catch (err) {
      alert("Action failed");
    }
  };
 
  return (
    <div style={{ padding: '20px' }}>
      <h1>Pending Admin Approvals</h1>
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Name</th>
            <th>Dept</th>
            <th>Council Dept</th>
            <th>Role</th>
            <th>ID Card</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req._id}>
              <td>{req.name}</td>
              <td>{req.dept}</td>
              <td>{req.councilDept}</td>
              <td>{req.councilRole}</td>
              <td>
                <a href={req.idCard.url} target="_blank" rel="noreferrer">View PDF</a>
              </td>
              <td>
                <button 
                  onClick={() => handleAction(req._id, 'approve')} 
                  style={{ backgroundColor: 'green', color: 'white', marginRight: '5px' }}
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleAction(req._id, 'reject')} 
                  style={{ backgroundColor: 'red', color: 'white' }}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <p>No pending requests.</p>}
    </div>
  );
};

export default AdminApproval;
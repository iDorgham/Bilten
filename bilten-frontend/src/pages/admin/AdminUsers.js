import React from 'react';

const AdminUsers = () => {
  console.log('AdminUsers component is rendering!');
  
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎉 ADMIN USERS PAGE IS WORKING! 🎉
        </h1>
        <p className="text-xl text-green-400 mb-4">
          If you can see this, the AdminUsers component is rendering correctly!
        </p>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Admin Users Test</h2>
          <p>This is a test to verify the admin users page is working.</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

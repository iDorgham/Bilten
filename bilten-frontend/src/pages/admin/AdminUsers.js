import React from 'react';

const AdminUsers = () => {
  console.log('AdminUsers component is rendering!');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">
          🎉 ADMIN USERS PAGE IS WORKING! 🎉
        </h1>
        <p className="text-xl text-green-500 mb-4">
          If you can see this, the AdminUsers component is rendering correctly!
        </p>
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Admin Users Test</h2>
          <p>This is a test to verify the admin users page is working.</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

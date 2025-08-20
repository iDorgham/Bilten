import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  console.log('AdminDashboard component is rendering!');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">
          🎉 ADMIN DASHBOARD IS WORKING! 🎉
        </h1>
        <p className="text-xl text-green-500 mb-4">
          If you can see this, the component is rendering correctly!
        </p>
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Test Content</h2>
          <p>This is a test to verify the admin dashboard is working.</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};



export default AdminDashboard;

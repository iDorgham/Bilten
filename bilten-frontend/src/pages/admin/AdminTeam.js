import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminTheme } from '../../context/AdminThemeContext';
import {
  UserGroupIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  EyeIcon,
  KeyIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const AdminTeam = () => {
  const { t } = useLanguage();
  const { currentTheme, isDark } = useAdminTheme();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/v1/admin/team', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const response = await fetch('/api/v1/admin/team', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(memberData)
      });
      
      if (response.ok) {
        fetchTeamMembers();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    try {
      const response = await fetch(`/api/v1/admin/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        fetchTeamMembers();
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        const response = await fetch(`/api/v1/admin/team/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          fetchTeamMembers();
        }
      } catch (error) {
        console.error('Error removing team member:', error);
      }
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
      moderator: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      support: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400'
    };
    return badges[role] || badges.support;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
    };
    return badges[status] || badges.inactive;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className={`h-8 rounded w-1/4 mb-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-32 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
          <div className={`h-64 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${currentTheme.colors.textPrimary} mb-2`}>
          Team Management
        </h1>
        <p className={`${currentTheme.colors.textMuted}`}>
          Manage admin team members, roles, and permissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 border ${currentTheme.colors.border} shadow-lg`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${currentTheme.colors.textMuted}`}>Total Members</p>
                <p className={`text-2xl font-bold ${currentTheme.colors.textPrimary}`}>{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 border ${currentTheme.colors.border} shadow-lg`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${currentTheme.colors.textMuted}`}>Active Members</p>
                <p className={`text-2xl font-bold ${currentTheme.colors.textPrimary}`}>
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 border ${currentTheme.colors.border} shadow-lg`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500">
                <KeyIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${currentTheme.colors.textMuted}`}>Super Admins</p>
                <p className={`text-2xl font-bold ${currentTheme.colors.textPrimary}`}>
                  {teamMembers.filter(m => m.role === 'super_admin').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl p-6 border ${currentTheme.colors.border} shadow-lg`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-500">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${currentTheme.colors.textMuted}`}>Recent Activity</p>
                <p className={`text-2xl font-bold ${currentTheme.colors.textPrimary}`}>12</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className={`${currentTheme.colors.surface} backdrop-blur-sm rounded-xl border ${currentTheme.colors.border} shadow-lg`}>
          <div className={`p-6 border-b ${currentTheme.colors.border}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${currentTheme.colors.textPrimary}`}>Team Members</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${currentTheme.colors.button}`}>
                <UserPlusIcon className="h-4 w-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${currentTheme.colors.border}`}>
              <thead className={`${currentTheme.colors.surface}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                    Member
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                    Role
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                    Last Active
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.colors.textMuted} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${currentTheme.colors.secondary} divide-y ${currentTheme.colors.border}`}>
                {teamMembers.map((member) => (
                  <tr key={member.id} className={`${currentTheme.colors.surfaceHover}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}>
                            <span className={`text-sm font-medium ${currentTheme.colors.textSecondary}`}>
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${currentTheme.colors.textPrimary}`}>
                            {member.first_name} {member.last_name}
                          </div>
                          <div className={`text-sm ${currentTheme.colors.textMuted}`}>
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${currentTheme.colors.textMuted}`}>
                      {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className={`${currentTheme.colors.info} hover:text-blue-900 dark:hover:text-blue-300`}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMember(member)}
                          className={`${currentTheme.colors.success} hover:text-green-900 dark:hover:text-green-300`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className={`${currentTheme.colors.error} hover:text-red-900 dark:hover:text-red-300`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <div className={`${currentTheme.colors.textMuted}`}>
                <UserGroupIcon className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No team members found</p>
                <p className="text-sm">Add your first team member to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.colors.secondary} rounded-xl p-6 w-full max-w-md`}>
              <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary} mb-4`}>Add Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg ${currentTheme.colors.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="member@example.com"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Role
                  </label>
                  <select className={`w-full px-3 py-2 border rounded-lg ${currentTheme.colors.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Permissions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className={`rounded ${currentTheme.colors.input} text-blue-600 focus:ring-blue-500`} />
                      <span className={`ml-2 text-sm ${currentTheme.colors.textSecondary}`}>User Management</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className={`rounded ${currentTheme.colors.input} text-blue-600 focus:ring-blue-500`} />
                      <span className={`ml-2 text-sm ${currentTheme.colors.textSecondary}`}>Content Moderation</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className={`rounded ${currentTheme.colors.input} text-blue-600 focus:ring-blue-500`} />
                      <span className={`ml-2 text-sm ${currentTheme.colors.textSecondary}`}>Analytics Access</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${currentTheme.colors.buttonSecondary}`}>
                  Cancel
                </button>
                <button
                  onClick={() => handleAddMember({})}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${currentTheme.colors.button}`}>
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.colors.secondary} rounded-xl p-6 w-full max-w-md`}>
              <h3 className={`text-lg font-semibold ${currentTheme.colors.textPrimary} mb-4`}>Edit Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={`${selectedMember.first_name} ${selectedMember.last_name}`}
                    className={`w-full px-3 py-2 border rounded-lg ${currentTheme.colors.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Role
                  </label>
                  <select 
                    defaultValue={selectedMember.role}
                    className={`w-full px-3 py-2 border rounded-lg ${currentTheme.colors.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.colors.textSecondary} mb-2`}>
                    Status
                  </label>
                  <select 
                    defaultValue={selectedMember.status}
                    className={`w-full px-3 py-2 border rounded-lg ${currentTheme.colors.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setSelectedMember(null)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${currentTheme.colors.buttonSecondary}`}>
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateMember(selectedMember.id, {})}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${currentTheme.colors.button}`}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminTeam;

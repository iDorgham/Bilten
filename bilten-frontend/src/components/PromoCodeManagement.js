import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_CONFIG } from '../config/api';

/**
 * PromoCodeManagement Component
 * Allows event organizers to create, view, edit, and manage discount codes
 */
const PromoCodeManagement = ({ eventId = null, onClose = null }) => {
  const { user, token } = useAuth();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumOrderAmount: '0',
    maximumDiscountAmount: '',
    maxUses: '',
    maxUsesPerUser: '1',
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: '',
    applicableEvents: eventId ? [eventId] : [],
    applicableTicketTypes: [],
    isActive: true
  });

  // Fetch promo codes on component mount
  useEffect(() => {
    fetchPromoCodes();
  }, [eventId]);

  /**
   * Fetch promo codes from API
   */
  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const url = eventId 
        ? `${API_CONFIG.BASE_URL}/promo-codes?eventId=${eventId}`
        : `${API_CONFIG.BASE_URL}/promo-codes`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setPromoCodes(result.data.promoCodes);
      } else {
        setError(result.message || 'Failed to fetch promo codes');
      }
    } catch (err) {
      setError('Failed to fetch promo codes');
      console.error('Error fetching promo codes:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Generate a random promo code
   */
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!formData.code.trim()) {
      errors.push('Promo code is required');
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      errors.push('Promo code must contain only uppercase letters and numbers');
    }

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      errors.push('Discount value must be greater than 0');
    }

    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      errors.push('Percentage discount cannot exceed 100%');
    }

    if (formData.maxUses && parseInt(formData.maxUses) <= 0) {
      errors.push('Max uses must be greater than 0');
    }

    if (formData.maxUsesPerUser && parseInt(formData.maxUsesPerUser) <= 0) {
      errors.push('Max uses per user must be greater than 0');
    }

    if (formData.validUntil && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      errors.push('Valid until date must be after valid from date');
    }

    return errors;
  };

  /**
   * Create or update promo code
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = editingCode 
        ? `${API_CONFIG.BASE_URL}/promo-codes/${editingCode.id}`
        : `${API_CONFIG.BASE_URL}/promo-codes`;
      
      const method = editingCode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
          maximumDiscountAmount: formData.maximumDiscountAmount ? parseFloat(formData.maximumDiscountAmount) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: parseInt(formData.maxUsesPerUser),
          applicableEvents: formData.applicableEvents.length > 0 ? formData.applicableEvents : null,
          applicableTicketTypes: formData.applicableTicketTypes.length > 0 ? formData.applicableTicketTypes : null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPromoCodes();
        resetForm();
        setShowCreateForm(false);
        setEditingCode(null);
      } else {
        setError(result.message || 'Failed to save promo code');
      }
    } catch (err) {
      setError('Failed to save promo code');
      console.error('Error saving promo code:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete promo code
   */
  const handleDelete = async (codeId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/promo-codes/${codeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPromoCodes();
      } else {
        setError(result.message || 'Failed to delete promo code');
      }
    } catch (err) {
      setError('Failed to delete promo code');
      console.error('Error deleting promo code:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Edit promo code
   */
  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || '',
      discountType: code.discount_type,
      discountValue: code.discount_value.toString(),
      minimumOrderAmount: code.minimum_order_amount.toString(),
      maximumDiscountAmount: code.maximum_discount_amount ? code.maximum_discount_amount.toString() : '',
      maxUses: code.max_uses ? code.max_uses.toString() : '',
      maxUsesPerUser: code.max_uses_per_user.toString(),
      validFrom: new Date(code.valid_from).toISOString().slice(0, 16),
      validUntil: code.valid_until ? new Date(code.valid_until).toISOString().slice(0, 16) : '',
      applicableEvents: code.applicable_events ? JSON.parse(code.applicable_events) : [],
      applicableTicketTypes: code.applicable_ticket_types ? JSON.parse(code.applicable_ticket_types) : [],
      isActive: code.is_active
    });
    setShowCreateForm(true);
  };

  /**
   * Reset form to default values
   */
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minimumOrderAmount: '0',
      maximumDiscountAmount: '',
      maxUses: '',
      maxUsesPerUser: '1',
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: '',
      applicableEvents: eventId ? [eventId] : [],
      applicableTicketTypes: [],
      isActive: true
    });
  };

  /**
   * Toggle promo code active status
   */
  const toggleActive = async (codeId, currentStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/promo-codes/${codeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPromoCodes();
      } else {
        setError(result.message || 'Failed to update promo code');
      }
    } catch (err) {
      setError('Failed to update promo code');
      console.error('Error updating promo code:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge for promo code
   */
  const getStatusBadge = (code) => {
    const now = new Date();
    const validFrom = new Date(code.valid_from);
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;

    if (!code.is_active) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inactive</span>;
    }

    if (now < validFrom) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
    }

    if (validUntil && now > validUntil) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>;
    }

    if (code.max_uses && code.used_count >= code.max_uses) {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Limit Reached</span>;
    }

    return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  /**
   * Format discount display
   */
  const formatDiscount = (code) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    }
    return `$${code.discount_value}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discount Code Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage discount codes for your events
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
              setEditingCode(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create New Code
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Promo Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., SUMMER2024"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Summer Sale"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for this discount code"
                />
              </div>

              {/* Discount Type and Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                />
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Order Amount
                </label>
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={formData.minimumOrderAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Maximum Discount Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum Discount Amount
                </label>
                <input
                  type="number"
                  name="maximumDiscountAmount"
                  value={formData.maximumDiscountAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="No limit"
                />
              </div>

              {/* Usage Limits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Uses
                </label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Uses Per User
                </label>
                <input
                  type="number"
                  name="maxUsesPerUser"
                  value={formData.maxUsesPerUser}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Validity Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valid From *
                </label>
                <input
                  type="datetime-local"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valid Until
                </label>
                <input
                  type="datetime-local"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCode(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingCode ? 'Update Code' : 'Create Code')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Existing Discount Codes
        </h3>
        
        {loading && !showCreateForm ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading promo codes...</p>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No discount codes found.</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Create your first discount code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {promoCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {code.code}
                      </div>
                      {code.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {code.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {code.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDiscount(code)}
                      </div>
                      {code.minimum_order_amount > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Min: ${code.minimum_order_amount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {code.used_count || 0}
                        {code.max_uses && ` / ${code.max_uses}`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {code.max_uses_per_user} per user
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(code)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(code)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(code.id, code.is_active)}
                          className={`${
                            code.is_active 
                              ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                        >
                          {code.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCodeManagement;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import exportService from '../services/exportService';
import { 
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon,
  CogIcon,
  ChartBarIcon,
  UsersIcon,
  TicketIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const DataExport = () => {
  const { user, isAdmin, isOrganizer } = useAuth();
  const [exportTypes, setExportTypes] = useState({});
  const [selectedType, setSelectedType] = useState('events');
  const [exportFormat, setExportFormat] = useState('csv');
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [includeRelations, setIncludeRelations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [scheduledExports, setScheduledExports] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('export');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Schedule export state
  const [scheduleConfig, setScheduleConfig] = useState({
    schedule: 'daily',
    emailRecipients: []
  });

  useEffect(() => {
    loadExportTypes();
    loadScheduledExports();
    loadExportHistory();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadPreview();
    }
  }, [selectedType, filters, dateRange]);

  const loadExportTypes = async () => {
    try {
      const types = await exportService.getExportTypes();
      setExportTypes(types);
    } catch (error) {
      setError('Failed to load export types');
    }
  };

  const loadScheduledExports = async () => {
    if (!isAdmin) return;
    
    try {
      const scheduled = await exportService.getScheduledExports();
      setScheduledExports(scheduled || []);
    } catch (error) {
      console.error('Failed to load scheduled exports:', error);
    }
  };

  const loadExportHistory = async () => {
    try {
      const history = await exportService.getExportHistory();
      setExportHistory(history || []);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const loadPreview = async () => {
    try {
      const preview = await exportService.getExportPreview(selectedType, filters, dateRange);
      setPreviewData(preview);
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const config = {
        type: selectedType,
        format: exportFormat,
        filters,
        dateRange: {
          startDate: new Date(dateRange.startDate).toISOString(),
          endDate: new Date(dateRange.endDate).toISOString()
        },
        includeRelations
      };

      const errors = exportService.validateExportConfig(config);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      await exportService.exportData(config);
      setSuccess('Export completed successfully!');
      loadExportHistory();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExport = async () => {
    if (!isAdmin) return;

    try {
      const config = {
        type: selectedType,
        format: exportFormat,
        schedule: scheduleConfig.schedule,
        filters,
        dateRange: {
          startDate: new Date(dateRange.startDate).toISOString(),
          endDate: new Date(dateRange.endDate).toISOString()
        },
        includeRelations,
        emailRecipients: scheduleConfig.emailRecipients
      };

      await exportService.scheduleExport(config);
      setSuccess('Export scheduled successfully!');
      loadScheduledExports();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancelScheduled = async (exportId) => {
    try {
      await exportService.cancelScheduledExport(exportId);
      setSuccess('Scheduled export cancelled successfully!');
      loadScheduledExports();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDateRangePreset = (preset) => {
    const presets = exportService.getDateRangePresets();
    const selectedPreset = presets[preset];
    if (selectedPreset) {
      setDateRange({
        startDate: new Date(selectedPreset.startDate).toISOString().split('T')[0],
        endDate: new Date(selectedPreset.endDate).toISOString().split('T')[0]
      });
    }
  };

  const getExportTypeIcon = (type) => {
    const icons = {
      events: ChartBarIcon,
      users: UsersIcon,
      orders: DocumentTextIcon,
      tickets: TicketIcon,
      financial: CurrencyDollarIcon,
      analytics: ChartBarIcon,
      tracking: ClockIcon
    };
    return icons[type] || DocumentTextIcon;
  };

  const renderExportTypeCard = (type, metadata) => {
    const Icon = getExportTypeIcon(type);
    const isSelected = selectedType === type;

    return (
      <div
        key={type}
        onClick={() => setSelectedType(type)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
          <div>
            <h3 className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
              {metadata.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {metadata.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewTable = () => {
    if (!previewData || !previewData.preview || previewData.preview.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available for preview
        </div>
      );
    }

    const headers = Object.keys(previewData.preview[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {previewData.preview.map((row, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    {String(row[header] || '').substring(0, 50)}
                    {String(row[header] || '').length > 50 ? '...' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-blue-900 dark:to-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Data Export Center
          </h1>
          <p className="text-gray-600 dark:text-gray-200 text-lg">
            Export your data for external analysis in multiple formats
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-green-700 dark:text-green-200">{success}</p>
              <button
                onClick={() => setSuccess('')}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/10 dark:bg-white/10 backdrop-blur-sm rounded-xl p-1">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'export'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-white'
              }`}
            >
              <DocumentArrowDownIcon className="w-5 h-5 inline mr-2" />
              Export Data
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-white'
                }`}
              >
                <ClockIcon className="w-5 h-5 inline mr-2" />
                Scheduled Exports
              </button>
            )}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-white'
              }`}
            >
              <EyeIcon className="w-5 h-5 inline mr-2" />
              Export History
            </button>
          </div>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Export Configuration */}
            <div className="lg:col-span-1 space-y-6">
              {/* Export Type Selection */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select Data Type
                </h3>
                <div className="space-y-3">
                  {Object.entries(exportTypes.typeMetadata || {}).map(([type, metadata]) =>
                    renderExportTypeCard(type, metadata)
                  )}
                </div>
              </div>

              {/* Export Settings */}
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/20 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Export Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Export Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Date Range Presets */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.keys(exportService.getDateRangePresets()).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleDateRangePreset(preset)}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Relations */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeRelations"
                      checked={includeRelations}
                      onChange={(e) => setIncludeRelations(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeRelations" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include related data
                    </label>
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExport}
                    disabled={loading}
                    className="w-full bg-white/10 dark:bg-white/20 backdrop-blur-md border border-white/20 dark:border-white/30 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 dark:hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-5 h-5 mr-3" />
                        Export Data
                      </>
                    )}
                  </button>

                  {/* Schedule Export (Admin only) */}
                  {isAdmin && (
                    <button
                      onClick={handleScheduleExport}
                      className="w-full bg-white/5 dark:bg-white/10 backdrop-blur-md border border-white/10 dark:border-white/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                    >
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Schedule Export
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Data Preview
                  </h3>
                  {previewData && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {previewData.sampleSize} of {previewData.totalRecords} records
                    </span>
                  )}
                </div>
                
                {renderPreviewTable()}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Exports Tab */}
        {activeTab === 'schedule' && isAdmin && (
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Scheduled Exports
            </h3>
            
            {scheduledExports.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No scheduled exports found
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledExports.map((scheduled) => (
                  <div
                    key={scheduled.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {scheduled.type} Export
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {scheduled.schedule} • {scheduled.format.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelScheduled(scheduled.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white/70 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Export History
            </h3>
            
            {exportHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No export history found
              </div>
            ) : (
              <div className="space-y-4">
                {exportHistory.map((exportItem) => (
                  <div
                    key={exportItem.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {exportItem.type} Export
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(exportItem.created_at).toLocaleDateString()} • {exportItem.format.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {exportItem.record_count} records
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExport;

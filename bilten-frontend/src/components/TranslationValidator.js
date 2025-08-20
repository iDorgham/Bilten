/**
 * Development component for translation validation and debugging
 * Only renders in development mode
 */

import React, { useState, useEffect } from 'react';
import translationDevTools from '../utils/translationDevTools';

const TranslationValidator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const generateReport = async () => {
    setLoading(true);
    try {
      const newReport = await translationDevTools.generateReport();
      setReport(newReport);
    } catch (error) {
      console.error('Failed to generate translation report:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible && !report) {
      generateReport();
    }
  };

  if (!isVisible) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#4F46E5',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'monospace',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={toggleVisibility}
        title="Translation DevTools"
      >
        🌐 i18n
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '500px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        style={{
          backgroundColor: '#4F46E5',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontWeight: '600' }}>🌐 Translation DevTools</span>
        <button
          onClick={toggleVisibility}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading report...
          </div>
        ) : report ? (
          <TranslationReport report={report} onRefresh={generateReport} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={generateReport}
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Generate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const TranslationReport = ({ report, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'validation', label: 'Validation' },
    { id: 'usage', label: 'Usage' },
    { id: 'recommendations', label: 'Tips' }
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : 'none',
              color: activeTab === tab.id ? '#4F46E5' : '#6b7280',
              fontSize: '12px'
            }}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={onRefresh}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            float: 'right',
            fontSize: '12px'
          }}
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab cache={report.cache} />
      )}
      
      {activeTab === 'validation' && (
        <ValidationTab validation={report.validation} />
      )}
      
      {activeTab === 'usage' && (
        <UsageTab usage={report.usage} />
      )}
      
      {activeTab === 'recommendations' && (
        <RecommendationsTab recommendations={report.recommendations} />
      )}
    </div>
  );
};

const OverviewTab = ({ cache }) => (
  <div style={{ fontSize: '12px' }}>
    <div style={{ marginBottom: '12px' }}>
      <strong>Cache Statistics</strong>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <div>Languages: {cache.size}</div>
      <div>Hit Rate: {(cache.hitRate * 100).toFixed(1)}%</div>
      <div>Cache Hits: {cache.hits}</div>
      <div>Cache Misses: {cache.misses}</div>
    </div>
    <div style={{ marginTop: '12px' }}>
      <strong>Loaded Languages:</strong>
      <div style={{ marginTop: '4px' }}>
        {cache.languages.map(lang => (
          <span 
            key={lang}
            style={{
              display: 'inline-block',
              backgroundColor: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: '3px',
              margin: '2px',
              fontSize: '11px'
            }}
          >
            {lang}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const ValidationTab = ({ validation }) => (
  <div style={{ fontSize: '12px' }}>
    {Object.entries(validation).map(([code, result]) => (
      <div key={code} style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          {result.language} ({code})
        </div>
        {result.error ? (
          <div style={{ color: '#dc2626' }}>Error: {result.error}</div>
        ) : (
          <div>
            <div>Completeness: {result.completeness}%</div>
            <div>Missing: {result.missingCount}/{result.totalKeys}</div>
            {result.missingKeys.length > 0 && (
              <details style={{ marginTop: '4px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '11px' }}>
                  Show missing keys
                </summary>
                <div style={{ marginTop: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
                  {result.missingKeys.map(key => (
                    <div key={key} style={{ color: '#dc2626' }}>{key}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
);

const UsageTab = ({ usage }) => (
  <div style={{ fontSize: '12px' }}>
    {usage.message ? (
      <div>{usage.message}</div>
    ) : (
      <div>
        <div style={{ marginBottom: '12px' }}>
          <strong>Usage Statistics</strong>
        </div>
        <div style={{ marginBottom: '8px' }}>
          Total Keys Used: {usage.totalKeys}
        </div>
        <div style={{ marginBottom: '8px' }}>
          Total Usage: {usage.totalUsage}
        </div>
        
        {usage.mostUsed && usage.mostUsed.length > 0 && (
          <details style={{ marginBottom: '8px' }}>
            <summary style={{ cursor: 'pointer' }}>Most Used Keys</summary>
            <div style={{ marginTop: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
              {usage.mostUsed.slice(0, 5).map(([key, count]) => (
                <div key={key}>{key}: {count}</div>
              ))}
            </div>
          </details>
        )}
      </div>
    )}
  </div>
);

const RecommendationsTab = ({ recommendations }) => (
  <div style={{ fontSize: '12px' }}>
    {recommendations.length === 0 ? (
      <div style={{ color: '#059669' }}>✅ No issues found!</div>
    ) : (
      <div>
        {recommendations.map((rec, index) => (
          <div 
            key={index}
            style={{
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: '#fef3c7',
              borderRadius: '4px',
              borderLeft: '3px solid #f59e0b'
            }}
          >
            {rec}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default TranslationValidator;
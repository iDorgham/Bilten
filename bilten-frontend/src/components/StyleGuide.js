/**
 * Style Guide Component
 * Visual documentation of the design system
 */

import React, { useState } from 'react';
import { 
  SwatchIcon,
  DocumentTextIcon,
  CubeIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  pageClasses, 
  cardClasses, 
  buttonClasses, 
  inputClasses, 
  textClasses,
  loadingSpinnerClasses,
  errorClasses,
  successClasses,
  badgeClasses,
  containerClasses,
  cn
} from '../styles/utilities';
import { colors, typography, spacing } from '../styles/theme';

const StyleGuide = () => {
  const [activeTab, setActiveTab] = useState('colors');

  const tabs = [
    { id: 'colors', label: 'Colors', icon: SwatchIcon },
    { id: 'typography', label: 'Typography', icon: DocumentTextIcon },
    { id: 'components', label: 'Components', icon: CubeIcon },
    { id: 'utilities', label: 'Utilities', icon: SparklesIcon }
  ];

  const ColorSwatch = ({ name, color, textColor = 'text-white' }) => (
    <div className={cn('p-4 rounded-lg', color)}>
      <div className={cn('font-medium text-sm', textColor)}>{name}</div>
      <div className={cn('text-xs opacity-75', textColor)}>{color}</div>
    </div>
  );

  const ComponentExample = ({ title, children, code }) => (
    <div className={cardClasses()}>
      <div className="p-6">
        <h3 className={cn('text-lg font-semibold mb-4', textClasses('primary'))}>
          {title}
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {children}
          </div>
          {code && (
            <details className="text-sm">
              <summary className={cn('cursor-pointer font-medium', textClasses('secondary'))}>
                View Code
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
                <code>{code}</code>
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={pageClasses()}>
      <div className={containerClasses()}>
        <div className="py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={cn('text-4xl font-bold mb-4', textClasses('primary'))}>
              Bilten Design System
            </h1>
            <p className={textClasses('secondary')}>
              Comprehensive style guide and component library
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center mb-8 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-8">
              <div>
                <h2 className={cn('text-2xl font-bold mb-6', textClasses('primary'))}>
                  Color Palette
                </h2>
                
                {/* Primary Colors */}
                <div className="mb-8">
                  <h3 className={cn('text-lg font-semibold mb-4', textClasses('primary'))}>
                    Primary Colors
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ColorSwatch name="Primary 50" color="bg-primary-50" textColor="text-gray-900" />
                    <ColorSwatch name="Primary 100" color="bg-primary-100" textColor="text-gray-900" />
                    <ColorSwatch name="Primary 500" color="bg-primary-500" />
                    <ColorSwatch name="Primary 600" color="bg-primary-600" />
                    <ColorSwatch name="Primary 900" color="bg-primary-900" />
                  </div>
                </div>

                {/* Semantic Colors */}
                <div className="mb-8">
                  <h3 className={cn('text-lg font-semibold mb-4', textClasses('primary'))}>
                    Semantic Colors
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorSwatch name="Success" color="bg-green-500" />
                    <ColorSwatch name="Warning" color="bg-yellow-500" />
                    <ColorSwatch name="Error" color="bg-red-500" />
                  </div>
                </div>

                {/* Gray Scale */}
                <div>
                  <h3 className={cn('text-lg font-semibold mb-4', textClasses('primary'))}>
                    Gray Scale
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <ColorSwatch name="Gray 50" color="bg-gray-50" textColor="text-gray-900" />
                    <ColorSwatch name="Gray 200" color="bg-gray-200" textColor="text-gray-900" />
                    <ColorSwatch name="Gray 500" color="bg-gray-500" />
                    <ColorSwatch name="Gray 700" color="bg-gray-700" />
                    <ColorSwatch name="Gray 900" color="bg-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === 'typography' && (
            <div className="space-y-8">
              <h2 className={cn('text-2xl font-bold mb-6', textClasses('primary'))}>
                Typography
              </h2>
              
              <ComponentExample title="Headings">
                <div className="space-y-4">
                  <h1 className={cn('text-5xl font-bold', textClasses('primary'))}>Heading 1</h1>
                  <h2 className={cn('text-4xl font-bold', textClasses('primary'))}>Heading 2</h2>
                  <h3 className={cn('text-3xl font-bold', textClasses('primary'))}>Heading 3</h3>
                  <h4 className={cn('text-2xl font-bold', textClasses('primary'))}>Heading 4</h4>
                  <h5 className={cn('text-xl font-bold', textClasses('primary'))}>Heading 5</h5>
                  <h6 className={cn('text-lg font-bold', textClasses('primary'))}>Heading 6</h6>
                </div>
              </ComponentExample>

              <ComponentExample title="Text Variants">
                <div className="space-y-4">
                  <p className={textClasses('primary')}>Primary text - Main content</p>
                  <p className={textClasses('secondary')}>Secondary text - Supporting content</p>
                  <p className={textClasses('muted')}>Muted text - Less important content</p>
                  <p className={textClasses('accent')}>Accent text - Links and highlights</p>
                </div>
              </ComponentExample>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="space-y-8">
              <h2 className={cn('text-2xl font-bold mb-6', textClasses('primary'))}>
                Components
              </h2>

              <ComponentExample 
                title="Buttons" 
                code={`import { buttonClasses } from '../styles/utilities';

<button className={buttonClasses('primary', 'md')}>
  Primary Button
</button>`}
              >
                <div className="flex flex-wrap gap-4">
                  <button className={buttonClasses('primary', 'sm')}>Primary Small</button>
                  <button className={buttonClasses('primary', 'md')}>Primary Medium</button>
                  <button className={buttonClasses('primary', 'lg')}>Primary Large</button>
                  <button className={buttonClasses('secondary', 'md')}>Secondary</button>
                  <button className={buttonClasses('outline', 'md')}>Outline</button>
                  <button className={buttonClasses('ghost', 'md')}>Ghost</button>
                  <button className={buttonClasses('danger', 'md')}>Danger</button>
                </div>
              </ComponentExample>

              <ComponentExample 
                title="Form Inputs"
                code={`import { inputClasses } from '../styles/utilities';

<input className={inputClasses()} placeholder="Normal input" />
<input className={inputClasses(true)} placeholder="Error input" />`}
              >
                <div className="space-y-4 max-w-md">
                  <input className={inputClasses()} placeholder="Normal input" />
                  <input className={inputClasses(true)} placeholder="Input with error" />
                  <textarea className={inputClasses()} placeholder="Textarea" rows="3" />
                </div>
              </ComponentExample>

              <ComponentExample title="Cards">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cardClasses()}>
                    <div className="p-6">
                      <h3 className={cn('text-lg font-semibold mb-2', textClasses('primary'))}>
                        Card Title
                      </h3>
                      <p className={textClasses('secondary')}>
                        This is a card with hover effects and proper theming.
                      </p>
                    </div>
                  </div>
                  <div className={cardClasses(false)}>
                    <div className="p-6">
                      <h3 className={cn('text-lg font-semibold mb-2', textClasses('primary'))}>
                        Card Without Hover
                      </h3>
                      <p className={textClasses('secondary')}>
                        This card doesn't have hover effects.
                      </p>
                    </div>
                  </div>
                </div>
              </ComponentExample>

              <ComponentExample title="Badges">
                <div className="flex flex-wrap gap-2">
                  <span className={badgeClasses('default')}>Default</span>
                  <span className={badgeClasses('primary')}>Primary</span>
                  <span className={badgeClasses('success')}>Success</span>
                  <span className={badgeClasses('warning')}>Warning</span>
                  <span className={badgeClasses('error')}>Error</span>
                </div>
              </ComponentExample>

              <ComponentExample title="Loading States">
                <div className="flex items-center space-x-4">
                  <div className={loadingSpinnerClasses('sm')}></div>
                  <div className={loadingSpinnerClasses('md')}></div>
                  <div className={loadingSpinnerClasses('lg')}></div>
                </div>
              </ComponentExample>

              <ComponentExample title="Alert States">
                <div className="space-y-4">
                  <div className={errorClasses()}>
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
                      <span className="text-red-800 dark:text-red-200">This is an error message</span>
                    </div>
                  </div>
                  <div className={successClasses()}>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                      <span className="text-green-800 dark:text-green-200">This is a success message</span>
                    </div>
                  </div>
                </div>
              </ComponentExample>
            </div>
          )}

          {/* Utilities Tab */}
          {activeTab === 'utilities' && (
            <div className="space-y-8">
              <h2 className={cn('text-2xl font-bold mb-6', textClasses('primary'))}>
                Utility Functions
              </h2>

              <ComponentExample 
                title="Class Name Utilities"
                code={`import { cn, buttonClasses, textClasses } from '../styles/utilities';

// Combine classes conditionally
const classes = cn(
  'base-class',
  isActive && 'active-class',
  'another-class'
);

// Use component utilities
const buttonClass = buttonClasses('primary', 'lg');
const textClass = textClasses('secondary');`}
              >
                <div className="space-y-4">
                  <p className={textClasses('secondary')}>
                    The utility functions help maintain consistent styling across components:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">cn()</code> - Conditional class names</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">buttonClasses()</code> - Button styling</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">cardClasses()</code> - Card styling</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">textClasses()</code> - Text styling</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">inputClasses()</code> - Form input styling</li>
                  </ul>
                </div>
              </ComponentExample>

              <ComponentExample title="Usage Examples">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                    <h4 className={cn('font-semibold mb-2', textClasses('primary'))}>
                      Import utilities in your components:
                    </h4>
                    <pre className="text-sm text-green-600 dark:text-green-400">
{`import { 
  pageClasses, 
  cardClasses, 
  buttonClasses,
  textClasses,
  cn 
} from '../styles/utilities';`}
                    </pre>
                  </div>
                  
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                    <h4 className={cn('font-semibold mb-2', textClasses('primary'))}>
                      Use in JSX:
                    </h4>
                    <pre className="text-sm text-green-600 dark:text-green-400">
{`<div className={pageClasses()}>
  <div className={cardClasses()}>
    <h1 className={textClasses('primary')}>Title</h1>
    <button className={buttonClasses('primary', 'lg')}>
      Click me
    </button>
  </div>
</div>`}
                    </pre>
                  </div>
                </div>
              </ComponentExample>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleGuide;
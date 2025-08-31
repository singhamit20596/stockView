'use client';

import { useState, useEffect } from 'react';
import CredentialsForm from '@/components/CredentialsForm';
import CredentialsList from '@/components/CredentialsList';
import type { DBCredentials, CredentialsFormData } from '@/lib/types';
import { CredentialsService } from '@/lib/credentialsService';

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<DBCredentials[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [editingCredentials, setEditingCredentials] = useState<DBCredentials | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load credentials on component mount
  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CredentialsService.getAllCredentials();
      setCredentials(data);
      
      // Auto-select first account if none selected
      if (data.length > 0 && !selectedAccount) {
        setSelectedAccount(data[0].account_name);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
      setError('Failed to load credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredentials = async (data: CredentialsFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if account name already exists
      const exists = await CredentialsService.accountExists(data.account_name);
      if (exists) {
        setError('An account with this name already exists.');
        return;
      }

      await CredentialsService.createCredentials(data);
      await loadCredentials();
      setShowForm(false);
      setEditingCredentials(null);
    } catch (err) {
      console.error('Failed to add credentials:', err);
      setError('Failed to add credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async (data: CredentialsFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!editingCredentials) return;

      await CredentialsService.updateCredentials(editingCredentials.account_name, data);
      await loadCredentials();
      setShowForm(false);
      setEditingCredentials(null);
    } catch (err) {
      console.error('Failed to update credentials:', err);
      setError('Failed to update credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async (accountName: string) => {
    try {
      await CredentialsService.deleteCredentials(accountName);
      await loadCredentials();
      
      // Clear selection if deleted account was selected
      if (selectedAccount === accountName) {
        setSelectedAccount('');
      }
    } catch (err) {
      console.error('Failed to delete credentials:', err);
      setError('Failed to delete credentials. Please try again.');
    }
  };

  const handleEditCredentials = (cred: DBCredentials) => {
    setEditingCredentials(cred);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCredentials(null);
    setError(null);
  };

  const handleSelectAccount = (accountName: string) => {
    setSelectedAccount(accountName);
    // Store selected account in localStorage for persistence
    localStorage.setItem('selectedAccount', accountName);
  };

  // Load selected account from localStorage on mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('selectedAccount');
    if (savedAccount) {
      setSelectedAccount(savedAccount);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credentials Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your account credentials for automated scraping. Only OTP needs to be entered manually.
              </p>
            </div>
            
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Credentials
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Account Info */}
        {selectedAccount && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Selected Account</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    <strong>{selectedAccount}</strong> will be used for automated scraping. 
                    Only OTP will need to be entered manually when required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credentials List */}
          <div>
            <CredentialsList
              credentials={credentials}
              onEdit={handleEditCredentials}
              onDelete={handleDeleteCredentials}
              onSelect={handleSelectAccount}
              selectedAccount={selectedAccount}
              isLoading={isLoading}
            />
          </div>

          {/* Credentials Form */}
          {showForm && (
            <div>
              <CredentialsForm
                credentials={editingCredentials || undefined}
                onSubmit={editingCredentials ? handleUpdateCredentials : handleAddCredentials}
                onCancel={handleCancelForm}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && credentials.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading credentials...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

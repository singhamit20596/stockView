'use client';

import { useState } from 'react';
import type { DBCredentials } from '@/lib/types';

interface CredentialsListProps {
  credentials: DBCredentials[];
  onEdit: (credentials: DBCredentials) => void;
  onDelete: (accountName: string) => Promise<void>;
  onSelect: (accountName: string) => void;
  selectedAccount?: string;
  isLoading?: boolean;
}

export default function CredentialsList({
  credentials,
  onEdit,
  onDelete,
  onSelect,
  selectedAccount,
  isLoading = false
}: CredentialsListProps) {
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);

  const handleDelete = async (accountName: string) => {
    if (!confirm(`Are you sure you want to delete credentials for "${accountName}"?`)) {
      return;
    }

    setDeletingAccount(accountName);
    try {
      await onDelete(accountName);
    } catch (error) {
      console.error('Failed to delete credentials:', error);
    } finally {
      setDeletingAccount(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (credentials.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Credentials Found</h3>
        <p className="text-gray-500">Add your first set of credentials to get started with automated scraping.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Stored Credentials</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select an account to use for automated scraping
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {credentials.map((cred) => (
          <div
            key={cred.account_name}
            className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
              selectedAccount === cred.account_name ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={() => onSelect(cred.account_name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {cred.account_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {cred.account_name}
                      </h3>
                      {selectedAccount === cred.account_name && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {cred.email}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>Created: {formatDate(cred.created_at || '')}</span>
                      {cred.updated_at && cred.updated_at !== cred.created_at && (
                        <span>Updated: {formatDate(cred.updated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(cred);
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(cred.account_name);
                  }}
                  disabled={isLoading || deletingAccount === cred.account_name}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deletingAccount === cred.account_name ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

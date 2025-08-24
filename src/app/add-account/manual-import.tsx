"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ManualImportPage() {
  const [accountName, setAccountName] = useState('');
  const [csvData, setCsvData] = useState('');
  const [preview, setPreview] = useState<any[]>([]);

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });
    return data;
  };

  const handleCSVChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const csv = e.target.value;
    setCsvData(csv);
    
    if (csv.trim()) {
      try {
        const parsed = parseCSV(csv);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows
      } catch (error) {
        console.error('CSV parsing error:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!accountName || !csvData) return;
    
    try {
      const holdings = parseCSV(csvData);
      
      // TODO: Replace with actual API call to save data
      console.log('Importing holdings:', { accountName, holdings });
      
      // For now, just show success message
      alert(`Successfully imported ${holdings.length} holdings for ${accountName}`);
    } catch (error) {
      alert('Error importing data: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#964734] mb-2">Manual Import</h1>
        <p className="text-gray-600">Import your holdings data manually since scraping is not available on Netlify</p>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#964734] mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:border-transparent"
              placeholder="Enter account name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#964734] mb-2">
              CSV Data
            </label>
            <textarea
              value={csvData}
              onChange={handleCSVChange}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0FA4AF] focus:border-transparent font-mono text-sm"
              placeholder="Paste CSV data here...
Format: Stock Name,Quantity,Average Price,Market Price,Sector,Subsector
Example:
HDFC Bank,100,1500.50,1520.75,Banking,Private Banks
TCS,50,3200.00,3250.25,Technology,IT Services"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#964734] mb-2">Preview (First 5 rows)</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(preview[0] || {}).map(key => (
                        <th key={key} className="text-left py-1">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="py-1">{String(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button variant="secondary" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!accountName || !csvData}
            >
              Import Holdings
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#964734] mb-4">How to Export from Groww</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Log in to your Groww account</p>
            <p>2. Go to Holdings section</p>
            <p>3. Look for "Export" or "Download" option</p>
            <p>4. Download as CSV format</p>
            <p>5. Copy the CSV content and paste it above</p>
            <p className="text-xs text-gray-500 mt-4">
              Note: If Groww doesn't provide CSV export, you can manually create the CSV with the format shown above.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

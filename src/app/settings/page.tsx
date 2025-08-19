"use client";
import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LogoOptions, getLogoSvg } from '@/components/ui/LogoOptions';

export default function SettingsPage() {
  const [selectedLogo, setSelectedLogo] = useState('chart-lines');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load saved logo preference
    const savedLogo = localStorage.getItem('stockview-logo');
    if (savedLogo) {
      setSelectedLogo(savedLogo);
    }
  }, []);

  const handleLogoSelect = (logoId: string) => {
    setSelectedLogo(logoId);
    setIsSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('stockview-logo', selectedLogo);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-600 mt-1">Customize your stockView experience</p>
      </div>

      <Card>
        <CardBody className="p-6">
          <div className="space-y-6">
            {/* Logo Selection */}
            <LogoOptions onSelect={handleLogoSelect} currentLogo={selectedLogo} />
            
            {/* Preview */}
            <div className="border-t border-zinc-200 pt-6">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">Preview</h4>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white grid place-items-center">
                  <div dangerouslySetInnerHTML={{ __html: getLogoSvg(selectedLogo) }} />
                </div>
                <span>stockView</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} variant="primary">
                Save Changes
              </Button>
              {isSaved && (
                <span className="text-sm text-green-600">✓ Settings saved!</span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RotateCcw, 
  CheckCircle, 
  Download, 
  Zap, 
  Search, 
  AlertTriangle,
  RefreshCw,
  Package,
  FileText
} from 'lucide-react';

export function SortingQuickActions() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickSort = async () => {
    if (!trackingId.trim()) {
      setError('Veuillez saisir un code de suivi');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Simuler une recherche de colis et tri automatique
      console.log('Quick sort for:', trackingId);
      
      // Ici vous feriez l'appel API réel
      // const response = await fetch('/api/sorting/quick-sort', { ... });
      
      // Simulation du résultat
      setTimeout(() => {
        setResult({
          trackingID: trackingId.toUpperCase(),
          zone: 'A',
          destination: 'kinshasa',
          status: 'sorted'
        });
        setLoading(false);
        setTrackingId('');
      }, 1500);

    } catch (err) {
      console.error('Error during quick sort:', err);
      setError('Erreur lors du tri rapide');
      setLoading(false);
    }
  };

  const handleBatchValidation = async () => {
    setLoading(true);
    try {
      // Simuler validation en lot
      console.log('Batch validation started');
      
      setTimeout(() => {
        setResult({
          type: 'batch_validation',
          processed: 15,
          success: 14,
          errors: 1
        });
        setLoading(false);
      }, 2000);

    } catch (err) {
      console.error('Error during batch validation:', err);
      setError('Erreur lors de la validation en lot');
      setLoading(false);
    }
  };

  const handleExportPrintList = () => {
    // Simuler export pour impression
    const data = [
      { zone: 'A', count: 47, destination: 'Kinshasa' },
      { zone: 'B', count: 32, destination: 'Lubumbashi' },
      { zone: 'C', count: 8, destination: 'Cas spéciaux' },
      { zone: 'D', count: 3, destination: 'Bloqués' }
    ];

    const content = [
      '=== LISTE DE TRI - ' + new Date().toLocaleDateString('fr-FR') + ' ===\n',
      ...data.map(item => 
        `Zone ${item.zone} (${item.destination}): ${item.count} colis`
      ),
      '\n=== Total: ' + data.reduce((sum, item) => sum + item.count, 0) + ' colis ==='
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liste_tri_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Actions rapides</span>
        </CardTitle>
        <CardDescription>
          Outils pour accélérer les opérations de tri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tri rapide d'un colis */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <RotateCcw className="h-4 w-4" />
            <span>Tri rapide</span>
          </h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="trackingId" className="sr-only">Code de suivi</Label>
              <Input
                id="trackingId"
                placeholder="Code de suivi (ex: BGFXNG)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickSort()}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleQuickSort}
              disabled={loading || !trackingId.trim()}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Saisissez un code de suivi pour tri automatique immédiat
          </p>
        </div>

        {/* Actions en lot */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Actions en lot</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleBatchValidation}
              disabled={loading}
              className="justify-start"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Validation en lot
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log('Re-tri en lot')}
              disabled={loading}
              className="justify-start"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Re-tri en lot
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Appliquer des actions sur plusieurs colis sélectionnés
          </p>
        </div>

        {/* Export et impression */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Export et impression</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleExportPrintList}
              className="justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Liste pour impression
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log('Export Excel')}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Générer des documents pour les équipes de terrain
          </p>
        </div>

        {/* Résultats */}
        {result && (
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-900 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Résultat</span>
              </h4>
              <Button variant="ghost" size="sm" onClick={clearResult}>
                ×
              </Button>
            </div>
            
            {result.type === 'batch_validation' ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Colis traités:</span>
                  <span className="font-medium">{result.processed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Succès:</span>
                  <span className="font-medium">{result.success}</span>
                </div>
                {result.errors > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-700">Erreurs:</span>
                    <span className="font-medium">{result.errors}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{result.trackingID}</Badge>
                  <span className="text-sm">→</span>
                  <Badge className="bg-green-100 text-green-800">
                    Zone {result.zone}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  Colis trié automatiquement vers {result.destination}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Erreurs */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Raccourcis clavier */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2">Raccourcis clavier</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl + Enter</kbd>
              <span className="ml-2">Tri rapide</span>
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl + A</kbd>
              <span className="ml-2">Sélectionner tout</span>
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl + V</kbd>
              <span className="ml-2">Validation lot</span>
            </div>
            <div>
              <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl + P</kbd>
              <span className="ml-2">Imprimer liste</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
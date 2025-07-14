'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Package,
  Search,
  Eye,
  Copy
} from 'lucide-react';
import { QRCodeService } from '@/services/qr-code';
import ParcelService from '@/services/firebase';
import { Parcel } from '@/types/parcel';
import { useAuth } from '@/hooks/useAuth';

interface QRGenerationResult {
  parcelId: string;
  trackingID: string;
  qrCode: string;
  qrCodeImage: string;
  success: boolean;
}

export function QRCodeManagement() {
  const [parcelsWithoutQR, setParcelsWithoutQR] = useState<Parcel[]>([]);
  const [parcelsWithQR, setParcelsWithQR] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generationResults, setGenerationResults] = useState<QRGenerationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer tous les colis depuis Firestore
      const allParcels = await ParcelService.getAllParcels();
      
      // Séparer les colis avec et sans QR codes
      const withoutQR = allParcels.filter(parcel => !parcel.qrCode);
      const withQR = allParcels.filter(parcel => parcel.qrCode);
      
      setParcelsWithoutQR(withoutQR);
      setParcelsWithQR(withQR);
    } catch (err) {
      console.error('Error loading parcels:', err);
      setError('Erreur lors du chargement des colis');
    } finally {
      setLoading(false);
    }
  };

  const generateQRForSelected = async () => {
    if (selectedParcels.length === 0) {
      setError('Veuillez sélectionner au moins un colis');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await QRCodeService.generateQRCodes(selectedParcels);
      
      if (result.success && result.results) {
        setGenerationResults(result.results);
        setSuccess(`${result.results.length} codes QR générés avec succès`);
        setSelectedParcels([]);
        
        // Recharger les données
        setTimeout(() => {
          loadParcels();
        }, 1000);
      } else {
        setError(result.error || 'Erreur lors de la génération des codes QR');
      }
    } catch (err) {
      console.error('QR generation error:', err);
      setError('Erreur lors de la génération des codes QR');
    } finally {
      setLoading(false);
    }
  };

  const generateQRForAll = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await QRCodeService.generateAllQRCodes();
      
      if (result.success && result.results) {
        setGenerationResults(result.results);
        setSuccess(`${result.results.length} codes QR générés avec succès`);
        
        // Recharger les données
        setTimeout(() => {
          loadParcels();
        }, 1000);
      } else {
        setError(result.error || 'Erreur lors de la génération des codes QR');
      }
    } catch (err) {
      console.error('QR generation error:', err);
      setError('Erreur lors de la génération des codes QR');
    } finally {
      setLoading(false);
    }
  };

  const handleParcelSelection = (parcelId: string, checked: boolean) => {
    setSelectedParcels(prev => 
      checked 
        ? [...prev, parcelId]
        : prev.filter(id => id !== parcelId)
    );
  };

  const downloadQRCode = (qrCodeImage: string, trackingID: string) => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `QR_${trackingID}.png`;
    link.click();
  };

  const copyQRCode = (qrCode: string) => {
    navigator.clipboard.writeText(qrCode);
    setSuccess('Code QR copié dans le presse-papiers');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filteredParcelsWithoutQR = parcelsWithoutQR.filter(parcel =>
    parcel.trackingID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parcel.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parcel.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParcelsWithQR = parcelsWithQR.filter(parcel =>
    parcel.trackingID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parcel.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parcel.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{parcelsWithoutQR.length}</p>
                <p className="text-sm text-gray-600">Sans QR Code</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <QrCode className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{parcelsWithQR.length}</p>
                <p className="text-sm text-gray-600">Avec QR Code</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{generationResults.length}</p>
                <p className="text-sm text-gray-600">Générés aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Actions de Génération</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={generateQRForSelected}
              disabled={loading || selectedParcels.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Générer pour Sélectionnés ({selectedParcels.length})
            </Button>
            
            <Button 
              onClick={generateQRForAll}
              disabled={loading || parcelsWithoutQR.length === 0}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Générer pour Tous ({parcelsWithoutQR.length})
            </Button>
            
            <Button 
              onClick={loadParcels}
              disabled={loading}
              variant="ghost"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Search */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro de suivi, expéditeur ou destinataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="without-qr" className="space-y-4">
        <TabsList>
          <TabsTrigger value="without-qr">
            Sans QR Code ({filteredParcelsWithoutQR.length})
          </TabsTrigger>
          <TabsTrigger value="with-qr">
            Avec QR Code ({filteredParcelsWithQR.length})
          </TabsTrigger>
          <TabsTrigger value="generated">
            Générés Récemment ({generationResults.length})
          </TabsTrigger>
        </TabsList>

        {/* Parcels without QR codes */}
        <TabsContent value="without-qr">
          <Card>
            <CardHeader>
              <CardTitle>Colis sans QR Code</CardTitle>
              <CardDescription>
                Sélectionnez les colis pour lesquels générer des codes QR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedParcels.length === filteredParcelsWithoutQR.length && filteredParcelsWithoutQR.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParcels(filteredParcelsWithoutQR.map(p => p.id || ''));
                          } else {
                            setSelectedParcels([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Expéditeur</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParcelsWithoutQR.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedParcels.includes(parcel.id || '')}
                          onChange={(e) => handleParcelSelection(parcel.id || '', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{parcel.trackingID}</TableCell>
                      <TableCell>{parcel.sender_name}</TableCell>
                      <TableCell>{parcel.receiver_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{parcel.status}</Badge>
                      </TableCell>
                      <TableCell>{parcel.create_date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parcels with QR codes */}
        <TabsContent value="with-qr">
          <Card>
            <CardHeader>
              <CardTitle>Colis avec QR Code</CardTitle>
              <CardDescription>
                Colis ayant déjà un code QR généré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Expéditeur</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>QR Généré</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParcelsWithQR.map((parcel) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-mono">{parcel.trackingID}</TableCell>
                      <TableCell>{parcel.sender_name}</TableCell>
                      <TableCell>{parcel.receiver_name}</TableCell>
                      <TableCell>
                        {parcel.qrGenerated && (
                          <Badge className="bg-green-100 text-green-800">
                            {new Date(parcel.qrGenerated).toLocaleDateString()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {parcel.qrCodeImage && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadQRCode(parcel.qrCodeImage!, parcel.trackingID!)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          {parcel.qrCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyQRCode(parcel.qrCode!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recently generated */}
        <TabsContent value="generated">
          <Card>
            <CardHeader>
              <CardTitle>QR Codes Générés Récemment</CardTitle>
              <CardDescription>
                Résultats de la dernière génération
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generationResults.map((result) => (
                      <TableRow key={result.parcelId}>
                        <TableCell className="font-mono">{result.trackingID}</TableCell>
                        <TableCell>
                          {result.success ? (
                            <Badge className="bg-green-100 text-green-800">Généré</Badge>
                          ) : (
                            <Badge variant="destructive">Erreur</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <img
                            src={result.qrCodeImage}
                            alt={`QR Code ${result.trackingID}`}
                            className="w-16 h-16 border rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadQRCode(result.qrCodeImage, result.trackingID)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyQRCode(result.qrCode)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun QR code généré récemment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, MapPin, Clock } from 'lucide-react';

interface PreparationStatsData {
  toProcess: number;
  readyForShipment: number;
  byDestination: { [key: string]: number };
  averageProcessingTime: number;
}

export function PreparationStats() {
  const [stats, setStats] = useState<PreparationStatsData>({
    toProcess: 0,
    readyForShipment: 0,
    byDestination: {},
    averageProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock data - replace with actual API call
        const mockStats: PreparationStatsData = {
          toProcess: 12,
          readyForShipment: 8,
          byDestination: {
            'Kinshasa': 15,
            'Lubumbashi': 5
          },
          averageProcessingTime: 2.3
        };

        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching preparation stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* To Process */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            À Traiter
          </CardTitle>
          <Package className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.toProcess}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Colis reçus en attente
          </p>
        </CardContent>
      </Card>

      {/* Ready for Shipment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Prêts à Expédier
          </CardTitle>
          <Truck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.readyForShipment}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Colis préparés
          </p>
        </CardContent>
      </Card>

      {/* By Destination */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Destinations
          </CardTitle>
          <MapPin className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(stats.byDestination).map(([destination, count]) => (
              <div key={destination} className="flex justify-between text-sm">
                <span className="text-gray-600">{destination}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Average Processing Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Temps Moyen
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.averageProcessingTime}h
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Temps de préparation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
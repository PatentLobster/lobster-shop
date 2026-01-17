import { useState, useEffect } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { createPurchase, getUserPurchases, getRuntimeConfig } from '../services/api';
import type { Purchase, BuyRequest } from '@lobster-shop/shared';

export function App() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);

  const config = getRuntimeConfig();
  const userId = 'user-123'; // In a real app, this would come from authentication

  const handleBuy = async () => {
    setBuyLoading(true);
    setError(null);

    const request: BuyRequest = {
      userId,
      username: 'demo-user',
      price: Math.floor(Math.random() * 100) + 10, // Random price between 10-110
      productName: `Product ${Math.floor(Math.random() * 1000)}`,
      description: 'Demo product purchase',
    };

    try {
      const response = await createPurchase(request);
      if (response.success) {
        console.log('Purchase successful:', response);
        // Show success message
        console.log(`Purchase successful! ID: ${response.purchaseId}`);
        // Optionally refresh purchases after a short delay (Kafka is async)
        // setTimeout(() => handleGetAllUserBuys(), 1000);
      } else {
        setError(response.message || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleGetAllUserBuys = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUserPurchases(userId);
      setPurchases(response.purchases);
      console.log('Purchases loaded:', response);
    } catch (err) {
      console.error('Failed to load purchases:', err);
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load purchases on mount
    handleGetAllUserBuys();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            {config?.appName || 'Lobster Shop'}
          </h1>
          <p className="text-foreground">
            Kubernetes-Native Purchase System
          </p>
          {config && (
            <p className="text-sm text-foreground">
              Environment: <span className="font-mono">{config.environment}</span> | API:{' '}
              <span className="font-mono text-xs">{config.apiUrl}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Create a new purchase or view your purchase history</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={handleBuy} className="flex-1" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              {buyLoading ? 'Processing...' : 'Buy'}
            </Button>
            <Button
              onClick={handleGetAllUserBuys}
              disabled={loading}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Package className="mr-2 h-5 w-5" />
              {loading ? 'Loading...' : 'getAllUserBuys'}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Purchases List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Purchases ({purchases.length})</CardTitle>
            <CardDescription>All items you've purchased, updated in real-time via Kafka</CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-8 text-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No purchases yet. Click "Buy" to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{purchase.productName || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        {purchase.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(purchase.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${purchase.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{purchase.id.substring(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>User ID:</strong> <span className="font-mono">{userId}</span>
              </p>
              {config?.features?.debugMode && (
                <p className="text-amber-600 dark:text-amber-400">
                  <strong>Debug Mode:</strong> Enabled
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;

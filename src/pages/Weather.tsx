import { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Trash2, Search, X } from 'lucide-react';
import { weatherApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/ConfirmDialog';
import { motion } from 'framer-motion';

interface WeatherHistory {
  id: number;
  city: string;
  date: string;
  weather: string;
}

export default function Weather() {
  const [city, setCity] = useState('');
  const [currentWeather, setCurrentWeather] = useState('');
  const [history, setHistory] = useState<WeatherHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await weatherApi.getHistory();
      const data = response.data;
  
      // Handle both cases:
      // 1) { history: [...] }
      // 2) { message: "Weather history is not available." }
      if (Array.isArray(data.history)) {
        setHistory(data.history);
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
      toast.error('Failed to fetch weather history');
    }
  };
  

  const handleCheckWeather = async () => {
    if (!city.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    setLoading(true);
    try {
      const response = await weatherApi.getWeather(city);
      setCurrentWeather(response.data.weather);
      toast.success('Weather fetched successfully!');
      fetchHistory(); // Refresh history
    } catch (error) {
      toast.error('Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  const handleResetHistory = async () => {
    try {
      await weatherApi.resetHistory();
      toast.success('Weather history reset!');
      setHistory([]);
    } catch (error) {
      toast.error('Failed to reset history');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weather</h1>
          <p className="text-muted-foreground">Check weather conditions for any city</p>
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl shadow-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-card">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Current Weather</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
  <div className="relative flex-1">
    <Input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Enter city name..."
      className="rounded-xl pr-12 bg-card"  // ← Added pr-12 for button space
      onKeyPress={(e) => e.key === 'Enter' && handleCheckWeather()}
    />
    
    {/* 🔄 ROUND CROSS BUTTON */}
    {city && (
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted hover:bg-destructive text-muted-foreground hover:text-destructive-foreground flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
        onClick={() => {
          setCity('');
          setCurrentWeather('');  // Clear weather display too
        }}
        aria-label="Clear city"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
  
  <Button
    onClick={handleCheckWeather}
    disabled={loading}
    className="rounded-xl bg-primary hover:bg-primary/90 shadow-card"
  >
    {loading ? (
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
    ) : (
      <Search className="w-4 h-4 mr-2" />
    )}
    Check Weather
  </Button>
</div>


        {currentWeather && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 shadow-soft"
          >
            <p className="text-lg font-medium text-foreground">{currentWeather}</p>
          </motion.div>
        )}
      </div>

      {/* Weather History */}
      <div className="bg-card rounded-3xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Weather History</h2>
          <div className="flex gap-2">
            <Button onClick={fetchHistory} variant="outline" className="rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setConfirmReset(true)}
              variant="destructive"
              className="rounded-xl"
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset History
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">City</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Weather</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No weather history found. Check weather for a city to get started!
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-t border-border hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">{item.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{item.city}</td>
                    <td className="px-6 py-4 text-sm">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.weather}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset Weather History"
        description="Are you sure you want to reset the weather history? This action cannot be undone."
        onConfirm={handleResetHistory}
        confirmText="Reset History"
        variant="destructive"
      />
    </motion.div>
  );
}

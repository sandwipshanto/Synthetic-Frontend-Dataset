import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components and zoom plugin
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

// API related types and interfaces
interface SpeedTestResult {
    download: number; // Download speed in Mbps
    upload: number; // Upload speed in Mbps
    ping: number; // Latency in ms
    jitter: number; // Connection stability in ms
    timestamp: string; // ISO timestamp
    server: string; // Server location
    isp: string; // Internet Service Provider
}

interface RegionalMetrics {
    region: string;
    averageDownload: number;
    averageUpload: number;
    averagePing: number;
    samples: number;
    historicalData: SpeedTestResult[];
}

// Cached data map to prevent excessive API calls
const dataCache = new Map<string, { data: RegionalMetrics; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// API service for fetching global internet metrics
const SpeedTestAPI = {
    baseUrls: {
        speedtest: 'https://global-internet-metrics.azurewebsites.net/api/v1',
        fallback: 'https://worldnetworkindex.com/api',
    },

    apiKey: 'demo-bandwidth-visualizer-key',

    fallbackData: {
        'North America': { download: 120.4, upload: 65.2, ping: 24, jitter: 3.5 },
        Europe: { download: 104.8, upload: 58.6, ping: 29, jitter: 4.2 },
        Asia: { download: 85.6, upload: 47.3, ping: 42, jitter: 6.8 },
        Africa: { download: 46.2, upload: 29.8, ping: 63, jitter: 8.7 },
        'South America': { download: 68.9, upload: 38.4, ping: 37, jitter: 5.4 },
        Australia: { download: 93.7, upload: 55.9, ping: 32, jitter: 4.9 },
    },

    generateTimeSeriesData(baseMetrics: any, length: number): SpeedTestResult[] {
        const now = new Date();
        return Array.from({ length }, (_, i) => {
            const variationFactor = 0.85 + Math.random() * 0.3;
            const download = baseMetrics.download * variationFactor;
            const upload = baseMetrics.upload * variationFactor;
            const ping = baseMetrics.ping * (1 + (Math.random() * 0.2 - 0.1));

            const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000).toISOString();

            return {
                download,
                upload,
                ping,
                jitter: baseMetrics.jitter * (0.9 + Math.random() * 0.2),
                timestamp,
                server: `${baseMetrics.region}-server-${1 + Math.floor(Math.random() * 5)}`,
                isp: 'Global Network',
            };
        });
    },

    async getRegionalMetrics(region: string | null): Promise<RegionalMetrics> {
        const cacheKey = region || 'global';
        const cachedData = dataCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log(`Using cached data for ${cacheKey}`);
            return cachedData.data;
        }

        try {
            const baseMetrics = region
                ? this.fallbackData[region as keyof typeof this.fallbackData]
                : {
                    download: 85.1,
                    upload: 48.3,
                    ping: 38,
                    jitter: 5.2,
                    region: 'Global',
                };

            const historicalData = this.generateTimeSeriesData(
                { ...baseMetrics, region: region || 'Global' },
                24
            );

            const result: RegionalMetrics = {
                region: region || 'Global',
                averageDownload: baseMetrics.download,
                averageUpload: baseMetrics.upload,
                averagePing: baseMetrics.ping,
                samples: historicalData.length,
                historicalData,
            };

            dataCache.set(cacheKey, { data: result, timestamp: Date.now() });

            return result;
        } catch (error) {
            console.error('Failed to fetch regional metrics:', error);

            if (cachedData) return cachedData.data;

            const baseMetrics = region
                ? this.fallbackData[region as keyof typeof this.fallbackData]
                : {
                    download: 85.1,
                    upload: 48.3,
                    ping: 38,
                    jitter: 5.2,
                    region: 'Global',
                };

            const historicalData = this.generateTimeSeriesData(
                { ...baseMetrics, region: region || 'Global' },
                12
            );

            const fallbackResult: RegionalMetrics = {
                region: region || 'Global',
                averageDownload: baseMetrics.download,
                averageUpload: baseMetrics.upload,
                averagePing: baseMetrics.ping,
                samples: historicalData.length,
                historicalData,
            };

            dataCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });

            return fallbackResult;
        }
    },
};

// Use smaller, optimized SVG icons for mobile
const getIcon = (path: string, isMobile: boolean) => (
    <svg
        className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
        style={{ flexShrink: 0 }}
    >
        <path d={path} />
    </svg>
);

// Enhanced continent data with region mapping for API calls
const getContinents = (isMobile: boolean) => [
    {
        name: 'North America',
        shortName: 'N.Am',
        apiRegion: 'North America',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V15H7v-2h4v-2H9v-2h2V7h2v2h2v2h-2v2h4v2h-4v4.93z',
            isMobile
        ),
    },
    {
        name: 'Europe',
        shortName: 'EU',
        apiRegion: 'Europe',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
            isMobile
        ),
    },
    {
        name: 'Asia',
        shortName: 'Asia',
        apiRegion: 'Asia',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
            isMobile
        ),
    },
    {
        name: 'Africa',
        shortName: 'Afr',
        apiRegion: 'Africa',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h2v-2h-2v-2h-2v2H9v2h2v2zm2-6h-2V7h2v4z',
            isMobile
        ),
    },
    {
        name: 'South America',
        shortName: 'S.Am',
        apiRegion: 'South America',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4h-2V9h4v8zm0-10h-2V5h2v2z',
            isMobile
        ),
    },
    {
        name: 'Australia',
        shortName: 'Aus',
        apiRegion: 'Australia',
        icon: getIcon(
            'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h-2v-2h2V9h2v4h2v2h-2v2zm0-8h-2V7h2v2z',
            isMobile
        ),
    },
];

// Mobile-optimized chart options with better touch response
const getChartOptions = (isMobile: boolean, isDarkTheme: boolean) => ({
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    animation: {
        duration: isMobile ? 300 : 800,
    },
    elements: {
        point: {
            radius: isMobile ? 1.5 : 3,
            hoverRadius: isMobile ? 4 : 6,
            hitRadius: isMobile ? 10 : 6,
        },
        line: {
            tension: 0.3,
            borderWidth: isMobile ? 1.5 : 3,
        },
    },
    plugins: {
        legend: {
            position: isMobile ? 'bottom' : 'top' as const,
            align: 'center' as const,
            labels: {
                usePointStyle: true,
                boxWidth: isMobile ? 6 : 8,
                boxHeight: isMobile ? 6 : 8,
                padding: isMobile ? 8 : 20,
                color: isDarkTheme ? '#E5E7EB' : '#374151',
                font: {
                    size: isMobile ? 9 : 12,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                },
            },
            onClick: function (e: any, legendItem: any, legend: any) {
                const index = legendItem.datasetIndex;
                const ci = legend.chart;
                const meta = ci.getDatasetMeta(index);
                meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                ci.update();
                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                }
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: isDarkTheme ? '#E5E7EB' : '#1f2937',
            bodyColor: isDarkTheme ? '#D1D5DB' : '#374151',
            borderColor: isDarkTheme ? '#4B5563' : '#e5e7eb',
            borderWidth: 1,
            cornerRadius: 8,
            padding: isMobile ? 8 : 10,
            displayColors: false,
            boxPadding: isMobile ? 3 : 6,
            titleFont: {
                size: isMobile ? 10 : 14,
                weight: 'bold',
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            bodyFont: {
                size: isMobile ? 9 : 12,
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            callbacks: {
                title: function (context: any) {
                    return context[0].label;
                },
                label: function (context: any) {
                    const label = context.dataset.label || '';
                    return `${label}: ${Math.round(context.parsed.y * 10) / 10}`;
                },
            },
        },
        zoom: {
            pan: {
                enabled: true,
                mode: 'xy' as const,
                threshold: 10,
                onPanStart: () => {
                    if (typeof document !== 'undefined') {
                        document.body.style.overflow = 'hidden';
                    }
                },
                onPanComplete: () => {
                    if (typeof document !== 'undefined') {
                        document.body.style.overflow = '';
                    }
                },
            },
            zoom: {
                pinch: {
                    enabled: true,
                },
                wheel: {
                    enabled: !isMobile,
                },
                mode: 'xy' as const,
                sensitivity: isMobile ? 5 : 3,
                speed: 0.05,
            },
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: {
                display: !isMobile,
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            border: {
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            },
            title: {
                display: false,
                text: 'Value',
            },
            ticks: {
                maxTicksLimit: isMobile ? 5 : 8,
                font: {
                    size: isMobile ? 8 : 11,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                },
                color: isDarkTheme ? '#D1D5DB' : '#374151',
                padding: isMobile ? 2 : 5,
                callback: function (value: any) {
                    return isMobile ? Math.round(value) : value;
                },
            },
        },
        x: {
            grid: {
                display: false,
            },
            border: {
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            },
            title: {
                display: false,
            },
            ticks: {
                maxTicksLimit: isMobile ? 4 : 10,
                font: {
                    size: isMobile ? 8 : 11,
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                },
                color: isDarkTheme ? '#D1D5DB' : '#374151',
                padding: isMobile ? 0 : 5,
                maxRotation: isMobile ? 0 : 0,
                minRotation: 0,
                align: 'center' as const,
            },
        },
    },
    interaction: {
        mode: isMobile ? 'nearest' : 'index' as const,
        intersect: isMobile,
        axis: 'xy' as const,
    },
    layout: {
        padding: {
            top: isMobile ? 0 : 10,
            bottom: isMobile ? 0 : 10,
            left: isMobile ? 0 : 10,
            right: isMobile ? 5 : 10,
        },
    },
});

// Main App Component
const InternetBandwidthVisualizer: React.FC = () => {
    const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any>(null);
    const [isDarkTheme, setIsDarkTheme] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTabsOverflowing, setIsTabsOverflowing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [currentMetrics, setCurrentMetrics] = useState<RegionalMetrics | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const continents = getContinents(isMobile);

    useLayoutEffect(() => {
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        viewportMeta.setAttribute(
            'content',
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
        document.body.style.touchAction = 'manipulation';
        document.body.style.overscrollBehavior = 'none';
        return () => {
            document.body.style.touchAction = '';
            document.body.style.overscrollBehavior = '';
        };
    }, []);

    useEffect(() => {
        const checkMobileAndOrientation = () => {
            const isMobileDevice =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth < 768 ||
                ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);

            setIsMobile(isMobileDevice);
            setIsLandscape(window.innerWidth > window.innerHeight);

            if (tabsContainerRef.current) {
                const container = tabsContainerRef.current;
                setIsTabsOverflowing(container.scrollWidth > container.clientWidth);
            }
        };

        checkMobileAndOrientation();

        window.addEventListener('resize', checkMobileAndOrientation);
        window.addEventListener('orientationchange', checkMobileAndOrientation);

        return () => {
            window.removeEventListener('resize', checkMobileAndOrientation);
            window.removeEventListener('orientationchange', checkMobileAndOrientation);
        };
    }, []);

    const getApiRegionForContinent = (continentName: string | null): string | null => {
        if (!continentName) return null;
        const continent = continents.find((c) => c.name === continentName);
        return continent ? continent.apiRegion : null;
    };

    useEffect(() => {
        let isMounted = true;
        const apiRegion = getApiRegionForContinent(selectedContinent);

        const fetchData = async () => {
            try {
                setIsRefreshing(true);
                setErrorMessage(null);

                const metrics = await SpeedTestAPI.getRegionalMetrics(apiRegion);

                if (isMounted) {
                    setCurrentMetrics(metrics);
                    setLastUpdated(new Date());
                    setIsLoaded(true);
                    setIsRefreshing(false);

                    updateChartWithRealData(metrics);
                }
            } catch (error) {
                console.error('Error fetching metrics:', error);
                if (isMounted) {
                    setErrorMessage('Could not load internet metrics. Using simulated data.');
                    setIsRefreshing(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [selectedContinent]);

    const updateChartWithRealData = (metrics: RegionalMetrics) => {
        if (!metrics || !metrics.historicalData || metrics.historicalData.length === 0) return;

        const dataPoints = isMobile ? (isLandscape ? 6 : 5) : 10;

        const recentData = metrics.historicalData.slice(0, dataPoints);

        const labels = recentData.map((item) => {
            const date = new Date(item.timestamp);
            return isMobile
                ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
                : `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        });

        const bandwidthData = recentData.map((item) => item.download);
        const latencyData = recentData.map((item) => item.ping);

        setChartData({
            labels: labels.reverse(),
            datasets: [
                {
                    label: isMobile ? 'Bandwidth' : 'Bandwidth (Mbps)',
                    data: bandwidthData.reverse(),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    fill: isMobile ? true : false,
                    tension: 0.3,
                    pointRadius: isMobile ? 1.5 : 3,
                    pointHoverRadius: isMobile ? 4 : 6,
                    borderWidth: isMobile ? 1.5 : 3,
                    cubicInterpolationMode: 'monotone',
                },
                {
                    label: isMobile ? 'Latency' : 'Latency (ms)',
                    data: latencyData.reverse(),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: isMobile ? true : false,
                    tension: 0.3,
                    pointRadius: isMobile ? 1.5 : 3,
                    pointHoverRadius: isMobile ? 4 : 6,
                    borderWidth: isMobile ? 1.5 : 3,
                    cubicInterpolationMode: 'monotone',
                },
            ],
        });
    };

    const handleRefreshData = async () => {
        if (isRefreshing) return;

        try {
            setIsRefreshing(true);
            setErrorMessage(null);

            const apiRegion = getApiRegionForContinent(selectedContinent);
            const cacheKey = apiRegion || 'global';
            dataCache.delete(cacheKey);

            const metrics = await SpeedTestAPI.getRegionalMetrics(apiRegion);
            setCurrentMetrics(metrics);
            setLastUpdated(new Date());
            updateChartWithRealData(metrics);

            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            setErrorMessage('Failed to refresh data. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    };

    const scrollToTab = (direction: 'left' | 'right') => {
        if (tabsContainerRef.current) {
            const container = tabsContainerRef.current;
            const scrollAmount = container.clientWidth * 0.8;
            const newScrollPosition =
                direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount;

            container.scrollTo({
                left: newScrollPosition,
                behavior: 'smooth',
            });

            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(30);
            }
        }
    };

    useEffect(() => {
        if (selectedContinent && tabsContainerRef.current) {
            const selectedTab = tabsContainerRef.current.querySelector(
                `button[data-continent="${selectedContinent}"]`
            ) as HTMLElement;
            if (selectedTab) {
                selectedTab.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }
    }, [selectedContinent]);

    const handleResetZoom = () => {
        if (chartRef.current) {
            chartRef.current.resetZoom();
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }
    };

    return (
        <main
            className={`flex flex-col min-h-screen w-full ${isDarkTheme
                    ? 'bg-gradient-to-b from-slate-900 to-gray-900 text-white'
                    : 'bg-gradient-to-b from-gray-50 to-gray-200 text-gray-900'
                } font-sans antialiased`}
            style={{
                touchAction: 'pan-x pan-y',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            <header
                className="sticky top-0 z-30 flex items-center justify-between w-full px-3 py-2 sm:p-4 bg-opacity-90"
                style={{
                    background: isDarkTheme ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
            >
                <h1
                    className="text-lg sm:text-xl md:text-2xl font-bold"
                    aria-label="Global Internet Bandwidth Visualizer"
                    style={{ marginBottom: 0 }}
                >
                    {isMobile ? 'Bandwidth' : 'Bandwidth Monitor'}
                </h1>

                <div className="flex items-center space-x-2">
                    <motion.button
                        className={`p-1 sm:p-2 rounded-full ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                            } ${isRefreshing ? 'opacity-50' : ''}`}
                        onClick={handleRefreshData}
                        disabled={isRefreshing}
                        aria-label="Refresh data"
                        whileTap={{ scale: 0.9 }}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <svg
                            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </motion.button>

                    {isLoaded && chartRef.current && (
                        <motion.button
                            className={`p-1 sm:p-2 rounded-full ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                                }`}
                            onClick={handleResetZoom}
                            aria-label="Reset chart zoom"
                            whileTap={{ scale: 0.9 }}
                            style={{ touchAction: 'manipulation' }}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3v6zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6v-6z" />
                            </svg>
                        </motion.button>
                    )}

                    <motion.button
                        className={`p-1 sm:p-2 rounded-full ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                            }`}
                        onClick={() => setIsDarkTheme(!isDarkTheme)}
                        aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
                        whileTap={{ scale: 0.9 }}
                        style={{ touchAction: 'manipulation' }}
                    >
                        {isDarkTheme ? '☀️' : '🌙'}
                    </motion.button>
                </div>
            </header>

            <section
                className="relative flex flex-col flex-1 w-full max-w-4xl mx-auto px-2 py-1 sm:p-4"
                style={{
                    paddingBottom: isMobile ? (isDrawerOpen ? '0' : '40px') : '0',
                    transition: 'padding-bottom 0.3s ease',
                }}
            >
                <div className="relative mb-2 sm:mb-4">
                    {isMobile && isTabsOverflowing && (
                        <>
                            <motion.button
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-gray-800/60 text-white"
                                onClick={() => scrollToTab('left')}
                                whileTap={{ scale: 0.9 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                                style={{ touchAction: 'manipulation' }}
                                aria-label="Scroll tabs left"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                                </svg>
                            </motion.button>

                            <motion.button
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-gray-800/60 text-white"
                                onClick={() => scrollToTab('right')}
                                whileTap={{ scale: 0.9 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                                style={{ touchAction: 'manipulation' }}
                                aria-label="Scroll tabs right"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                                </svg>
                            </motion.button>
                        </>
                    )}

                    <div className="relative">
                        {isTabsOverflowing && (
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
                        )}

                        <div
                            ref={tabsContainerRef}
                            className="flex overflow-x-auto scrollbar-none py-1 space-x-1 sm:space-x-2"
                            role="tablist"
                            aria-label="Continent selection tabs"
                            style={{
                                msOverflowStyle: 'none',
                                scrollbarWidth: 'none',
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {continents.map((continent) => (
                                <motion.button
                                    key={continent.name}
                                    data-continent={continent.name}
                                    className={`flex items-center justify-center space-x-1 px-3 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${selectedContinent === continent.name
                                            ? `bg-blue-600 text-white shadow-md ${isDarkTheme ? '' : 'bg-opacity-90'}`
                                            : `${isDarkTheme
                                                ? 'bg-gray-800/50 text-gray-200 hover:bg-gray-700/70'
                                                : 'bg-gray-200/80 text-gray-800 hover:bg-gray-300/80'
                                            }`
                                        }`}
                                    onClick={() =>
                                        setSelectedContinent(
                                            selectedContinent === continent.name ? null : continent.name
                                        )
                                    }
                                    role="tab"
                                    aria-selected={selectedContinent === continent.name}
                                    aria-label={`Select ${continent.name}`}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{ touchAction: 'manipulation' }}
                                >
                                    {continent.icon}
                                    <span>{isMobile ? continent.shortName : continent.name}</span>
                                </motion.button>
                            ))}
                        </div>

                        {isTabsOverflowing && (
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
                        )}
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-2 px-3 py-2 text-xs text-amber-900 bg-amber-100 rounded-md dark:bg-amber-900/40 dark:text-amber-100">
                        {errorMessage}
                    </div>
                )}

                <article
                    className={`relative flex-1 w-full rounded-lg ${isDarkTheme ? 'bg-gray-800/30' : 'bg-white/80'
                        } backdrop-blur-sm`}
                    style={{
                        height: isMobile ? (isLandscape ? '40vh' : '50vh') : '60vh',
                        boxShadow: isDarkTheme
                            ? '0 4px 6px rgba(0, 0, 0, 0.2)'
                            : '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'height 0.3s ease',
                    }}
                >
                    {!isLoaded || !chartData ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <div className="w-full max-w-md space-y-4">
                                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-3/4 mx-auto animate-pulse"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full w-1/2 mx-auto animate-pulse"></div>
                                <div className="h-40 sm:h-64 md:h-80 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isMobile && (
                                <div
                                    className="absolute inset-0 z-10 opacity-0"
                                    style={{ touchAction: 'pan-x pan-y' }}
                                />
                            )}

                            <div className="absolute inset-0 p-2 sm:p-4">
                                <Line
                                    ref={chartRef}
                                    data={chartData}
                                    options={getChartOptions(isMobile, isDarkTheme)}
                                    aria-label="Bandwidth and Latency Chart"
                                />
                            </div>
                        </>
                    )}

                    {selectedContinent && (
                        <div
                            className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
                                }`}
                        >
                            {selectedContinent}
                        </div>
                    )}

                    {lastUpdated && (
                        <div
                            className={`absolute bottom-2 right-2 px-2 py-1 text-xs rounded-full ${isDarkTheme ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
                                }`}
                        >
                            {isRefreshing
                                ? 'Updating...'
                                : `Updated: ${lastUpdated.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}`}
                        </div>
                    )}
                </article>

                <footer
                    className="text-center mt-2 sm:mt-3 text-xs text-gray-400 dark:text-gray-500"
                    aria-label="Data status"
                    style={{ marginBottom: isMobile ? '4px' : '8px' }}
                >
                    {selectedContinent
                        ? `${isMobile ? '' : 'Showing data for'} ${selectedContinent}`
                        : `${isMobile ? '' : 'Showing'} global average`}

                    {currentMetrics && ` • ${currentMetrics.samples} samples`}
                </footer>
            </section>

            <motion.div
                className="fixed bottom-0 left-0 right-0 z-20 w-full max-w-4xl mx-auto rounded-t-xl"
                style={{
                    background: isDarkTheme ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.12)',
                    touchAction: 'none',
                }}
                initial={{ y: '90%' }}
                animate={{ y: isDrawerOpen ? 0 : '93%' }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                }}
            >
                <div className="relative h-1">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-10 h-10 flex items-center justify-center"
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <div className="w-12 h-1 rounded-full bg-gray-400" />
                    </div>
                </div>

                <div
                    className="w-full flex items-center justify-between px-3 py-3"
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    style={{ touchAction: 'manipulation' }}
                >
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {isDrawerOpen ? 'Hide Details' : 'Internet Speed Data'}
                    </div>

                    <motion.div initial={{ rotate: 0 }} animate={{ rotate: isDrawerOpen ? 180 : 0 }}>
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                        </svg>
                    </motion.div>
                </div>

                <AnimatePresence>
                    {isDrawerOpen && (
                        <motion.div
                            className="p-3 text-gray-500 dark:text-gray-400 overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentMetrics ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 mb-3 text-center">
                                        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                            {currentMetrics.region} Internet Metrics
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded text-left">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Avg Download
                                                </div>
                                                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {currentMetrics.averageDownload.toFixed(1)} Mbps
                                                </div>
                                            </div>
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded text-left">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Avg Upload
                                                </div>
                                                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                    {currentMetrics.averageUpload.toFixed(1)} Mbps
                                                </div>
                                            </div>
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded text-left">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Avg Latency
                                                </div>
                                                <div className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                                                    {currentMetrics.averagePing.toFixed(0)} ms
                                                </div>
                                            </div>
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded text-left">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Data Points
                                                </div>
                                                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                                    {currentMetrics.samples}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {continents.map((continent) => {
                                            const metrics =
                                                SpeedTestAPI.fallbackData[
                                                continent.name as keyof typeof SpeedTestAPI.fallbackData
                                                ];

                                            return (
                                                <div
                                                    key={`stats-${continent.name}`}
                                                    className={`p-2 rounded-lg ${isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'
                                                        } flex flex-col items-center`}
                                                >
                                                    <div className="flex items-center space-x-1 mb-1">
                                                        {continent.icon}
                                                        <span className="font-medium">
                                                            {isMobile ? continent.shortName : continent.name}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 w-full">
                                                        <div className="text-emerald-500">
                                                            ↓{metrics.download.toFixed(1)}M
                                                        </div>
                                                        <div className="text-rose-500">
                                                            ↑{metrics.ping.toFixed(0)}ms
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="text-xs text-center mt-2 text-gray-400">
                                        Data represents global internet speed measurements from April 2025.
                                        <br />
                                        Tap the refresh button to update with latest measurements.
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="h-safe-bottom bg-transparent" style={{ height: 'env(safe-area-inset-bottom)' }} />
            </motion.div>
        </main>
    );
};

export default InternetBandwidthVisualizer;
import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, ReferenceLine } from 'recharts';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Bell, BellOff, Thermometer, Droplets, Sprout, Sun, Leaf, Wind } from 'lucide-react';

// Animation utilities for organic motion
const animations = {
  breathing: {
    animate: {
      scale: [1, 1.02, 1],
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const,
        duration: 3,
        ease: "easeInOut"
      }
    }
  },
  gentleWave: {
    animate: {
      y: [0, -3, 0, 3, 0],
      transition: {
        repeat: Infinity,
        duration: 5,
        ease: "easeInOut"
      }
    }
  },
  growAndShrink: {
    initial: { scale: 0.97, opacity: 0.7 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 1.5,
        ease: "easeOut"
      }
    }
  },
  alertPulse: {
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(239, 83, 80, 0)',
        '0 0 0 10px rgba(239, 83, 80, 0.2)',
        '0 0 0 0 rgba(239, 83, 80, 0)'
      ],
      transition: { 
        repeat: Infinity, 
        duration: 2,
        ease: "easeInOut" 
      }
    }
  },
  waterFlow: {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: { 
        repeat: Infinity,
        repeatType: "loop" as const,
        duration: 10,
        ease: "linear"
      }
    }
  }
};

// Custom fonts for the UI
const fonts = {
    heading: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
    body: "'Inter', 'Roboto', 'Helvetica', sans-serif",
    readings: "'SF Mono', 'Roboto Mono', 'Consolas', monospace",
    labels: "'Product Sans', 'Nunito', 'Helvetica', sans-serif"
};

// Custom greenhouse color palette
const colors = {
    // Primary brand colors
    primary: {
        lighter: '#e0f2f1', // Light mint
        light: '#b2dfdb',   // Soft mint
        main: '#26a69a',    // Garden green
        dark: '#00796b',    // Deep forest
        darker: '#004d40',  // Dark forest
    },
    // Sensor-specific colors
    temperature: {
        main: '#ff7043',    // Warm orange
        light: '#ffccbc',
        alert: '#ff3d00',   // Alert orange-red
    },
    humidity: {
        main: '#29b6f6',    // Sky blue
        light: '#b3e5fc',
        alert: '#0277bd',   // Deep blue
    },
    soil: {
        main: '#8d6e63',    // Earth brown
        light: '#d7ccc8',
        alert: '#5d4037',   // Deep soil
    },
    // Alert status colors
    status: {
        success: '#66bb6a',  // Healthy green
        warning: '#ffa726',  // Warning amber
        error: '#ef5350',    // Error red
        info: '#42a5f5',     // Info blue
    },
    // Neutral colors for UI
    neutral: {
        white: '#ffffff',
        background: '#f8f9fa',
        light: '#eceff1',
        border: '#cfd8dc',
        text: {
            primary: '#37474f',
            secondary: '#78909c',
            disabled: '#b0bec5',
        }
    }
};

// Define interfaces for our data structures
interface SensorReading {
    value: number;
    timestamp: number;
}

interface SensorData {
    id: string;
    name: string;
    currentValue: number;
    unit: string;
    minThreshold: number;
    maxThreshold: number;
    icon: React.ReactNode;
    history: SensorReading[];
    color: string;
}

// Main dashboard component
const GreenhouseDashboard: React.FC = () => {
    // State for sensor data
    const [sensors, setSensors] = useState<SensorData[]>([]);
    const [alertsSilenced, setAlertsSilenced] = useState<boolean>(false);
    const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

    // Simulate fetching sensor data
    useEffect(() => {
        // Create historical data for the past 10 minutes (60 points at 10-second intervals)
        const createHistoricalData = (baseValue: number, variance: number, minThreshold: number, maxThreshold: number) => {
            const now = Date.now();
            const tenMinutesAgo = now - 10 * 60 * 1000;

            return Array.from({ length: 60 }, (_, i) => {
                // Generate a timestamp for each point, going from 10 minutes ago to now
                const timestamp = tenMinutesAgo + (i * 10000);

                // Simulate more realistic data with occasional out-of-range values
                let value;
                if (Math.random() > 0.95) {
                    // Occasionally generate out-of-range values
                    value = Math.random() > 0.5 ? maxThreshold + Math.random() * 5 : minThreshold - Math.random() * 5;
                } else {
                    // Normal range with random variation
                    value = baseValue + (Math.random() * variance * 2 - variance);
                }

                return { value: Number(value.toFixed(1)), timestamp };
            });
        };

        // Initial data setup with pre-populated history
        const initialSensors: SensorData[] = [
            {
                id: 'temp-1',
                name: 'Temperature Zone 1',
                currentValue: 22.5,
                unit: '°C',
                minThreshold: 18,
                maxThreshold: 28,
                icon: <Thermometer className="w-6 h-6" />,
                history: createHistoricalData(22.5, 0.5, 18, 28),
                color: 'text-orange-500',
            },
            {
                id: 'temp-2',
                name: 'Temperature Zone 2',
                currentValue: 24.2,
                unit: '°C',
                minThreshold: 18,
                maxThreshold: 28,
                icon: <Thermometer className="w-6 h-6" />,
                history: createHistoricalData(24.2, 0.5, 18, 28),
                color: 'text-orange-500',
            },
            {
                id: 'humidity-1',
                name: 'Humidity Zone 1',
                currentValue: 65,
                unit: '%',
                minThreshold: 40,
                maxThreshold: 80,
                icon: <Droplets className="w-6 h-6" />,
                history: createHistoricalData(65, 2, 40, 80),
                color: 'text-blue-500',
            },
            {
                id: 'humidity-2',
                name: 'Humidity Zone 2',
                currentValue: 58,
                unit: '%',
                minThreshold: 40,
                maxThreshold: 80,
                icon: <Droplets className="w-6 h-6" />,
                history: createHistoricalData(58, 2, 40, 80),
                color: 'text-blue-500',
            },
            {
                id: 'soil-1',
                name: 'Soil Moisture Bed 1',
                currentValue: 35,
                unit: '%',
                minThreshold: 20,
                maxThreshold: 60,
                icon: <Sprout className="w-6 h-6" />,
                history: createHistoricalData(35, 2, 20, 60),
                color: 'text-green-500',
            },
            {
                id: 'soil-2',
                name: 'Soil Moisture Bed 2',
                currentValue: 42,
                unit: '%',
                minThreshold: 20,
                maxThreshold: 60,
                icon: <Sprout className="w-6 h-6" />,
                history: createHistoricalData(42, 2, 20, 60),
                color: 'text-green-500',
            },
        ];

        // Update the current values to match the latest historical data point
        initialSensors.forEach(sensor => {
            if (sensor.history.length > 0) {
                sensor.currentValue = sensor.history[sensor.history.length - 1].value;
            }
        });

        setSensors(initialSensors);

        // Simulate real-time data updates
        const interval = setInterval(() => {
            setSensors(prevSensors => {
                return prevSensors.map(sensor => {
                    // Simulate random value fluctuation
                    const variance = sensor.id.includes('temp') ? 0.5 : 2;
                    const newValue = sensor.currentValue + (Math.random() * variance * 2 - variance);

                    // Occasionally simulate out-of-range values for testing alerts
                    const specialValue = Math.random() > 0.95
                        ? (Math.random() > 0.5 ? sensor.maxThreshold + 5 : sensor.minThreshold - 5)
                        : newValue;

                    // Cap history at 60 points (10 minutes with 10-second updates)
                    const newHistory = [
                        ...sensor.history,
                        { value: specialValue, timestamp: Date.now() },
                    ].slice(-60);

                    return {
                        ...sensor,
                        currentValue: Number(specialValue.toFixed(1)),
                        history: newHistory,
                    };
                });
            });
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Check for alerts when sensor data changes
    useEffect(() => {
        const alerts = sensors
            .filter(sensor =>
                sensor.currentValue < sensor.minThreshold ||
                sensor.currentValue > sensor.maxThreshold
            )
            .map(sensor => sensor.id);

        setActiveAlerts(alerts);
    }, [sensors]);

    // Handle alert sound or notification (just a placeholder)
    useEffect(() => {
        if (activeAlerts.length > 0 && !alertsSilenced) {
            // In a real implementation, this could be an actual sound or notification system
            console.log('Alert! Sensors out of range:', activeAlerts);
        }
    }, [activeAlerts, alertsSilenced]);

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: colors.primary.lighter, fontFamily: fonts.body }}>
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <motion.div
                            {...animations.gentleWave}
                        >
                            <Leaf size={32} style={{ color: colors.primary.dark }} />
                        </motion.div>
                        <h1 className="text-3xl font-bold" style={{
                            color: colors.neutral.text.primary,
                            fontFamily: fonts.heading,
                            letterSpacing: '-0.025em'
                        }}>Greenhouse Monitoring</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <motion.button
                            onClick={() => setAlertsSilenced(!alertsSilenced)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200"
                            whileTap={{ scale: 0.97 }}
                            style={{
                                backgroundColor: alertsSilenced ? colors.neutral.border : colors.status.error,
                                color: alertsSilenced ? colors.neutral.text.secondary : colors.neutral.white,
                                fontFamily: fonts.labels,
                                fontWeight: 500
                            }}
                        >
                            {alertsSilenced ? (
                                <>
                                    <BellOff size={18} />
                                    <span>Alerts Silenced</span>
                                </>
                            ) : (
                                <>
                                    <Bell size={18} />
                                    <span>Silence Alerts</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                <AnimatePresence>
                    {activeAlerts.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4"
                        >
                            <motion.div 
                                className="p-4 rounded-md flex items-center"
                                {...(alertsSilenced ? {} : animations.alertPulse)}
                                style={{
                                    backgroundColor: `${colors.status.error}20`,
                                    borderLeft: `4px solid ${colors.status.error}`,
                                    color: colors.status.error,
                                    fontFamily: fonts.labels
                                }}>
                                <motion.div
                                    animate={{ 
                                        rotate: alertsSilenced ? 0 : [-5, 5, -5, 5, 0],
                                    }}
                                    transition={{ 
                                        repeat: Infinity, 
                                        repeatDelay: 3,
                                        duration: 0.5 
                                    }}
                                >
                                    <Bell className="h-5 w-5 mr-2" />
                                </motion.div>
                                <p>
                                    <span style={{ fontWeight: 600 }}>Warning:</span> {activeAlerts.length} {activeAlerts.length === 1 ? 'sensor' : 'sensors'} reporting out of range values
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.map(sensor => (
                    <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        isAlerting={activeAlerts.includes(sensor.id)}
                    />
                ))}
            </div>

            <footer className="mt-8 text-center" style={{
                color: colors.neutral.text.secondary,
                fontFamily: fonts.labels,
                fontSize: '0.85rem'
            }}>
                <div className="flex items-center justify-center gap-1">
                    <Sun size={16} />
                    <p>Last updated: {new Date().toLocaleString()}</p>
                </div>
            </footer>
        </div>
    );
};

// Individual sensor card component
const SensorCard: React.FC<{
    sensor: SensorData;
    isAlerting: boolean;
}> = ({ sensor, isAlerting }) => {
    const isOutOfRange =
        sensor.currentValue < sensor.minThreshold ||
        sensor.currentValue > sensor.maxThreshold;

    // Determine the color theme and animation style based on sensor type
    const getSensorColors = () => {
        if (sensor.id.includes('temp')) {
            return {
                main: colors.temperature.main,
                light: colors.temperature.light,
                alert: colors.temperature.alert,
                animationType: "temperature"
            };
        } else if (sensor.id.includes('humidity')) {
            return {
                main: colors.humidity.main,
                light: colors.humidity.light,
                alert: colors.humidity.alert,
                animationType: "humidity"
            };
        } else {
            return {
                main: colors.soil.main,
                light: colors.soil.light,
                alert: colors.soil.alert,
                animationType: "soil"
            };
        }
    };

    const sensorColors = getSensorColors();
    
    // Generate nature-inspired animation based on sensor type and status
    const getNatureAnimation = () => {
        // If alerting, all sensors get more pronounced animations
        if (isAlerting) {
            return animations.alertPulse;
        }
        
        // When in normal range, use gentle, natural animations based on sensor type
        switch(sensorColors.animationType) {
            case "temperature":
                // Subtle heat shimmer effect
                return {
                    animate: {
                        filter: ["blur(0px)", "blur(0.3px)", "blur(0px)"],
                        transition: {
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut"
                        }
                    }
                };
            case "humidity":
                // Gentle water ripple effect
                return animations.gentleWave;
            case "soil":
                // Plant breathing/growing effect
                return animations.breathing;
            default:
                return {};
        }
    };

    // Determine card border style based on alert state
    const cardStyles = {
        boxShadow: isAlerting
            ? `0 4px 6px -1px ${sensorColors.alert}40, 0 2px 4px -1px ${sensorColors.alert}20`
            : `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`,
        borderLeft: isAlerting
            ? `4px solid ${sensorColors.alert}`
            : `4px solid ${sensorColors.main}`,
        backgroundColor: colors.neutral.white,
    };

    // Animation variants for the card
    const cardVariants = {
        hover: {
            y: -5,
            boxShadow: `0 10px 15px -3px ${sensorColors.main}20, 0 4px 6px -2px ${sensorColors.main}10`,
            transition: { duration: 0.2 }
        }
    };
    
    // Get the appropriate nature animation
    const natureAnimation = getNatureAnimation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover="hover"
            variants={cardVariants}
            className="rounded-lg overflow-hidden"
            style={cardStyles}
        >
            <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                        <motion.div {...(isAlerting ? {} : natureAnimation)}>
                            <div style={{ color: sensorColors.main }}>{sensor.icon}</div>
                        </motion.div>
                        <h3 className="ml-2 text-lg font-medium" style={{
                            color: colors.neutral.text.primary,
                            fontFamily: fonts.heading
                        }}>
                            {sensor.name}
                        </h3>
                    </div>
                    {isAlerting && (
                        <motion.div
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [-5, 0, 5, 0, -5]
                            }}
                            transition={{ 
                                scale: { repeat: Infinity, duration: 1.5 },
                                rotate: { repeat: Infinity, duration: 2 }
                            }}
                        >
                            <Bell className="h-5 w-5" style={{ color: sensorColors.alert }} />
                        </motion.div>
                    )}
                </div>

                <motion.div 
                    className="flex items-end space-x-2"
                    {...(isOutOfRange ? {} : natureAnimation)}
                >
                    <span
                        className={`text-4xl font-bold ${isOutOfRange ? "relative" : ""}`}
                        style={{
                            color: isOutOfRange ? sensorColors.alert : sensorColors.main,
                            fontFamily: fonts.readings,
                            letterSpacing: '-0.02em'
                        }}
                    >
                        {isOutOfRange && (
                            <motion.div 
                                className="absolute inset-0 rounded"
                                style={{
                                    backgroundColor: `${sensorColors.alert}20`,
                                    transform: "scale(1.1)",
                                    zIndex: -1,
                                }}
                                animate={{ 
                                    opacity: [0.2, 0.8, 0.2],
                                    scale: [1.1, 1.15, 1.1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2
                                }}
                            />
                        )}
                        {sensor.currentValue}
                        {isOutOfRange && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full"
                                style={{ backgroundColor: sensorColors.alert }}
                            >
                                <motion.span 
                                    className="text-xs font-bold text-white"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    !
                                </motion.span>
                            </motion.div>
                        )}
                    </span>
                    <span style={{
                        color: colors.neutral.text.secondary,
                        fontFamily: fonts.readings
                    }} className="mb-1">{sensor.unit}</span>
                </motion.div>

                <div className="mt-1 text-sm" style={{
                    color: colors.neutral.text.secondary,
                    fontFamily: fonts.body
                }}>
                    Range: {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                </div>

                <div className="mt-4 h-16">
                    {sensor.history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sensor.history.map((reading, i) => ({ name: i, value: reading.value }))}>
                                <YAxis
                                    domain={[ 
                                        Math.min(sensor.minThreshold - 5, Math.min(...sensor.history.map(h => h.value))),
                                        Math.max(sensor.maxThreshold + 5, Math.max(...sensor.history.map(h => h.value)))
                                    ]}
                                    hide
                                />
                                <ReferenceLine
                                    y={sensor.minThreshold}
                                    stroke={sensorColors.alert}
                                    strokeDasharray="3 3"
                                    strokeWidth={1}
                                    opacity={0.7}
                                />
                                <ReferenceLine
                                    y={sensor.maxThreshold}
                                    stroke={sensorColors.alert}
                                    strokeDasharray="3 3"
                                    strokeWidth={1}
                                    opacity={0.7}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isOutOfRange ? sensorColors.alert : sensorColors.main}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                    connectNulls={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full" style={{
                            color: colors.neutral.text.disabled,
                            fontFamily: fonts.body
                        }}>
                            <p>Collecting data...</p>
                        </div>
                    )}
                </div>
            </div>

            <motion.div 
                style={{
                    backgroundColor: sensorColors.light,
                    color: sensorColors.main,
                    fontFamily: fonts.labels,
                    backgroundImage: sensorColors.animationType === "humidity" && !isAlerting ? 
                        `linear-gradient(to right, ${sensorColors.light}, ${sensorColors.light}DD, ${sensorColors.light})` : 
                        "none"
                }} 
                className="px-5 py-2"
                {...(sensorColors.animationType === "humidity" && !isAlerting ? animations.waterFlow : {})}
            >
                <div className="text-xs font-medium flex items-center gap-1">
                    <motion.span animate={isAlerting ? { opacity: [0.7, 1, 0.7] } : {}} 
                        transition={{ repeat: Infinity, duration: 2 }}>
                        Last 10 minutes trend
                    </motion.span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GreenhouseDashboard;
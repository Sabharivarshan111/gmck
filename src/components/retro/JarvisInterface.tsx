
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function JarvisInterface() {
  const { theme } = useTheme();
  const [rotation, setRotation] = useState(0);
  const [systemStatus, setSystemStatus] = useState("Initializing...");
  const [statusMessages, setStatusMessages] = useState<string[]>([]);

  // Only show Jarvis interface in retro theme
  if (theme !== "retro") {
    return null;
  }

  // Create rotating animation effect
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(rotationInterval);
  }, []);

  // Simulate boot sequence
  useEffect(() => {
    if (theme === "retro") {
      setSystemStatus("Initializing...");
      setStatusMessages([]);

      const messages = [
        "Booting J.A.R.V.I.S. OS v4.2.1...",
        "Initializing neural interface...",
        "Connecting to main server...",
        "Scanning primary systems...",
        "Calibrating quantum processors...",
        "Checking security protocols...",
        "Loading AI modules...",
        "System operational."
      ];

      let index = 0;
      const messageInterval = setInterval(() => {
        if (index < messages.length) {
          setStatusMessages(prev => [...prev, messages[index]]);
          index++;
        } else {
          setSystemStatus("Online");
          clearInterval(messageInterval);
        }
      }, 800);

      return () => clearInterval(messageInterval);
    }
  }, [theme]);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-10">
      {/* Outer scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none retro-scanlines"></div>
      
      {/* HUD overlays - corners */}
      <div className="absolute top-4 left-4 border-l-2 border-t-2 w-20 h-20 border-orange-500 opacity-70"></div>
      <div className="absolute top-4 right-4 border-r-2 border-t-2 w-20 h-20 border-orange-500 opacity-70"></div>
      <div className="absolute bottom-4 left-4 border-l-2 border-b-2 w-20 h-20 border-orange-500 opacity-70"></div>
      <div className="absolute bottom-4 right-4 border-r-2 border-b-2 w-20 h-20 border-orange-500 opacity-70"></div>
      
      {/* Central Jarvis core element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative">
          {/* Outer rings */}
          <div 
            className="w-40 h-40 rounded-full border-2 border-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30"
            style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
          ></div>
          <div 
            className="w-32 h-32 rounded-full border-2 border-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-40"
            style={{ transform: `translate(-50%, -50%) rotate(${-rotation * 1.5}deg)` }}
          ></div>
          
          {/* Inner core */}
          <div className="w-24 h-24 rounded-full bg-navy-900 border-4 border-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 pulsing-core flex items-center justify-center">
              <div className="text-orange-500 font-mono">{systemStatus === "Online" ? "ONLINE" : "INIT"}</div>
            </div>
          </div>
          
          {/* Rotating markers */}
          <div 
            className="absolute top-1/2 left-1/2 w-48 h-48 transform -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(-50%, -50%) rotate(${rotation * 0.5}deg)` }}
          >
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 bg-orange-500 rounded-full"
                style={{ 
                  transform: `rotate(${deg}deg) translateY(-22px)`,
                  opacity: (i % 2 === 0) ? 0.8 : 0.4
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Status console - positioned on bottom */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-96 max-h-40 overflow-hidden">
        <div className="bg-navy-900/40 border border-orange-500/30 p-3 rounded font-mono text-xs">
          <div className="text-orange-500 border-b border-orange-500/30 pb-1 mb-2 text-sm flex justify-between">
            <span>J.A.R.V.I.S</span>
            <span className="text-orange-300">v4.2.1</span>
          </div>
          
          <div className="text-orange-400 space-y-1 h-24 overflow-y-auto retro-console-text">
            {statusMessages.map((msg, i) => (
              <div key={i} className="flex">
                <span className="text-orange-600 mr-2">&gt;</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

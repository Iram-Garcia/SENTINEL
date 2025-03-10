import React, { useState } from 'react'
import { Satellite, BatteryFull, SignalHigh } from 'lucide-react';
import { cn } from "../utils";

function StatusBar({ missionTime, satellites, connected, RSSI, battery }) {
    const [showConsoleOutput, setShowConsoleOutput] = useState(false);

    function secondsToHHMMSS(seconds) {
        // Parse the input to number if it's a string
        const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
        
        if (isNaN(totalSeconds)) return '00:00:00';
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
    
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    }

    return (
        <div className="w-full h-14 bg-red-700 flex flex-row items-center justify-between px-4 border-b-2 border-red-700" data-tauri-drag-region>

            <div className="flex flex-col items-center font-mono text-white">
                <p className="text-white">Mission Clock</p>
                <p>{secondsToHHMMSS(missionTime)}</p>
            </div>

            <div className="flex flex-col items-center font-mono text-white">
                <p className="text-white">Satellites</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{satellites}</p>
                    <Satellite size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono text-white">
                <p className="text-white">Status</p>
                <p className={cn("font-semibold", {
                    "text-red-600": !connected,
                    "text-green-600": connected
                })}>{connected ? "CONNECTED" : "DISCONNECTED"}</p>
            </div>

            <div className="flex flex-col items-center font-mono text-white">
                <p className="text-white">Signal</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{Math.round(RSSI)} dBm</p>
                    <SignalHigh size={18} />
                </div>
            </div>

            <div className="flex flex-col items-center font-mono text-white">
                <p className="text-white">Battery</p>
                <div className="flex flex-row items-center gap-2">
                    <p>{Math.floor(battery)}%</p>
                    <BatteryFull size={18} />
                </div>
            </div>
        </div>
    )
}

export default StatusBar